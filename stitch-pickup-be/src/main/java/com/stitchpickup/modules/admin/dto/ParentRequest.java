package com.stitchpickup.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record ParentRequest(
    @NotBlank String nombre,
    @NotBlank String email,
    String password,
    String phone,
    String avatarUrl,
    Boolean active,
    List<String> studentIds
) {}
