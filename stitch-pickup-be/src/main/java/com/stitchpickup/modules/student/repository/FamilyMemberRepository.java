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
}
