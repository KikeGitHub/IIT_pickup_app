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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/import")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin - Importación CSV", description = "Carga masiva de alumnos, maestros y padres")
public class CsvImportController {

    private final CsvImportService csvImportService;

    @PostMapping(value = "/students", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importación masiva de alumnos vía CSV")
    public ResponseEntity<CsvImportResultResponse> importStudents(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(csvImportService.importStudentsFromCsv(file));
    }

    @PostMapping(value = "/teachers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importación masiva de maestros con asignación de grupos vía CSV")
    public ResponseEntity<CsvImportResultResponse> importTeachers(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(csvImportService.importTeachersFromCsv(file));
    }

    @PostMapping(value = "/parents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importación masiva de padres de familia y vinculación de alumnos vía CSV")
    public ResponseEntity<CsvImportResultResponse> importParents(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(csvImportService.importParentsFromCsv(file));
    }
}
