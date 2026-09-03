package com.stitchpickup.modules.admin.controller;

import com.stitchpickup.modules.admin.dto.KpisResponse;
import com.stitchpickup.modules.admin.service.KpiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/kpis")
@RequiredArgsConstructor
@Tag(name = "KPIs", description = "Métricas y KPIs del sistema")
public class KpiController {

    private final KpiService kpiService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MONITOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Obtener KPIs por período",
        description = "Devuelve estadísticas consolidadas. Período: day (hoy), week (7 días), month (30 días)."
    )
    public ResponseEntity<KpisResponse> getKpis(
            @RequestParam(defaultValue = "day") String period) {
        KpiService.Period p = switch (period.toLowerCase()) {
            case "week"  -> KpiService.Period.week;
            case "month" -> KpiService.Period.month;
            default      -> KpiService.Period.day;
        };
        return ResponseEntity.ok(kpiService.getKpis(p));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'MONITOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Obtener KPIs del día (alias de legacy)", description = "Alias para GET /kpis?period=day")
    public ResponseEntity<KpisResponse> getTodayKpis() {
        return ResponseEntity.ok(kpiService.getTodayKpis());
    }
}
