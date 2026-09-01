package com.stitchpickup.modules.delivery.controller;

import com.stitchpickup.modules.delivery.dto.DeliveryLogResponse;
import com.stitchpickup.modules.delivery.service.DeliveryService;
import com.stitchpickup.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * DeliveryController — Endpoints de gestión de entregas.
 *
 * Rutas:
 *   GET  /api/v1/deliveries/today              → Entregas del día (TEACHER/ADMIN)
 *   POST /api/v1/deliveries/{alertId}/dispatch → Maestro confirma alumno en puerta (TEACHER/ADMIN)
 *   POST /api/v1/deliveries/{id}/parent-confirm→ Padre confirma recepción (PARENT)
 *
 * SOLID — S: Solo maneja HTTP. Lógica en DeliveryService.
 */
@RestController
@RequestMapping("/api/v1/deliveries")
@RequiredArgsConstructor
@Tag(name = "Deliveries", description = "Gestión del ciclo de entrega de alumnos")
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final JwtTokenProvider tokenProvider;

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Obtener entregas del día",
        description = "Devuelve el listado completo de entregas registradas hoy con su estado actual."
    )
    public ResponseEntity<List<DeliveryLogResponse>> getTodayDeliveries() {
        return ResponseEntity.ok(deliveryService.getTodayDeliveries());
    }

    @PostMapping("/{alertId}/dispatch")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Despachar alumno (maestro confirma en puerta)",
        description = "El maestro o guardia confirma que el alumno está en la puerta de entrega. "
            + "Emite WebSocket a /topic/deliveries y notificación privada al padre."
    )
    public ResponseEntity<DeliveryLogResponse> dispatch(
            @PathVariable UUID alertId,
            HttpServletRequest request) {

        String token = request.getHeader("Authorization").substring(7);
        String nombre = tokenProvider.getClaims(token).get("nombre", String.class);

        return ResponseEntity.ok(deliveryService.dispatch(alertId, nombre));
    }

    @PostMapping("/{deliveryId}/parent-confirm")
    @PreAuthorize("hasRole('PARENT')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Padre confirma recepción del alumno",
        description = "El padre confirma haber recibido al alumno. Actualiza el estado a RECIBIDO_PADRE."
    )
    public ResponseEntity<DeliveryLogResponse> parentConfirm(
            @PathVariable UUID deliveryId,
            HttpServletRequest request) {

        String token = request.getHeader("Authorization").substring(7);
        UUID parentId = UUID.fromString(tokenProvider.getUserIdFromToken(token));

        return ResponseEntity.ok(deliveryService.confirmByParent(deliveryId, parentId));
    }

    @GetMapping("/student/{studentId}/today-events")
    @PreAuthorize("hasAnyRole('PARENT', 'TEACHER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Obtener historial del día para un alumno",
        description = "Devuelve el historial cronológico de alertas enviadas y entregas del día para un alumno."
    )
    public ResponseEntity<List<com.stitchpickup.modules.delivery.dto.ParentDayHistoryEventResponse>> getStudentTodayEvents(
            @PathVariable UUID studentId) {
        return ResponseEntity.ok(deliveryService.getTodayEventsForStudent(studentId));
    }
}
