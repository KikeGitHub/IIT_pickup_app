package com.stitchpickup.modules.delivery.dto;

import java.time.Instant;
import java.time.LocalDate;

public record DeliveryLogResponse(
    String id,
    String studentId,
    String studentName,
    String level,
    String groupName,
    String teacherName,
    String pickupMethod,
    String status,
    Instant teacherConfirmedAt,
    Instant parentConfirmedAt,
    LocalDate logDate
) {}
