package com.stitchpickup.modules.user.repository;

import com.stitchpickup.modules.user.entity.TeacherUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA para usuarios maestros y admin.
 *
 * SOLID — S: Solo acceso a datos. Lógica de negocio en TeacherUserService.
 */
@Repository
public interface TeacherUserRepository extends JpaRepository<TeacherUser, UUID> {

    Optional<TeacherUser> findByEmail(String email);

    boolean existsByEmail(String email);

    /** Carga maestro con sus grupos asignados */
    @Query("SELECT t FROM TeacherUser t LEFT JOIN FETCH t.groups WHERE t.email = :email")
    Optional<TeacherUser> findByEmailWithGroups(@Param("email") String email);

    /** Carga maestro por ID con sus grupos asignados */
    @Query("SELECT t FROM TeacherUser t LEFT JOIN FETCH t.groups WHERE t.id = :id")
    Optional<TeacherUser> findByIdWithGroups(@Param("id") UUID id);
}
