package com.stitchpickup.modules.admin.dto;

public record GroupResponse(
    String id,
    String level,
    String name,
    boolean active,
    long studentCount
) {}
