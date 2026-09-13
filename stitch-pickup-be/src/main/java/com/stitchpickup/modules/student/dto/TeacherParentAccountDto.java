package com.stitchpickup.modules.student.dto;

public record TeacherParentAccountDto(
    String id,
    String nombre,
    String email,
    String phone,
    boolean tempPassword
) {}
