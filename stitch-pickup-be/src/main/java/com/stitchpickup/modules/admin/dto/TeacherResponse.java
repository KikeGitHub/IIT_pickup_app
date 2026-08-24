package com.stitchpickup.modules.admin.dto;

import java.time.Instant;
import java.util.List;

public record TeacherResponse(
    String id,
    String nombre,
    String email,
    String role,
    String level,
    String avatarUrl,
    boolean active,
    boolean tempPassword,
    Instant lastLogin,
    List<GroupResponse> groups
) {}
