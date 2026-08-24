package com.stitchpickup.modules.admin.dto;

import java.time.Instant;
import java.util.List;

public record ParentResponse(
    String id,
    String nombre,
    String email,
    String phone,
    String avatarUrl,
    boolean active,
    boolean tempPassword,
    Instant lastLogin,
    List<StudentSummaryResponse> students
) {}
