package com.stitchpickup.modules.delivery.dto;

import java.time.Instant;

public record ParentDayHistoryEventResponse(
    String time,
    String title,
    String description,
    String type,
    Instant timestamp
) {}
