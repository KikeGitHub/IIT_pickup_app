package com.stitchpickup.modules.alert.controller;

import com.stitchpickup.modules.alert.dto.CreateAlertRequest;
import com.stitchpickup.modules.alert.dto.AlertResponse;
import com.stitchpickup.modules.alert.service.AlertService;
import com.stitchpickup.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
@Tag(name = "Alerts", description = "Gestión de alertas de proximidad")
public class AlertController {

    private final AlertService alertService;
    private final JwtTokenProvider tokenProvider;

    @PostMapping
    @PreAuthorize("hasRole('PARENT')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Emitir alerta de proximidad",
        description = "Un padre envía una alerta (10 MIN, 5 MIN, EN FILA, URGENTE) para un alumno. Soporta deduplicación con clientId."
    )
    public ResponseEntity<AlertResponse> createAlert(
            @Valid @RequestBody CreateAlertRequest requestDto,
            HttpServletRequest request) {

        String token = request.getHeader("Authorization").substring(7);
        UUID parentId = UUID.fromString(tokenProvider.getUserIdFromToken(token));

        return ResponseEntity.ok(alertService.createAlert(parentId, requestDto));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Obtener alertas del día",
        description = "Devuelve todas las alertas registradas en el día de hoy para el monitor."
    )
    public ResponseEntity<List<AlertResponse>> getTodayAlerts() {
        return ResponseEntity.ok(alertService.getTodayAlerts());
    }

    /**
     * Endpoint agrupado: devuelve UN solo registro por alumno (la alerta más reciente).
     * - ADMIN: ve todos los alumnos.
     * - TEACHER: ve solo los alumnos de sus grupos asignados.
     */
    @GetMapping("/today/grouped")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Obtener alertas del día agrupadas por alumno",
        description = "Devuelve la alerta más reciente por cada alumno. ADMIN ve todos; TEACHER ve solo sus grupos asignados."
    )
    public ResponseEntity<List<AlertResponse>> getTodayAlertsGrouped(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String role = tokenProvider.getRoleFromToken(token);
        UUID userId = UUID.fromString(tokenProvider.getUserIdFromToken(token));

        if ("ADMIN".equals(role)) {
            return ResponseEntity.ok(alertService.getTodayAlertsGrouped());
        } else {
            // TEACHER → filtrar por sus grupos asignados
            return ResponseEntity.ok(alertService.getTodayAlertsGroupedForTeacher(userId));
        }
    }
}
