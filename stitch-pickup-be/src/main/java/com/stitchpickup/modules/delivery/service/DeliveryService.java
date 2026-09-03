package com.stitchpickup.modules.delivery.service;

import com.stitchpickup.modules.alert.entity.Alert;
import com.stitchpickup.modules.alert.repository.AlertRepository;
import com.stitchpickup.modules.delivery.dto.DeliveryLogResponse;
import com.stitchpickup.modules.delivery.entity.DeliveryLog;
import com.stitchpickup.modules.delivery.repository.DeliveryLogRepository;
import com.stitchpickup.websocket.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DeliveryService — Gestión del ciclo de entrega.
 *
 * Flujo principal:
 *   1. Maestro/guardia llama a dispatch(alertId, teacherName)
 *   2. Se crea o actualiza el DeliveryLog del día para ese alumno
 *   3. Se emite WebSocket broadcast a /topic/deliveries
 *   4. Se notifica al padre vía /user/{parentId}/queue/delivery
 *
 * Flujo de corrección:
 *   - parentReject(id, parentId)      → Padre rechaza; alumno vuelve al board como URGENTE
 *   - revertDelivery(id, teacherName) → Maestro/Admin deshace entrega; alumno regresa al board
 *
 * SOLID — S: Solo lógica de entrega. No maneja HTTP.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryService {

    private final DeliveryLogRepository deliveryLogRepository;
    private final AlertRepository alertRepository;
    private final NotificationPublisher publisher;

    @Transactional
    public DeliveryLogResponse dispatch(UUID alertId, String teacherName) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alerta no encontrada: " + alertId));

        UUID studentId = alert.getStudent().getId();
        LocalDate today = LocalDate.now();

        // Upsert: si ya existe un registro hoy, actualizarlo
        DeliveryLog log = deliveryLogRepository.findByStudentIdAndLogDate(studentId, today)
                .orElse(DeliveryLog.builder()
                        .student(alert.getStudent())
                        .alert(alert)
                        .logDate(today)
                        .build());

        log.setTeacherName(teacherName);
        log.setPickupMethod(alert.getPickupMethod());
        log.setStatus(DeliveryLog.DeliveryStatus.ENTREGADO_ESCUELA);
        log.setTeacherConfirmedAt(Instant.now());
        // Limpiar campos de reversión previos si se re-despacha
        log.setParentRejectedAt(null);
        log.setRevertedAt(null);
        log.setRevertedBy(null);

        DeliveryLog saved = deliveryLogRepository.save(log);
        DeliveryLogResponse response = mapToResponse(saved);

        // Broadcast a monitores
        publisher.publishDelivery(response);

        // Notificación privada al padre
        String parentId = alert.getParent().getId().toString();
        publisher.notifyParentDeliveryReady(parentId, response);

        return response;
    }

    @Transactional(readOnly = true)
    public List<DeliveryLogResponse> getTodayDeliveries() {
        return deliveryLogRepository.findByLogDateWithStudent(LocalDate.now())
                .stream()
                .filter(d -> d.getStatus() != DeliveryLog.DeliveryStatus.REVERTIDO_DOCENTE)
                .map(this::mapToResponse).toList();
    }

    @Transactional
    public DeliveryLogResponse confirmByParent(UUID deliveryId, UUID parentId) {
        DeliveryLog log = deliveryLogRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Entrega no encontrada"));

        if (log.getAlert() != null && !log.getAlert().getParent().getId().equals(parentId)) {
            throw new SecurityException("No tienes autorización para confirmar esta entrega.");
        }

        log.setStatus(DeliveryLog.DeliveryStatus.RECIBIDO_PADRE);
        log.setParentConfirmedAt(Instant.now());
        DeliveryLog saved = deliveryLogRepository.save(log);
        DeliveryLogResponse response = mapToResponse(saved);

        publisher.publishDelivery(response);
        return response;
    }

    /**
     * parentReject — El padre reporta que NO ha recibido a su hijo.
     *
     * Efecto:
     *   1. El DeliveryLog queda en estado RECHAZADO_PADRE (permanece en el historial).
     *   2. Se re-activa la Alerta del alumno en estado URGENTE.
     *   3. Se emite WebSocket a /topic/school/alerts (el alumno aparece en el board con badge 🚨).
     *   4. Se emite WebSocket a /topic/deliveries para que el monitor lo quite de "Entregados Hoy".
     */
    @Transactional
    public DeliveryLogResponse parentReject(UUID deliveryId, UUID parentId) {
        DeliveryLog deliveryLog = deliveryLogRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Entrega no encontrada: " + deliveryId));

        if (deliveryLog.getStatus() == DeliveryLog.DeliveryStatus.RECIBIDO_PADRE) {
            throw new IllegalStateException("No se puede rechazar una entrega ya confirmada por el padre.");
        }

        if (deliveryLog.getAlert() != null && !deliveryLog.getAlert().getParent().getId().equals(parentId)) {
            throw new SecurityException("No tienes autorización para rechazar esta entrega.");
        }

        deliveryLog.setStatus(DeliveryLog.DeliveryStatus.RECHAZADO_PADRE);
        deliveryLog.setParentRejectedAt(Instant.now());
        DeliveryLog saved = deliveryLogRepository.save(deliveryLog);
        DeliveryLogResponse response = mapToResponse(saved);

        log.info("[Delivery] ⚠️ Padre rechazó entrega. DeliveryId={} Alumno={}",
                deliveryId, saved.getStudent().getName());

        // Reactivar la alerta del alumno en estado URGENTE
        if (saved.getAlert() != null) {
            Alert alert = saved.getAlert();
            alert.setStatus(Alert.AlertStatus.URGENTE);
            alertRepository.save(alert);
            log.info("[Delivery] 🔁 Alerta reactivada como URGENTE para alumno={}", saved.getStudent().getName());

            // Emitir alerta de alerta reactivada al monitor
            publisher.publishRejectedDeliveryAlert(response);
        }

        // Emitir actualización de entrega (cambia status → RECHAZADO_PADRE)
        publisher.publishDelivery(response);

        return response;
    }

    /**
     * revertDelivery — Maestro o Admin deshace una entrega errónea.
     *
     * Efecto:
     *   1. El DeliveryLog queda en estado REVERTIDO_DOCENTE (queda en bitácora para auditoría).
     *   2. La tarjeta del alumno reaparece en el board en su estado anterior (EN_FILA por defecto).
     *   3. Se emite WebSocket al monitor y al celular del padre para cerrar el modal.
     */
    @Transactional
    public DeliveryLogResponse revertDelivery(UUID deliveryId, String revertedBy) {
        DeliveryLog deliveryLog = deliveryLogRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Entrega no encontrada: " + deliveryId));

        if (deliveryLog.getStatus() == DeliveryLog.DeliveryStatus.RECIBIDO_PADRE) {
            throw new IllegalStateException("No se puede revertir una entrega ya confirmada por el padre.");
        }

        deliveryLog.setStatus(DeliveryLog.DeliveryStatus.REVERTIDO_DOCENTE);
        deliveryLog.setRevertedAt(Instant.now());
        deliveryLog.setRevertedBy(revertedBy);
        DeliveryLog saved = deliveryLogRepository.save(deliveryLog);
        DeliveryLogResponse response = mapToResponse(saved);

        log.info("[Delivery] 🔄 Entrega revertida por {}. DeliveryId={} Alumno={}",
                revertedBy, deliveryId, saved.getStudent().getName());

        // Reactivar la alerta del alumno en estado EN_FILA
        if (saved.getAlert() != null) {
            Alert alert = saved.getAlert();
            alert.setStatus(Alert.AlertStatus.EN_FILA);
            alertRepository.save(alert);
            log.info("[Delivery] 🔁 Alerta reactivada como EN_FILA para alumno={}", saved.getStudent().getName());

            // Notificar al monitor que el alumno vuelve al board
            publisher.publishRevertedDelivery(response);

            // Notificar al padre que la entrega fue cancelada
            String parentId = alert.getParent().getId().toString();
            publisher.notifyParentDeliveryReverted(parentId, response);
        }

        // Broadcast final del estado REVERTIDO para que el historial del monitor lo actualice
        publisher.publishDelivery(response);

        return response;
    }

    @Transactional(readOnly = true)
    public List<com.stitchpickup.modules.delivery.dto.ParentDayHistoryEventResponse> getTodayEventsForStudent(UUID studentId) {
        java.time.ZoneId zoneId = java.time.ZoneId.of("America/Mexico_City");
        LocalDate today = LocalDate.now(zoneId);
        Instant startOfDay = today.atStartOfDay(zoneId).toInstant();
        java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm").withZone(zoneId);

        List<com.stitchpickup.modules.delivery.dto.ParentDayHistoryEventResponse> events = new java.util.ArrayList<>();

        // 1. Alertas enviadas hoy por el padre
        List<Alert> alerts = alertRepository.findLatestTodayAlertForStudent(studentId, startOfDay);
        for (Alert a : alerts) {
            String statusLabel = switch (a.getStatus().name()) {
                case "TEN_MIN" -> "10 MIN";
                case "FIVE_MIN" -> "5 MIN";
                case "EN_FILA" -> "En Fila";
                case "URGENTE" -> "Urgente";
                default -> a.getStatus().name();
            };
            String methodLabel = (a.getPickupMethod() == Alert.PickupMethod.CAR) ? "En Auto" : "A Pie";
            events.add(new com.stitchpickup.modules.delivery.dto.ParentDayHistoryEventResponse(
                timeFormatter.format(a.getSentAt()),
                "Alerta Enviada (" + statusLabel + ")",
                "Enviada en modalidad " + methodLabel,
                "ALERT",
                a.getSentAt()
            ));
        }

        // 2. Registro de entrega (despacho, confirmación, rechazo o reversión)
        deliveryLogRepository.findByStudentIdAndLogDate(studentId, today).ifPresent(d -> {
            if (d.getTeacherConfirmedAt() != null) {
                events.add(new com.stitchpickup.modules.delivery.dto.ParentDayHistoryEventResponse(
                    timeFormatter.format(d.getTeacherConfirmedAt()),
                    "Alumno Despachado",
                    "Entregado en puerta por " + (d.getTeacherName() != null ? d.getTeacherName() : "Docente"),
                    "DISPATCHED",
                    d.getTeacherConfirmedAt()
                ));
            }
            if (d.getParentConfirmedAt() != null) {
                events.add(new com.stitchpickup.modules.delivery.dto.ParentDayHistoryEventResponse(
                    timeFormatter.format(d.getParentConfirmedAt()),
                    "Recepción Confirmada",
                    "Alumno recibido por el tutor familiar",
                    "RECEIVED",
                    d.getParentConfirmedAt()
                ));
            }
            if (d.getParentRejectedAt() != null) {
                events.add(new com.stitchpickup.modules.delivery.dto.ParentDayHistoryEventResponse(
                    timeFormatter.format(d.getParentRejectedAt()),
                    "⚠️ Entrega Reportada No Recibida",
                    "El padre/tutor reportó no haber recibido al alumno",
                    "REJECTED",
                    d.getParentRejectedAt()
                ));
            }
            if (d.getRevertedAt() != null) {
                events.add(new com.stitchpickup.modules.delivery.dto.ParentDayHistoryEventResponse(
                    timeFormatter.format(d.getRevertedAt()),
                    "🔄 Entrega Corregida",
                    "Entrega revertida por " + (d.getRevertedBy() != null ? d.getRevertedBy() : "Docente") + ". El alumno regresó al board.",
                    "REVERTED",
                    d.getRevertedAt()
                ));
            }
        });

        // Ordenar del más reciente al más antiguo
        events.sort(java.util.Comparator.comparing(com.stitchpickup.modules.delivery.dto.ParentDayHistoryEventResponse::timestamp).reversed());
        return events;
    }

    private DeliveryLogResponse mapToResponse(DeliveryLog d) {
        String groupName = d.getStudent().getGroup() != null ? d.getStudent().getGroup().getName() : "";
        return new DeliveryLogResponse(
                d.getId().toString(),
                d.getStudent().getId().toString(),
                d.getStudent().getName(),
                d.getStudent().getLevel().name(),
                groupName,
                d.getTeacherName(),
                d.getPickupMethod() != null ? d.getPickupMethod().name() : null,
                d.getStatus().name(),
                d.getTeacherConfirmedAt(),
                d.getParentConfirmedAt(),
                d.getParentRejectedAt(),
                d.getRevertedAt(),
                d.getRevertedBy(),
                d.getLogDate()
        );
    }
}
