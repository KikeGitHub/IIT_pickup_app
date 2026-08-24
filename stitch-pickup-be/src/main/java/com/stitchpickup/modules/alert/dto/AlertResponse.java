package com.stitchpickup.modules.alert.dto;

import java.time.Instant;

public record AlertResponse(
    String id,
    String parentId,
    String parentName,
    String studentId,
    String studentName,
    String level,
    String groupName,
    String status,
    String pickupMethod,
    String clientId,
    Instant sentAt,
    Instant receivedAt
) {}
