package com.stitchpickup.modules.admin.controller;

import com.stitchpickup.modules.admin.dto.GroupRequest;
import com.stitchpickup.modules.admin.dto.GroupResponse;
import com.stitchpickup.modules.admin.service.GroupAdminService;
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
@RequestMapping("/api/v1/admin/groups")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin - Grupos", description = "Gestión de grados y grupos escolares")
public class GroupAdminController {

    private final GroupAdminService groupAdminService;

    @GetMapping
    @Operation(summary = "Listar todos los grupos con conteo de alumnos")
    public ResponseEntity<List<GroupResponse>> getAllGroups() {
        return ResponseEntity.ok(groupAdminService.getAllGroups());
    }

    @PostMapping
    @Operation(summary = "Crear nuevo grupo escolar")
    public ResponseEntity<GroupResponse> createGroup(@Valid @RequestBody GroupRequest request) {
        return ResponseEntity.ok(groupAdminService.createGroup(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar grupo escolar")
    public ResponseEntity<GroupResponse> updateGroup(@PathVariable UUID id, @Valid @RequestBody GroupRequest request) {
        return ResponseEntity.ok(groupAdminService.updateGroup(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar grupo escolar")
    public ResponseEntity<Void> deleteGroup(@PathVariable UUID id) {
        groupAdminService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }
}
