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

    private static final ZoneId MEXICO_ZONE = ZoneId.of("America/Mexico_City");

    @Transactional(readOnly = true)
    public KpisResponse getKpis(Period period) {
        LocalDate today = LocalDate.now(MEXICO_ZONE);

        LocalDate from = switch (period) {
            case day   -> today;
            case week  -> today.minusDays(6);
            case month -> today.minusDays(29);
        };

        Instant startInstant = from.atStartOfDay(MEXICO_ZONE).toInstant();
        Instant endInstant   = today.plusDays(1).atStartOfDay(MEXICO_ZONE).toInstant();

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

        // Distribución por nivel de ENTREGAS REALES (alumnos despachados)
        Map<String, Long> deliveriesByLevel = deliveries.stream()
                .filter(d -> (d.getStatus() == DeliveryLog.DeliveryStatus.ENTREGADO_ESCUELA
                           || d.getStatus() == DeliveryLog.DeliveryStatus.RECIBIDO_PADRE)
                           && d.getStudent() != null && d.getStudent().getLevel() != null)
                .collect(Collectors.groupingBy(
                    d -> d.getStudent().getLevel().name(), Collectors.counting()));

        // Distribución por modalidad de ENTREGAS REALES (despachos completados)
        Map<String, Long> deliveriesByMethod = deliveries.stream()
                .filter(d -> d.getStatus() == DeliveryLog.DeliveryStatus.ENTREGADO_ESCUELA
                          || d.getStatus() == DeliveryLog.DeliveryStatus.RECIBIDO_PADRE)
                .map(d -> {
                    if (d.getPickupMethod() != null) return d.getPickupMethod().name();
                    if (d.getAlert() != null && d.getAlert().getPickupMethod() != null) return d.getAlert().getPickupMethod().name();
                    return "CAR";
                })
                .collect(Collectors.groupingBy(m -> m, Collectors.counting()));

        // Distribución por nivel de ALERTAS (solicitudes/avisos de llegada)
        Map<String, Long> alertsByLevel = alerts.stream()
                .collect(Collectors.groupingBy(
                    a -> a.getStudent().getLevel().name(), Collectors.counting()));

        // Distribución por modalidad de ALERTAS (solicitudes/avisos de llegada)
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
                    int hour = d.getTeacherConfirmedAt().atZone(MEXICO_ZONE).getHour();
                    int half = d.getTeacherConfirmedAt().atZone(MEXICO_ZONE).getMinute() < 30 ? 0 : 30;
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

                    String topLevel = e.getValue().stream()
                            .filter(d -> d.getStudent() != null && d.getStudent().getLevel() != null)
                            .collect(Collectors.groupingBy(d -> d.getStudent().getLevel().name(), Collectors.counting()))
                            .entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse("General");

                    OptionalLong tFastest = e.getValue().stream()
                            .filter(d -> d.getTeacherConfirmedAt() != null && d.getAlert() != null
                                      && d.getAlert().getSentAt() != null)
                            .mapToLong(d -> d.getTeacherConfirmedAt().toEpochMilli()
                                          - d.getAlert().getSentAt().toEpochMilli())
                            .min();
                    double fastestMin = tFastest.isPresent()
                            ? Math.round((tFastest.getAsLong() / 60_000.0) * 10.0) / 10.0
                            : Math.round(tMin * 10.0) / 10.0;

                    OptionalLong tSlowest = e.getValue().stream()
                            .filter(d -> d.getTeacherConfirmedAt() != null && d.getAlert() != null
                                      && d.getAlert().getSentAt() != null)
                            .mapToLong(d -> d.getTeacherConfirmedAt().toEpochMilli()
                                          - d.getAlert().getSentAt().toEpochMilli())
                            .max();
                    double slowestMin = tSlowest.isPresent()
                            ? Math.round((tSlowest.getAsLong() / 60_000.0) * 10.0) / 10.0
                            : Math.round(tMin * 10.0) / 10.0;

                    return new TeacherDeliveryMetric(
                        e.getKey(),
                        count,
                        Math.round(tMin * 10.0) / 10.0,
                        topLevel,
                        fastestMin,
                        slowestMin
                    );
                })
                .sorted(Comparator.comparingLong(TeacherDeliveryMetric::totalDelivered).reversed())
                .toList();

        return new KpisResponse(
                totalAlerts, totalDelivered, pendingCount, urgentCount,
                Math.round(avgMinutes * 10.0) / 10.0,
                peakHour, alertsByLevel, alertsByMethod,
                deliveriesByLevel, deliveriesByMethod,
                teacherMetrics);
    }

    /** Shortcut para compatibilidad — devuelve métricas del día */
    @Transactional(readOnly = true)
    public KpisResponse getTodayKpis() {
        return getKpis(Period.day);
    }
}
