package com.stitchpickup.modules.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Entidad: Usuario Padre de Familia
 *
 * Representa al padre/tutor autorizado para recoger al alumno.
 * Un padre puede tener múltiples alumnos vinculados (relación N:M).
 *
 * SOLID — S: Solo almacena datos del padre. La lógica de negocio está en ParentUserService.
 */
@Entity
@Table(name = "parent_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParentUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(nullable = false, unique = true, length = 200)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(length = 20)
    private String phone;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "temp_password", nullable = false)
    @Builder.Default
    private Boolean tempPassword = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_login")
    private Instant lastLogin;

    // ─── Relación N:M con Students ───────────────────────────────────────────
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "parent_students",
        joinColumns = @JoinColumn(name = "parent_id"),
        inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    @Builder.Default
    private Set<com.stitchpickup.modules.student.entity.Student> students = new HashSet<>();
}
