package com.stitchpickup.modules.student.repository;

import com.stitchpickup.modules.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repositorio JPA para alumnos.
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {

    List<Student> findByActiveTrue();

    /** Alumnos vinculados a un padre específico */
    @Query("""
        SELECT s FROM Student s
        JOIN ParentUser p ON s MEMBER OF p.students
        WHERE p.id = :parentId AND s.active = true
        """)
    List<Student> findActiveStudentsByParentId(@Param("parentId") UUID parentId);

    List<Student> findByLevelAndActiveTrue(Student.SchoolLevel level);

    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.group WHERE s.active = true ORDER BY s.name")
    List<Student> findAllActiveWithGroup();
}
