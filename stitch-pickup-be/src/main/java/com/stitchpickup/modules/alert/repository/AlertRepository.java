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
}
