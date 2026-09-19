package com.stitchpickup.modules.alert.dto;

/**
 * DTO para la solicitud de simulación de alertas de proximidad.
 * Permite a maestros y administradores probar la llegada de alumnos en tiempo real.
 */
public record SimulateAlertRequest(
    String studentId,
    String studentName,
    String status,
    String pickupMethod,
    Integer minutesAgo
) {}
