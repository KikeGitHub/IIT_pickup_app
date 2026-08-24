package com.stitchpickup.modules.student.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Entidad: Familiar Autorizado
 *
 * Registra los familiares o personas autorizadas para recoger al alumno.
 */
@Entity
@Table(name = "family_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamilyMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 50)
    private String relationship;

    @Column(length = 20)
    private String phone;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean authorized = true;
}
