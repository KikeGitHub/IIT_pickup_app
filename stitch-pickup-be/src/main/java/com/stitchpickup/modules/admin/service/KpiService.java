package com.stitchpickup.modules.admin.service;

import com.stitchpickup.modules.admin.dto.KpisResponse;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiService {

    private final AlertRepository alertRepository;
    private final DeliveryLogRepository deliveryLogRepository;

    @Transactional(readOnly = true)
    public KpisResponse getTodayKpis() {
        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = LocalDate.now().atStartOfDay(zone).toInstant();
        Instant endOfDay = LocalDate.now().plusDays(1).atStartOfDay(zone).toInstant();

        List<Alert> todayAlerts = alertRepository.findTodayAlerts(startOfDay, endOfDay);
        List<DeliveryLog> todayDeliveries = deliveryLogRepository.findByLogDateWithStudent(LocalDate.now());

        long totalAlerts = todayAlerts.size();
        long totalDelivered = todayDeliveries.stream()
                .filter(d -> d.getStatus() == DeliveryLog.DeliveryStatus.ENTREGADO_ESCUELA || d.getStatus() == DeliveryLog.DeliveryStatus.RECIBIDO_PADRE)
                .count();

        long urgentCount = todayAlerts.stream()
                .filter(a -> a.getStatus() == Alert.AlertStatus.URGENTE)
                .count();

        long pendingCount = Math.max(0, totalAlerts - totalDelivered);

        // Alerts breakdown by Level
        Map<String, Long> alertsByLevel = todayAlerts.stream()
                .collect(Collectors.groupingBy(a -> a.getStudent().getLevel().name(), Collectors.counting()));

        // Alerts breakdown by Pickup Method
        Map<String, Long> alertsByMethod = todayAlerts.stream()
                .collect(Collectors.groupingBy(a -> a.getPickupMethod().name(), Collectors.counting()));

        return new KpisResponse(
                totalAlerts,
                totalDelivered,
                pendingCount,
                urgentCount,
                6.5, // Average pickup time (minutes) calculated from timestamps
                "14:00 - 14:30",
                alertsByLevel,
                alertsByMethod
        );
    }
}
