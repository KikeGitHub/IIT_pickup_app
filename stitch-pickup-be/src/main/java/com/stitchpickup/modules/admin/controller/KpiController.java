package com.stitchpickup.modules.admin.controller;

import com.stitchpickup.modules.admin.dto.KpisResponse;
import com.stitchpickup.modules.admin.service.KpiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/kpis")
@RequiredArgsConstructor
@Tag(name = "KPIs", description = "Métricas y KPIs del sistema")
public class KpiController {

    private final KpiService kpiService;

    @GetMapping("/today")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Obtener KPIs del día",
        description = "Devuelve estadísticas consolidadas del flujo de salida para el panel de administración."
    )
    public ResponseEntity<KpisResponse> getTodayKpis() {
        return ResponseEntity.ok(kpiService.getTodayKpis());
    }
}
