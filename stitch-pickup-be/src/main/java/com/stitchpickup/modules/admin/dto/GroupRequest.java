package com.stitchpickup.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record GroupRequest(
    @NotBlank String name,
    @NotBlank @Pattern(regexp = "KINDER|PRIMARIA|SECUNDARIA") String level
) {}
