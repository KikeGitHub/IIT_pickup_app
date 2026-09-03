package com.stitchpickup.modules.delivery.dto;

import java.time.Instant;
import java.time.LocalDate;

/**
 * DeliveryLogResponse — DTO de entrega con soporte para reversiones.
 *
 * El campo `parentRejected` indica que el padre reportó no haber recibido al alumno.
 * El campo `reverted` indica que la entrega fue deshecha por maestro/admin.
 */
public record DeliveryLogResponse(
    String id,
    String studentId,
    String studentName,
    String level,
    String groupName,
    String teacherName,
    String pickupMethod,
    String status,
    Instant teacherConfirmedAt,
    Instant parentConfirmedAt,
    Instant parentRejectedAt,
    Instant revertedAt,
    String revertedBy,
    LocalDate logDate
) {}
