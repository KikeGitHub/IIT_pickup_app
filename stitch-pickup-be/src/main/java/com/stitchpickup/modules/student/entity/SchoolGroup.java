package com.stitchpickup.modules.student.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad: Grupo Escolar
 *
 * Agrupa a los alumnos por nivel y nombre de grupo (ej: PRIMARIA - 3A).
 * Utilizado para filtrar el monitor de entregas por sección.
 */
@Entity
@Table(name = "school_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Student.SchoolLevel level;

    @Column(nullable = false, length = 20)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
