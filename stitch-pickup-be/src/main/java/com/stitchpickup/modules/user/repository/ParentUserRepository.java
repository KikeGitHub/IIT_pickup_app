package com.stitchpickup.modules.user.repository;

import com.stitchpickup.modules.user.entity.ParentUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA para usuarios padre.
 *
 * SOLID — S: Solo acceso a datos. Lógica de negocio en ParentUserService.
 * SOLID — D: Spring provee la implementación en runtime.
 */
@Repository
public interface ParentUserRepository extends JpaRepository<ParentUser, UUID> {

    Optional<ParentUser> findByEmail(String email);

    boolean existsByEmail(String email);

    /** Carga al padre con sus alumnos en una sola consulta (evita N+1) */
    @Query("SELECT p FROM ParentUser p LEFT JOIN FETCH p.students WHERE p.email = :email")
    Optional<ParentUser> findByEmailWithStudents(@Param("email") String email);

    @Query("SELECT p FROM ParentUser p LEFT JOIN FETCH p.students WHERE p.id = :id")
    Optional<ParentUser> findByIdWithStudents(@Param("id") UUID id);
}
