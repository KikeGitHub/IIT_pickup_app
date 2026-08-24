package com.stitchpickup.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para el login.
 * Usado tanto para padres como para maestros.
 */
public record LoginRequest(
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Formato de email inválido")
    String email,

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    String password
) {}
