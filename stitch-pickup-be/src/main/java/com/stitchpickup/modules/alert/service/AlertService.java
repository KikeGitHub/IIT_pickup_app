package com.stitchpickup.modules.alert.service;

import com.stitchpickup.modules.alert.dto.CreateAlertRequest;
import com.stitchpickup.modules.alert.dto.SimulateAlertRequest;
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
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private static final ZoneId MEXICO_ZONE = ZoneId.of("America/Mexico_City");

    private final AlertRepository alertRepository;
    private final ParentUserRepository parentUserRepository;
    private final StudentRepository studentRepository;
    private final TeacherUserRepository teacherUserRepository;
    private final com.stitchpickup.modules.student.repository.SchoolGroupRepository schoolGroupRepository;
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

        if (Boolean.FALSE.equals(student.getActive())) {
            throw new IllegalArgumentException("El alumno se encuentra inactivo o dado de baja en el sistema.");
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
        Instant startOfDay = LocalDate.now(MEXICO_ZONE).atStartOfDay(MEXICO_ZONE).toInstant();
        Instant endOfDay = LocalDate.now(MEXICO_ZONE).plusDays(1).atStartOfDay(MEXICO_ZONE).toInstant();

        return alertRepository.findTodayAlerts(startOfDay, endOfDay)
                .stream().map(this::mapToResponse).toList();
    }

    /**
     * Devuelve la última alerta por alumno del día (ADMIN — ve todos los alumnos).
     */
    @Transactional(readOnly = true)
    public List<AlertResponse> getTodayAlertsGrouped() {
        Instant startOfDay = LocalDate.now(MEXICO_ZONE).atStartOfDay(MEXICO_ZONE).toInstant();
        Instant endOfDay = LocalDate.now(MEXICO_ZONE).plusDays(1).atStartOfDay(MEXICO_ZONE).toInstant();

        return alertRepository.findLatestAlertPerStudentToday(startOfDay, endOfDay)
                .stream().map(this::mapToResponse).toList();
    }

    /**
     * Devuelve la última alerta por alumno del día filtrada por los grupos
     * asignados al maestro (TEACHER — solo ve alumnos de sus grupos o de su nivel educativo).
     */
    @Transactional(readOnly = true)
    public List<AlertResponse> getTodayAlertsGroupedForTeacher(UUID teacherId) {
        TeacherUser teacher = teacherUserRepository.findByIdWithGroups(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Maestro no encontrado"));

        List<UUID> groupIds = teacher.getGroups() != null
                ? teacher.getGroups().stream().map(com.stitchpickup.modules.student.entity.SchoolGroup::getId).toList()
                : List.of();

        if (groupIds.isEmpty()) {
            log.info("Maestro {} no cuenta con grupos asignados. Retornando 0 alertas.", teacher.getEmail());
            return List.of();
        }

        Instant startOfDay = LocalDate.now(MEXICO_ZONE).atStartOfDay(MEXICO_ZONE).toInstant();
        Instant endOfDay = LocalDate.now(MEXICO_ZONE).plusDays(1).atStartOfDay(MEXICO_ZONE).toInstant();

        if (groupIds.isEmpty()) {
            // Fallback total: si no tiene grupos ni nivel específico, ver todas las alertas del colegio (monitor general)
            log.info("Maestro {} usando fallback global de alertas del día", teacher.getEmail());
            return alertRepository.findLatestAlertPerStudentToday(startOfDay, endOfDay)
                    .stream().map(this::mapToResponse).toList();
        }

        return alertRepository.findLatestAlertPerStudentTodayByGroups(startOfDay, endOfDay, groupIds)
                .stream().map(this::mapToResponse).toList();
    }

    /**
     * Devuelve la alerta más reciente del día de hoy para un alumno específico.
     * Permite a los padres de familia recuperar el estado exacto persistido en BD al recargar la página.
     */
    @Transactional(readOnly = true)
    public Optional<AlertResponse> getLatestTodayAlertForStudent(UUID studentId) {
        Instant startOfDay = LocalDate.now(MEXICO_ZONE).atStartOfDay(MEXICO_ZONE).toInstant();
        List<Alert> alerts = alertRepository.findLatestTodayAlertForStudent(studentId, startOfDay);
        if (alerts.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(mapToResponse(alerts.get(0)));
    }

    /**
     * Simula la llegada de un alumno para pruebas en vivo (Maestros, Admin y Monitores).
     * Permite probar notificaciones WebSocket, ordenamiento de tarjetas, cronómetro y cambio de color.
     */
    private static final String[] SIM_FIRST_NAMES = {
        "Santiago", "Mateo", "Sebastián", "Leonardo", "Matías", "Emiliano", "Diego", "Daniel",
        "Alexander", "Sofía", "Valentina", "Isabella", "Camila", "Valeria", "Mariana", "Luciana",
        "Regina", "Renata", "Victoria", "Natalia", "Alejandro", "Joaquín", "Nicolás", "Samuel",
        "Gabriel", "Gael", "Ángel", "Ximena", "Fernanda", "Andrea", "Daniela", "Elena", "Clara",
        "Mauricio", "Rodrigo", "Julieta", "Paula", "Felipe", "Manuel", "Bruno", "Esteban", "Pablo"
    };

    private static final String[] SIM_LAST_NAMES = {
        "Hernández", "García", "Martínez", "López", "González", "Pérez", "Rodríguez", "Sánchez",
        "Ramírez", "Cruz", "Flores", "Gómez", "Morales", "Vázquez", "Jiménez", "Reyes", "Díaz",
        "Torres", "Gutiérrez", "Ruiz", "Mendoza", "Aguilar", "Ortiz", "Moreno", "Castillo", "Navarro"
    };

    private String generateDynamicStudentName() {
        String first = SIM_FIRST_NAMES[(int) (Math.random() * SIM_FIRST_NAMES.length)];
        String last1 = SIM_LAST_NAMES[(int) (Math.random() * SIM_LAST_NAMES.length)];
        String last2 = SIM_LAST_NAMES[(int) (Math.random() * SIM_LAST_NAMES.length)];
        return first + " " + last1 + " " + last2;
    }

    /**
     * Simula la llegada de un alumno para pruebas en vivo (Maestros, Admin y Monitores).
     * Soporta alumnos ilimitados (25, 50, 100+): si los alumnos asignados ya tienen alerta hoy,
     * genera alumnos de prueba en el grupo del docente con IDs únicos para que cada alerta cree una card nueva.
     */
    @Transactional
    public AlertResponse simulateAlert(SimulateAlertRequest request, UUID requestingUserId, String role) {
        Student student = null;
        if (request != null && request.studentId() != null && !request.studentId().isBlank()) {
            try {
                student = studentRepository.findById(UUID.fromString(request.studentId())).orElse(null);
            } catch (Exception ignored) {}
        }

        // Obtener grupos asignados al maestro
        List<com.stitchpickup.modules.student.entity.SchoolGroup> teacherGroups = new java.util.ArrayList<>();
        if ("TEACHER".equals(role) && requestingUserId != null) {
            TeacherUser teacher = teacherUserRepository.findByIdWithGroups(requestingUserId).orElse(null);
            if (teacher != null && teacher.getGroups() != null && !teacher.getGroups().isEmpty()) {
                teacherGroups.addAll(teacher.getGroups());
            }
        }

        // Si no se especificó un alumno específico, priorizar uno del grupo que NO tenga alerta hoy
        if (student == null) {
            Instant startOfDay = LocalDate.now(MEXICO_ZONE).atStartOfDay(MEXICO_ZONE).toInstant();
            Instant endOfDay = LocalDate.now(MEXICO_ZONE).plusDays(1).atStartOfDay(MEXICO_ZONE).toInstant();
            java.util.Set<UUID> studentsWithAlertToday = alertRepository.findTodayAlerts(startOfDay, endOfDay)
                    .stream()
                    .map(a -> a.getStudent().getId())
                    .collect(java.util.stream.Collectors.toSet());

            if (!teacherGroups.isEmpty()) {
                for (var group : teacherGroups) {
                    List<Student> groupStudents = studentRepository.findByGroupId(group.getId());
                    List<Student> unalerted = groupStudents.stream()
                            .filter(s -> Boolean.TRUE.equals(s.getActive()) && !studentsWithAlertToday.contains(s.getId()))
                            .toList();
                    if (!unalerted.isEmpty()) {
                        student = unalerted.get((int) (Math.random() * unalerted.size()));
                        break;
                    }
                }
            } else if (!"TEACHER".equals(role)) {
                List<Student> allActive = studentRepository.findAllActiveWithGroup();
                List<Student> unalerted = allActive.stream()
                        .filter(s -> !studentsWithAlertToday.contains(s.getId()))
                        .toList();
                if (!unalerted.isEmpty()) {
                    student = unalerted.get((int) (Math.random() * unalerted.size()));
                }
            }
        }

        // Si todos los alumnos del grupo ya tienen alerta hoy o se solicita simulación masiva (25, 50, 100+):
        // Crear dinámicamente un alumno en el grupo del maestro para garantizar tarjeta nueva sin colisiones.
        if (student == null) {
            com.stitchpickup.modules.student.entity.SchoolGroup targetGroup = null;
            if (!teacherGroups.isEmpty()) {
                targetGroup = teacherGroups.get(0);
            } else {
                targetGroup = schoolGroupRepository.findAll().stream().findFirst().orElse(null);
            }

            String customName = (request != null && request.studentName() != null && !request.studentName().isBlank())
                    ? request.studentName()
                    : generateDynamicStudentName();

            Student.SchoolLevel level = (targetGroup != null && targetGroup.getLevel() != null)
                    ? Student.SchoolLevel.valueOf(targetGroup.getLevel().name())
                    : Student.SchoolLevel.PRIMARIA;

            student = Student.builder()
                    .name(customName)
                    .level(level)
                    .group(targetGroup)
                    .grade(targetGroup != null ? targetGroup.getName() : "Primaria")
                    .active(true)
                    .build();
            student = studentRepository.save(student);
        }

        // Obtener o asignar tutor para la alerta
        List<ParentUser> parents = parentUserRepository.findByStudentId(student.getId());
        ParentUser parent = null;
        if (!parents.isEmpty()) {
            parent = parents.get(0);
        } else {
            parent = parentUserRepository.findAll().stream().findFirst().orElseGet(() -> {
                ParentUser mockParent = ParentUser.builder()
                        .nombre("Tutor Simulación")
                        .email("tutor.simulacion@institutoingles.edu.mx")
                        .passwordHash("TEST_HASH")
                        .active(true)
                        .tempPassword(false)
                        .build();
                return parentUserRepository.save(mockParent);
            });
        }

        Alert.AlertStatus statusEnum = Alert.AlertStatus.EN_FILA;
        if (request != null && request.status() != null && !request.status().isBlank()) {
            try {
                statusEnum = Alert.AlertStatus.valueOf(request.status());
            } catch (Exception ignored) {}
        }

        Alert.PickupMethod methodEnum = Alert.PickupMethod.CAR;
        if (request != null && request.pickupMethod() != null && !request.pickupMethod().isBlank()) {
            try {
                methodEnum = Alert.PickupMethod.valueOf(request.pickupMethod());
            } catch (Exception ignored) {}
        }

        int minutesAgo = (request != null && request.minutesAgo() != null) ? Math.max(0, request.minutesAgo()) : 0;
        Instant sentAt = Instant.now().minus(java.time.Duration.ofMinutes(minutesAgo));

        Alert alert = Alert.builder()
                .parent(parent)
                .student(student)
                .status(statusEnum)
                .pickupMethod(methodEnum)
                .sentAt(sentAt)
                .receivedAt(Instant.now())
                .build();

        Alert saved = alertRepository.save(alert);
        AlertResponse response = mapToResponse(saved);

        log.info("[Simulation] 🧪 Simulación de alerta emitida: Alumno={} ({}) Estado={} minAtrás={}",
                response.studentName(), response.groupName(), response.status(), minutesAgo);

        // Notificar en tiempo real por WebSocket a todos los monitores
        publisher.publishAlert(response);

        return response;
    }

    /**
     * Simula un lote masivo de alumnos (5, 10, 25, 50, 100 sin límite).
     * Distribuye automáticamente niveles de urgencia y tiempos de llegada reales.
     */
    @Transactional
    public List<AlertResponse> simulateBatch(int count, UUID requestingUserId, String role) {
        int safeCount = Math.max(1, Math.min(count, 100));
        List<AlertResponse> responses = new java.util.ArrayList<>(safeCount);

        String[] methods = {"CAR", "WALK"};

        for (int i = 0; i < safeCount; i++) {
            String status;
            int minutesAgo;

            // Distribución realista de prioridades:
            // ~20% URGENTE (7 a 13 min atrás - tarjeta roja)
            // ~40% EN_FILA (3 a 6 min atrás - tarjeta ámbar)
            // ~25% FIVE_MIN (1 a 2 min atrás - tarjeta verde)
            // ~15% TEN_MIN (0 min - tarjeta verde)
            int mod = i % 10;
            if (mod < 2) {
                status = "URGENTE";
                minutesAgo = 8 + (i % 6);
            } else if (mod < 6) {
                status = "EN_FILA";
                minutesAgo = 3 + (i % 4);
            } else if (mod < 8) {
                status = "FIVE_MIN";
                minutesAgo = 1 + (i % 2);
            } else {
                status = "TEN_MIN";
                minutesAgo = 0;
            }

            String pickupMethod = methods[i % 2];
            SimulateAlertRequest req = new SimulateAlertRequest(null, null, status, pickupMethod, minutesAgo);
            responses.add(simulateAlert(req, requestingUserId, role));
        }

        log.info("[Simulation] 🚀 Batch masivo de {} alertas simuladas completado", safeCount);
        return responses;
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
