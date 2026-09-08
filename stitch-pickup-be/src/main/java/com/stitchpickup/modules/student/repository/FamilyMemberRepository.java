package com.stitchpickup.modules.student.repository;

import com.stitchpickup.modules.student.entity.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FamilyMemberRepository extends JpaRepository<FamilyMember, UUID> {
    List<FamilyMember> findByStudentId(UUID studentId);
    List<FamilyMember> findByStudentIdAndAuthorizedTrue(UUID studentId);
    void deleteByStudentId(UUID studentId);

    /**
     * Carga todos los tutores de una lista de alumnos en UNA sola query SQL (IN clause).
     * Usado en StudentAdminService.getAllStudents() para evitar N+1 queries.
     */
    List<FamilyMember> findByStudentIdIn(java.util.Collection<UUID> studentIds);

}
