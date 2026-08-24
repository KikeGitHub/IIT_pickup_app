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
 * Flujo:
 *   1. Maestro/guardia llama a dispatch(alertId, teacherName)
 *   2. Se crea o actualiza el DeliveryLog del día para ese alumno
 *   3. Se emite WebSocket broadcast a /topic/deliveries
 *   4. Se notifica al padre vía /user/{parentId}/queue/delivery
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
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public DeliveryLogResponse confirmByParent(UUID deliveryId) {
        DeliveryLog log = deliveryLogRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Entrega no encontrada"));

        log.setStatus(DeliveryLog.DeliveryStatus.RECIBIDO_PADRE);
        log.setParentConfirmedAt(Instant.now());
        DeliveryLog saved = deliveryLogRepository.save(log);
        DeliveryLogResponse response = mapToResponse(saved);

        publisher.publishDelivery(response);
        return response;
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
                d.getLogDate()
        );
    }
}
