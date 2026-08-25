package com.stitchpickup.modules.student.dto;

import jakarta.validation.constraints.NotBlank;

public record TeacherStudentUpdateRequest(
    @NotBlank String name,
    String grade,
    String birthday,
    String gender,
    String curp,
    String avatarUrl
) {}
