package com.stitchpickup.modules.admin.dto;

import java.util.List;
import java.util.Map;

/**
 * KpisResponse — Respuesta completa de métricas del panel admin.
 *
 * Incluye métricas por nivel, modalidad, maestro y período seleccionado.
 */
public record KpisResponse(
    long totalAlertsToday,
    long totalDeliveredToday,
    long pendingCount,
    long urgentCount,
    double avgPickupTimeMinutes,
    String peakHour,
    Map<String, Long> alertsByLevel,
    Map<String, Long> alertsByMethod,
    List<TeacherDeliveryMetric> teacherMetrics
) {
    /** Métrica de entregas por maestro */
    public record TeacherDeliveryMetric(
        String teacherName,
        long totalDelivered,
        double avgTimeMinutes
    ) {}
}
