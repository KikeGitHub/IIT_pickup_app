package com.stitchpickup.modules.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Entidad: Usuario Maestro / Personal Escolar
 *
 * El campo `role` discrimina entre TEACHER y ADMIN.
 * ADMIN tiene acceso completo a la plataforma (CRUD, KPIs, importaciones).
 * TEACHER solo accede al monitor de entregas y su grupo asignado.
 *
 * SOLID — S: Solo almacena datos del maestro.
 */
@Entity
@Table(name = "teacher_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(nullable = false, unique = true, length = 200)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    /** TEACHER, ADMIN o MONITOR */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "TEACHER";

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private SchoolLevel level;

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

    // ─── Grupos asignados ────────────────────────────────────────────────────
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "teacher_groups",
        joinColumns = @JoinColumn(name = "teacher_id"),
        inverseJoinColumns = @JoinColumn(name = "group_id")
    )
    @Builder.Default
    private Set<com.stitchpickup.modules.student.entity.SchoolGroup> groups = new HashSet<>();

    public enum SchoolLevel {
        KINDER, PRIMARIA, SECUNDARIA
    }
}
