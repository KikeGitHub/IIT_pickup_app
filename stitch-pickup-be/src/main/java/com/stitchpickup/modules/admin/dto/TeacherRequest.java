package com.stitchpickup.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record TeacherRequest(
    @NotBlank String nombre,
    @NotBlank String email,
    String password,
    String role,
    String level,
    String avatarUrl,
    Boolean active,
    List<String> groupIds
) {}
