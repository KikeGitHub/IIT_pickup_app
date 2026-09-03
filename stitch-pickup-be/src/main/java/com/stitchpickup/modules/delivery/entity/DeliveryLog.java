package com.stitchpickup.modules.delivery.entity;

import com.stitchpickup.modules.alert.entity.Alert;
import com.stitchpickup.modules.student.entity.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Entidad: Bitácora de Entrega
 *
 * Registra el ciclo de entrega diario por alumno.
 *
 * Estados del ciclo:
 *   ENTREGADO_ESCUELA  → Maestro despacha al alumno en la puerta
 *   RECIBIDO_PADRE     → Padre confirma que ya lo recibió
 *   RECHAZADO_PADRE    → Padre reporta que NO recibió al alumno (error de entrega)
 *   REVERTIDO_DOCENTE  → Maestro/Admin deshace la entrega (alumno regresa al board)
 */
@Entity
@Table(name = "delivery_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id")
    private Alert alert;

    @Column(name = "teacher_name", length = 150)
    private String teacherName;

    @Enumerated(EnumType.STRING)
    @Column(name = "pickup_method")
    private Alert.PickupMethod pickupMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus status;

    @Column(name = "teacher_confirmed_at")
    private Instant teacherConfirmedAt;

    @Column(name = "parent_confirmed_at")
    private Instant parentConfirmedAt;

    /** Marca el momento en que el padre rechaza la entrega. */
    @Column(name = "parent_rejected_at")
    private Instant parentRejectedAt;

    /** Marca el momento en que el maestro/admin revierte la entrega. */
    @Column(name = "reverted_at")
    private Instant revertedAt;

    /** Nombre de quien realizó la reversión (para auditoría). */
    @Column(name = "reverted_by", length = 150)
    private String revertedBy;

    @Column(name = "log_date", nullable = false)
    @Builder.Default
    private LocalDate logDate = LocalDate.now();

    public enum DeliveryStatus {
        /** Maestro confirmó que el alumno está en la puerta */
        ENTREGADO_ESCUELA,
        /** Padre confirmó que ya recibió a su hijo */
        RECIBIDO_PADRE,
        /** Padre reportó que NO recibió al alumno — error de entrega */
        RECHAZADO_PADRE,
        /** Maestro/Admin deshizo la entrega — alumno regresa al board activo */
        REVERTIDO_DOCENTE
    }
}
