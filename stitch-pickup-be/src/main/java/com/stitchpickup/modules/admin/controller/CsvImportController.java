package com.stitchpickup.modules.admin.controller;

import com.stitchpickup.modules.admin.dto.CsvImportResultResponse;
import com.stitchpickup.modules.admin.service.CsvImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/import")
@RequiredArgsConstructor
@Tag(name = "Admin Import", description = "Carga masiva de datos mediante CSV")
public class CsvImportController {

    private final CsvImportService csvImportService;

    @PostMapping(value = "/students", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Carga masiva de alumnos desde CSV",
        description = "Procesa un archivo CSV con columnas (Nombre, Nivel, Grado, Grupo) y registra los alumnos en masa."
    )
    public ResponseEntity<CsvImportResultResponse> importStudents(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(csvImportService.importStudentsFromCsv(file));
    }
}
