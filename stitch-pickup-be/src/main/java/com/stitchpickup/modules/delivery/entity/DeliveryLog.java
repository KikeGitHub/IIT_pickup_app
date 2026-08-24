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

    @Column(name = "log_date", nullable = false)
    @Builder.Default
    private LocalDate logDate = LocalDate.now();

    public enum DeliveryStatus {
        ENTREGADO_ESCUELA, RECIBIDO_PADRE
    }
}
