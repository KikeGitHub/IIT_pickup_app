package com.stitchpickup.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para cambio de contraseña de usuarios (Maestros o Padres) ejecutado por un Administrador.
 */
public record AdminPasswordChangeRequest(
    @NotBlank(message = "La nueva contraseña no puede estar vacía")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    String newPassword
) {}
