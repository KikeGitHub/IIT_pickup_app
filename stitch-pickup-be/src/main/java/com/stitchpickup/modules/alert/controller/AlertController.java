package com.stitchpickup.modules.alert.controller;

import com.stitchpickup.modules.alert.dto.CreateAlertRequest;
import com.stitchpickup.modules.alert.dto.SimulateAlertRequest;
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

    @PostMapping("/simulate")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'MONITOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Simular llegada de alumno (Modo Pruebas)",
        description = "Permite a maestros y administradores simular entradas de alumnos en tiempo real para verificar tableros, orden de tarjetas y cronómetros."
    )
    public ResponseEntity<AlertResponse> simulateAlert(
            @RequestBody(required = false) SimulateAlertRequest requestDto,
            HttpServletRequest request) {

        String authHeader = request.getHeader("Authorization");
        UUID userId = null;
        String role = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                userId = UUID.fromString(tokenProvider.getUserIdFromToken(token));
                role = tokenProvider.getRoleFromToken(token);
            } catch (Exception ignored) {}
        }

        if (requestDto == null) {
            requestDto = new SimulateAlertRequest(null, null, "EN_FILA", "CAR", 0);
        }

        return ResponseEntity.ok(alertService.simulateAlert(requestDto, userId, role));
    }

    @PostMapping("/simulate/batch")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'MONITOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Simular lote masivo de alumnos (5, 10, 25, 50, 100 sin límite)",
        description = "Genera un lote de alumnos con prioridades y tiempos distribuidos para verificar tableros con alto volumen."
    )
    public ResponseEntity<List<AlertResponse>> simulateBatch(
            @RequestParam(defaultValue = "5") int count,
            HttpServletRequest request) {

        String authHeader = request.getHeader("Authorization");
        UUID userId = null;
        String role = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                userId = UUID.fromString(tokenProvider.getUserIdFromToken(token));
                role = tokenProvider.getRoleFromToken(token);
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(alertService.simulateBatch(count, userId, role));
    }

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
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'MONITOR')")
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
     * - Público o ADMIN: ve todos los alumnos (pantalla general de plantel).
     * - TEACHER: ve solo los alumnos de sus grupos asignados.
     */
    @GetMapping("/today/grouped")
    @Operation(
        summary = "Obtener alertas del día agrupadas por alumno",
        description = "Devuelve la alerta más reciente por cada alumno. Público/ADMIN ve todos; TEACHER ve solo sus grupos asignados."
    )
    public ResponseEntity<List<AlertResponse>> getTodayAlertsGrouped(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                String role = tokenProvider.getRoleFromToken(token);
                if ("TEACHER".equals(role)) {
                    UUID userId = UUID.fromString(tokenProvider.getUserIdFromToken(token));
                    return ResponseEntity.ok(alertService.getTodayAlertsGroupedForTeacher(userId));
                }
            } catch (Exception ignored) {}
        }

        // Si es ADMIN o acceso público de monitor general
        return ResponseEntity.ok(alertService.getTodayAlertsGrouped());
    }

    @GetMapping("/student/{studentId}/latest")
    @Operation(
        summary = "Obtener la última alerta de hoy para un alumno",
        description = "Permite a los padres de familia y monitores consultar el estado actual del alumno directamente desde la BD al recargar la página."
    )
    public ResponseEntity<AlertResponse> getLatestAlertForStudent(@PathVariable UUID studentId) {
        return alertService.getLatestTodayAlertForStudent(studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
