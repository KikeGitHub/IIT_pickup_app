package com.stitchpickup.modules.admin.controller;

import com.stitchpickup.modules.admin.dto.StudentDetailResponse;
import com.stitchpickup.modules.admin.dto.StudentRequest;
import com.stitchpickup.modules.admin.service.StudentAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/students")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin - Alumnos", description = "Gestión de alumnos y familiares autorizados")
public class StudentAdminController {

    private final StudentAdminService studentAdminService;

    @GetMapping
    @Operation(summary = "Listar todos los alumnos con grupo, maestros y tutores")
    public ResponseEntity<List<StudentDetailResponse>> getAllStudents() {
        return ResponseEntity.ok(studentAdminService.getAllStudents());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de alumno por ID")
    public ResponseEntity<StudentDetailResponse> getStudentById(@PathVariable UUID id) {
        return ResponseEntity.ok(studentAdminService.getStudentById(id));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo alumno con hasta 3 tutores de pickup")
    public ResponseEntity<StudentDetailResponse> createStudent(@Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(studentAdminService.createStudent(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar datos de alumno y tutores")
    public ResponseEntity<StudentDetailResponse> updateStudent(@PathVariable UUID id, @Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(studentAdminService.updateStudent(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar alumno")
    public ResponseEntity<Void> deleteStudent(@PathVariable UUID id) {
        studentAdminService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}
