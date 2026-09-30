package com.stitchpickup.modules.delivery.dto;

import com.stitchpickup.modules.alert.entity.Alert;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * ParentSelfConfirmRequest — DTO para que el padre auto-confirme la recepción de su hijo.
 * Utilizado cuando el docente entregó al alumno físicamente pero olvidó presionar "Entregado" en su monitor.
 */
public record ParentSelfConfirmRequest(
    @NotNull(message = "El ID del alumno es obligatorio")
    UUID studentId,
    Alert.PickupMethod pickupMethod
) {}
