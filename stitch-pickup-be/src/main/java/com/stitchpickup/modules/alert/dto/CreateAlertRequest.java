package com.stitchpickup.modules.alert.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAlertRequest(
    @NotBlank(message = "El ID del alumno es obligatorio")
    String studentId,

    @NotBlank(message = "El estado de la alerta es obligatorio")
    String status,

    @NotNull(message = "El método de recogida es obligatorio")
    String pickupMethod,

    String clientId
) {}
