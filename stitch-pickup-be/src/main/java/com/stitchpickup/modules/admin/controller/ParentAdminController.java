package com.stitchpickup.modules.admin.controller;

import com.stitchpickup.modules.admin.dto.ParentRequest;
import com.stitchpickup.modules.admin.dto.ParentResponse;
import com.stitchpickup.modules.admin.service.ParentAdminService;
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
@RequestMapping("/api/v1/admin/parents")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin - Padres", description = "Gestión de padres de familia y vinculación de alumnos")
public class ParentAdminController {

    private final ParentAdminService parentAdminService;

    @GetMapping
    @Operation(summary = "Listar todos los padres con sus alumnos vinculados")
    public ResponseEntity<List<ParentResponse>> getAllParents() {
        return ResponseEntity.ok(parentAdminService.getAllParents());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener padre por ID")
    public ResponseEntity<ParentResponse> getParentById(@PathVariable UUID id) {
        return ResponseEntity.ok(parentAdminService.getParentById(id));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo padre de familia con vinculación de alumnos")
    public ResponseEntity<ParentResponse> createParent(@Valid @RequestBody ParentRequest request) {
        return ResponseEntity.ok(parentAdminService.createParent(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar datos y alumnos vinculados de un padre")
    public ResponseEntity<ParentResponse> updateParent(@PathVariable UUID id, @Valid @RequestBody ParentRequest request) {
        return ResponseEntity.ok(parentAdminService.updateParent(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar padre de familia")
    public ResponseEntity<Void> deleteParent(@PathVariable UUID id) {
        parentAdminService.deleteParent(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/password")
    @Operation(summary = "Cambiar contraseña de un padre de familia")
    public ResponseEntity<Void> changePassword(
            @PathVariable UUID id,
            @Valid @RequestBody com.stitchpickup.modules.admin.dto.AdminPasswordChangeRequest request) {
        parentAdminService.changePassword(id, request.newPassword());
        return ResponseEntity.noContent().build();
    }
}
