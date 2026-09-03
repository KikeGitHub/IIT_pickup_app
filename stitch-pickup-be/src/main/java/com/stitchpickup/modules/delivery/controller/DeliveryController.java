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
 *   GET    /api/v1/deliveries/today                    → Entregas del día (TEACHER/ADMIN)
 *   POST   /api/v1/deliveries/{alertId}/dispatch       → Maestro confirma alumno en puerta (TEACHER/ADMIN)
 *   POST   /api/v1/deliveries/{id}/parent-confirm      → Padre confirma recepción (PARENT)
 *   POST   /api/v1/deliveries/{id}/parent-reject       → Padre rechaza entrega (PARENT) 🆕
 *   POST   /api/v1/deliveries/{id}/revert              → Maestro/Admin revierte entrega (TEACHER/ADMIN) 🆕
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
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'MONITOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Obtener entregas del día",
        description = "Devuelve el listado de entregas del día (excluye las revertidas)."
    )
    public ResponseEntity<List<DeliveryLogResponse>> getTodayDeliveries() {
        return ResponseEntity.ok(deliveryService.getTodayDeliveries());
    }

    @PostMapping("/{alertId}/dispatch")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'MONITOR')")
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

    @PostMapping("/{deliveryId}/parent-reject")
    @PreAuthorize("hasRole('PARENT')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Padre rechaza la entrega (no ha recibido a su hijo)",
        description = "El padre reporta que no ha recibido al alumno. "
            + "El alumno regresa al board del monitor con estado URGENTE y badge de alerta. "
            + "Emite WebSocket a /topic/delivery/rejected y /topic/deliveries."
    )
    public ResponseEntity<DeliveryLogResponse> parentReject(
            @PathVariable UUID deliveryId,
            HttpServletRequest request) {

        String token = request.getHeader("Authorization").substring(7);
        UUID parentId = UUID.fromString(tokenProvider.getUserIdFromToken(token));

        return ResponseEntity.ok(deliveryService.parentReject(deliveryId, parentId));
    }

    @PostMapping("/{deliveryId}/revert")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'MONITOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Maestro/Admin revierte una entrega errónea",
        description = "Deshace la entrega de un alumno. El alumno regresa al board activo en estado EN_FILA. "
            + "Se emite WebSocket a /topic/delivery/reverted y se notifica al padre para cerrar el modal."
    )
    public ResponseEntity<DeliveryLogResponse> revertDelivery(
            @PathVariable UUID deliveryId,
            HttpServletRequest request) {

        String token = request.getHeader("Authorization").substring(7);
        String nombre = tokenProvider.getClaims(token).get("nombre", String.class);

        return ResponseEntity.ok(deliveryService.revertDelivery(deliveryId, nombre));
    }

    @GetMapping("/student/{studentId}/today-events")
    @PreAuthorize("hasAnyRole('PARENT', 'TEACHER', 'ADMIN', 'MONITOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Obtener historial del día para un alumno",
        description = "Devuelve el historial cronológico de alertas, entregas, rechazos y reversiones del día."
    )
    public ResponseEntity<List<com.stitchpickup.modules.delivery.dto.ParentDayHistoryEventResponse>> getStudentTodayEvents(
            @PathVariable UUID studentId) {
        return ResponseEntity.ok(deliveryService.getTodayEventsForStudent(studentId));
    }
}
