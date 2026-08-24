package com.stitchpickup.modules.admin.service;

import com.stitchpickup.modules.admin.dto.KpisResponse;
import com.stitchpickup.modules.admin.dto.KpisResponse.TeacherDeliveryMetric;
import com.stitchpickup.modules.alert.entity.Alert;
import com.stitchpickup.modules.alert.repository.AlertRepository;
import com.stitchpickup.modules.delivery.entity.DeliveryLog;
import com.stitchpickup.modules.delivery.repository.DeliveryLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * KpiService — Calcula métricas operativas del Monitor de Entregas.
 *
 * Soporta períodos: day (hoy), week (últimos 7 días), month (últimos 30 días).
 *
 * SOLID — S: Solo calcula métricas. No maneja HTTP.
 */
@Service
@RequiredArgsConstructor
public class KpiService {

    private final AlertRepository alertRepository;
    private final DeliveryLogRepository deliveryLogRepository;

    /** Período de tiempo para las métricas */
    public enum Period { day, week, month }

    @Transactional(readOnly = true)
    public KpisResponse getKpis(Period period) {
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now();

        LocalDate from = switch (period) {
            case day   -> today;
            case week  -> today.minusDays(6);
            case month -> today.minusDays(29);
        };

        Instant startInstant = from.atStartOfDay(zone).toInstant();
        Instant endInstant   = today.plusDays(1).atStartOfDay(zone).toInstant();

        List<Alert> alerts     = alertRepository.findTodayAlerts(startInstant, endInstant);
        List<DeliveryLog> deliveries = deliveryLogRepository.findByLogDateBetweenWithStudent(from, today);

        long totalAlerts    = alerts.size();
        long totalDelivered = deliveries.stream()
                .filter(d -> d.getStatus() == DeliveryLog.DeliveryStatus.ENTREGADO_ESCUELA
                          || d.getStatus() == DeliveryLog.DeliveryStatus.RECIBIDO_PADRE)
                .count();

        long urgentCount  = alerts.stream()
                .filter(a -> a.getStatus() == Alert.AlertStatus.URGENTE).count();
        long pendingCount = Math.max(0, totalAlerts - totalDelivered);

        // Distribución por nivel
        Map<String, Long> alertsByLevel = alerts.stream()
                .collect(Collectors.groupingBy(
                    a -> a.getStudent().getLevel().name(), Collectors.counting()));

        // Distribución por modalidad
        Map<String, Long> alertsByMethod = alerts.stream()
                .collect(Collectors.groupingBy(
                    a -> a.getPickupMethod().name(), Collectors.counting()));

        // Tiempo promedio de entrega (sentAt → teacherConfirmedAt)
        OptionalDouble avgTime = deliveries.stream()
                .filter(d -> d.getTeacherConfirmedAt() != null && d.getAlert() != null
                          && d.getAlert().getSentAt() != null)
                .mapToLong(d -> d.getTeacherConfirmedAt().toEpochMilli()
                              - d.getAlert().getSentAt().toEpochMilli())
                .average();

        double avgMinutes = avgTime.isPresent() ? avgTime.getAsDouble() / 60_000.0 : 0.0;

        // Hora pico (franja de 30 min con más alertas)
        String peakHour = deliveries.stream()
                .filter(d -> d.getTeacherConfirmedAt() != null)
                .collect(Collectors.groupingBy(d -> {
                    int hour = d.getTeacherConfirmedAt().atZone(zone).getHour();
                    int half = d.getTeacherConfirmedAt().atZone(zone).getMinute() < 30 ? 0 : 30;
                    return String.format("%02d:%02d", hour, half);
                }, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> e.getKey() + " - " + e.getKey().substring(0, 2) + ":" +
                          (Integer.parseInt(e.getKey().substring(3)) + 30 > 59 ? "59" :
                           String.format("%02d", Integer.parseInt(e.getKey().substring(3)) + 30)))
                .orElse("Sin datos");

        // Métricas por maestro
        List<TeacherDeliveryMetric> teacherMetrics = deliveries.stream()
                .filter(d -> d.getTeacherName() != null)
                .collect(Collectors.groupingBy(DeliveryLog::getTeacherName))
                .entrySet().stream()
                .map(e -> {
                    long count = e.getValue().size();
                    OptionalDouble tAvg = e.getValue().stream()
                            .filter(d -> d.getTeacherConfirmedAt() != null && d.getAlert() != null
                                      && d.getAlert().getSentAt() != null)
                            .mapToLong(d -> d.getTeacherConfirmedAt().toEpochMilli()
                                          - d.getAlert().getSentAt().toEpochMilli())
                            .average();
                    double tMin = tAvg.isPresent() ? tAvg.getAsDouble() / 60_000.0 : 0.0;
                    return new TeacherDeliveryMetric(e.getKey(), count,
                                                     Math.round(tMin * 10.0) / 10.0);
                })
                .sorted(Comparator.comparingLong(TeacherDeliveryMetric::totalDelivered).reversed())
                .toList();

        return new KpisResponse(
                totalAlerts, totalDelivered, pendingCount, urgentCount,
                Math.round(avgMinutes * 10.0) / 10.0,
                peakHour, alertsByLevel, alertsByMethod, teacherMetrics);
    }

    /** Shortcut para compatibilidad — devuelve métricas del día */
    @Transactional(readOnly = true)
    public KpisResponse getTodayKpis() {
        return getKpis(Period.day);
    }
}
