package com.stitchpickup.modules.student.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Entidad: Alumno
 *
 * Representa a un alumno inscrito en el IIT.
 * Está vinculado a un grupo escolar y puede tener múltiples familiares autorizados.
 *
 * SOLID — S: Solo datos del alumno. Lógica en StudentService.
 */
@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private SchoolLevel level;

    @Column(length = 50)
    private String grade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private SchoolGroup group;

    private LocalDate birthday;

    @Column(length = 1)
    private String gender;

    @Column(length = 18)
    private String curp;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum SchoolLevel {
        KINDER, PRIMARIA, SECUNDARIA
    }
}
