package com.stitchpickup.modules.alert.service;

import com.stitchpickup.modules.alert.dto.CreateAlertRequest;
import com.stitchpickup.modules.alert.dto.AlertResponse;
import com.stitchpickup.modules.alert.entity.Alert;
import com.stitchpickup.modules.alert.repository.AlertRepository;
import com.stitchpickup.modules.student.entity.Student;
import com.stitchpickup.modules.student.repository.StudentRepository;
import com.stitchpickup.modules.user.entity.ParentUser;
import com.stitchpickup.modules.user.entity.TeacherUser;
import com.stitchpickup.modules.user.repository.ParentUserRepository;
import com.stitchpickup.modules.user.repository.TeacherUserRepository;
import com.stitchpickup.websocket.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final AlertRepository alertRepository;
    private final ParentUserRepository parentUserRepository;
    private final StudentRepository studentRepository;
    private final TeacherUserRepository teacherUserRepository;
    private final NotificationPublisher publisher;

    @Transactional
    public AlertResponse createAlert(UUID parentId, CreateAlertRequest request) {
        // Deduplicación por clientId (ADR-002: Offline Queue)
        if (request.clientId() != null && !request.clientId().isBlank()) {
            UUID clientIdUuid = UUID.fromString(request.clientId());
            var existing = alertRepository.findByClientId(clientIdUuid);
            if (existing.isPresent()) {
                log.info("Alerta duplicada omitida por clientId: {}", request.clientId());
                return mapToResponse(existing.get());
            }
        }

        ParentUser parent = parentUserRepository.findByIdWithStudents(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Padre no encontrado"));

        Student student = studentRepository.findById(UUID.fromString(request.studentId()))
                .orElseThrow(() -> new IllegalArgumentException("Alumno no encontrado"));

        boolean isMyChild = parent.getStudents().stream().anyMatch(s -> s.getId().equals(student.getId()));
        if (!isMyChild) {
            throw new SecurityException("No tienes autorización para emitir alertas para este alumno.");
        }

        Alert.AlertStatus statusEnum = Alert.AlertStatus.valueOf(request.status());
        Alert.PickupMethod methodEnum = Alert.PickupMethod.valueOf(request.pickupMethod());

        Alert alert = Alert.builder()
                .parent(parent)
                .student(student)
                .status(statusEnum)
                .pickupMethod(methodEnum)
                .clientId(request.clientId() != null && !request.clientId().isBlank() ? UUID.fromString(request.clientId()) : null)
                .receivedAt(Instant.now())
                .build();

        Alert saved = alertRepository.save(alert);
        AlertResponse response = mapToResponse(saved);

        // Broadcast a WebSocket /topic/school/alerts via NotificationPublisher
        publisher.publishAlert(response);

        return response;
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> getTodayAlerts() {
        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = LocalDate.now().atStartOfDay(zone).toInstant();
        Instant endOfDay = LocalDate.now().plusDays(1).atStartOfDay(zone).toInstant();

        return alertRepository.findTodayAlerts(startOfDay, endOfDay)
                .stream().map(this::mapToResponse).toList();
    }

    /**
     * Devuelve la última alerta por alumno del día (ADMIN — ve todos los alumnos).
     */
    @Transactional(readOnly = true)
    public List<AlertResponse> getTodayAlertsGrouped() {
        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = LocalDate.now().atStartOfDay(zone).toInstant();
        Instant endOfDay = LocalDate.now().plusDays(1).atStartOfDay(zone).toInstant();

        return alertRepository.findLatestAlertPerStudentToday(startOfDay, endOfDay)
                .stream().map(this::mapToResponse).toList();
    }

    /**
     * Devuelve la última alerta por alumno del día filtrada por los grupos
     * asignados al maestro (TEACHER — solo ve alumnos de sus grupos).
     */
    @Transactional(readOnly = true)
    public List<AlertResponse> getTodayAlertsGroupedForTeacher(UUID teacherId) {
        TeacherUser teacher = teacherUserRepository.findByIdWithGroups(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Maestro no encontrado"));

        List<UUID> groupIds = teacher.getGroups().stream()
                .map(g -> g.getId())
                .toList();

        if (groupIds.isEmpty()) {
            log.warn("Maestro {} no tiene grupos asignados", teacher.getEmail());
            return List.of();
        }

        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = LocalDate.now().atStartOfDay(zone).toInstant();
        Instant endOfDay = LocalDate.now().plusDays(1).atStartOfDay(zone).toInstant();

        return alertRepository.findLatestAlertPerStudentTodayByGroups(startOfDay, endOfDay, groupIds)
                .stream().map(this::mapToResponse).toList();
    }

    private AlertResponse mapToResponse(Alert alert) {
        String groupName = alert.getStudent().getGroup() != null ? alert.getStudent().getGroup().getName() : "";
        return new AlertResponse(
                alert.getId().toString(),
                alert.getParent().getId().toString(),
                alert.getParent().getNombre(),
                alert.getStudent().getId().toString(),
                alert.getStudent().getName(),
                alert.getStudent().getLevel().name(),
                groupName,
                alert.getStatus().name(),
                alert.getPickupMethod().name(),
                alert.getClientId() != null ? alert.getClientId().toString() : null,
                alert.getSentAt(),
                alert.getReceivedAt()
        );
    }
}
