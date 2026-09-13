package com.stitchpickup.modules.student.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Datos de cuenta de acceso para el padre/madre en el portal de padres")
public record TeacherParentAccountInputDto(
    String nombre,
    String email,
    String phone
) {}
