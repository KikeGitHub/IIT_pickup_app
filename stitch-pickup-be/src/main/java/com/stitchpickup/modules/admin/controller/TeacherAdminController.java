package com.stitchpickup.modules.admin.controller;

import com.stitchpickup.modules.admin.dto.TeacherRequest;
import com.stitchpickup.modules.admin.dto.TeacherResponse;
import com.stitchpickup.modules.admin.service.TeacherAdminService;
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
@RequestMapping("/api/v1/admin/teachers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin - Maestros", description = "Gestión de maestros y asignación de grupos")
public class TeacherAdminController {

    private final TeacherAdminService teacherAdminService;

    @GetMapping
    @Operation(summary = "Listar todos los maestros con sus grupos asignados")
    public ResponseEntity<List<TeacherResponse>> getAllTeachers() {
        return ResponseEntity.ok(teacherAdminService.getAllTeachers());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener maestro por ID")
    public ResponseEntity<TeacherResponse> getTeacherById(@PathVariable UUID id) {
        return ResponseEntity.ok(teacherAdminService.getTeacherById(id));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo maestro con asignación de grupos")
    public ResponseEntity<TeacherResponse> createTeacher(@Valid @RequestBody TeacherRequest request) {
        return ResponseEntity.ok(teacherAdminService.createTeacher(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar datos y grupos de un maestro")
    public ResponseEntity<TeacherResponse> updateTeacher(@PathVariable UUID id, @Valid @RequestBody TeacherRequest request) {
        return ResponseEntity.ok(teacherAdminService.updateTeacher(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar maestro")
    public ResponseEntity<Void> deleteTeacher(@PathVariable UUID id) {
        teacherAdminService.deleteTeacher(id);
        return ResponseEntity.noContent().build();
    }
}
