package com.stitchpickup.modules.delivery.repository;

import com.stitchpickup.modules.delivery.entity.DeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeliveryLogRepository extends JpaRepository<DeliveryLog, UUID> {

    Optional<DeliveryLog> findByStudentIdAndLogDate(UUID studentId, LocalDate logDate);

    @Query("SELECT d FROM DeliveryLog d JOIN FETCH d.student WHERE d.logDate = :logDate")
    List<DeliveryLog> findByLogDateWithStudent(@Param("logDate") LocalDate logDate);

    @Query("SELECT d FROM DeliveryLog d JOIN FETCH d.student WHERE d.logDate >= :from AND d.logDate <= :to")
    List<DeliveryLog> findByLogDateBetweenWithStudent(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
