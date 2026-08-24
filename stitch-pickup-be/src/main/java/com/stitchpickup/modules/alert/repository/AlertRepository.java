package com.stitchpickup.modules.alert.repository;

import com.stitchpickup.modules.alert.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlertRepository extends JpaRepository<Alert, UUID> {

    Optional<Alert> findByClientId(UUID clientId);

    @Query("""
        SELECT a FROM Alert a
        JOIN FETCH a.student s
        JOIN FETCH a.parent p
        WHERE a.sentAt >= :startOfDay AND a.sentAt <= :endOfDay
        ORDER BY a.sentAt DESC
        """)
    List<Alert> findTodayAlerts(@Param("startOfDay") Instant startOfDay, @Param("endOfDay") Instant endOfDay);

    @Query("""
        SELECT a FROM Alert a
        WHERE a.student.id = :studentId AND a.sentAt >= :startOfDay
        ORDER BY a.sentAt DESC
        """)
    List<Alert> findLatestTodayAlertForStudent(@Param("studentId") UUID studentId, @Param("startOfDay") Instant startOfDay);

    /**
     * Devuelve la alerta más reciente de cada alumno para el día de hoy.
     * Agrupa por student_id y toma la que tiene sentAt más reciente.
     */
    @Query("""
        SELECT a FROM Alert a
        JOIN FETCH a.student s
        LEFT JOIN FETCH s.group
        JOIN FETCH a.parent p
        WHERE a.sentAt >= :startOfDay AND a.sentAt < :endOfDay
        AND a.sentAt = (
            SELECT MAX(a2.sentAt) FROM Alert a2
            WHERE a2.student.id = a.student.id
            AND a2.sentAt >= :startOfDay AND a2.sentAt < :endOfDay
        )
        ORDER BY a.sentAt DESC
        """)
    List<Alert> findLatestAlertPerStudentToday(
            @Param("startOfDay") Instant startOfDay,
            @Param("endOfDay") Instant endOfDay);

    /**
     * Igual que findLatestAlertPerStudentToday pero filtrado por grupos del maestro.
     * Solo devuelve alertas de alumnos cuyos group_id esté en la lista proporcionada.
     */
    @Query("""
        SELECT a FROM Alert a
        JOIN FETCH a.student s
        LEFT JOIN FETCH s.group g
        JOIN FETCH a.parent p
        WHERE a.sentAt >= :startOfDay AND a.sentAt < :endOfDay
        AND s.group.id IN :groupIds
        AND a.sentAt = (
            SELECT MAX(a2.sentAt) FROM Alert a2
            WHERE a2.student.id = a.student.id
            AND a2.sentAt >= :startOfDay AND a2.sentAt < :endOfDay
        )
        ORDER BY a.sentAt DESC
        """)
    List<Alert> findLatestAlertPerStudentTodayByGroups(
            @Param("startOfDay") Instant startOfDay,
            @Param("endOfDay") Instant endOfDay,
            @Param("groupIds") List<UUID> groupIds);
}
