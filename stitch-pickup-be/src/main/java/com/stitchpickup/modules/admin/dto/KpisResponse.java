package com.stitchpickup.modules.admin.dto;

import java.util.Map;

public record KpisResponse(
    long totalAlertsToday,
    long totalDeliveredToday,
    long pendingCount,
    long urgentCount,
    double avgPickupTimeMinutes,
    String peakHour,
    Map<String, Long> alertsByLevel,
    Map<String, Long> alertsByMethod
) {}
