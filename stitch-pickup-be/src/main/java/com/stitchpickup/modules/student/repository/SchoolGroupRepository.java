package com.stitchpickup.modules.student.repository;

import com.stitchpickup.modules.student.entity.SchoolGroup;
import com.stitchpickup.modules.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SchoolGroupRepository extends JpaRepository<SchoolGroup, UUID> {
    Optional<SchoolGroup> findByLevelAndName(Student.SchoolLevel level, String name);
    List<SchoolGroup> findAllByOrderByLevelAscNameAsc();
    List<SchoolGroup> findByLevel(Student.SchoolLevel level);
}
