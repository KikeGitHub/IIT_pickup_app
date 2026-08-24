package com.stitchpickup.modules.alert.entity;

import com.stitchpickup.modules.student.entity.Student;
import com.stitchpickup.modules.user.entity.ParentUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad: Alerta de Proximidad
 *
 * Registra la señal enviada por el padre al acercarse al plantel.
 * Incluye `clientId` para deduplicación offline (ADR-002).
 */
@Entity
@Table(name = "alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", nullable = false)
    private ParentUser parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "pickup_method", nullable = false)
    @Builder.Default
    private PickupMethod pickupMethod = PickupMethod.CAR;

    @Column(name = "client_id", unique = true)
    private UUID clientId;

    @CreationTimestamp
    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;

    @Column(name = "received_at")
    private Instant receivedAt;

    public enum AlertStatus {
        TEN_MIN, FIVE_MIN, EN_FILA, URGENTE
    }

    public enum PickupMethod {
        CAR, WALK
    }
}
