package com.stitchpickup.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para el cambio de contraseña.
 */
public record ChangePasswordRequest(
    @NotBlank(message = "La contraseña actual es obligatoria")
    String currentPassword,

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 8, message = "La nueva contraseña debe tener al menos 8 caracteres")
    String newPassword
) {}
