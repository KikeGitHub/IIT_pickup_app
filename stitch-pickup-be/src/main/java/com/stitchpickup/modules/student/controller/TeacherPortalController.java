package com.stitchpickup.modules.student.controller;

import com.stitchpickup.modules.student.dto.*;
import com.stitchpickup.modules.student.service.TeacherPortalService;
import com.stitchpickup.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Portal Maestro", description = "Endpoints para consulta de grupos, alumnos y edición de perfiles")
public class TeacherPortalController {

    private final TeacherPortalService teacherPortalService;
    private final JwtTokenProvider tokenProvider;

    @GetMapping("/my-groups")
    @Operation(summary = "Obtener los grupos asignados al maestro con su lista de alumnos")
    public ResponseEntity<List<TeacherGroupDetailResponse>> getMyGroups(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        UUID teacherId = UUID.fromString(tokenProvider.getUserIdFromToken(token));
        return ResponseEntity.ok(teacherPortalService.getMyGroupsWithStudents(teacherId));
    }

    @PostMapping("/students")
    @Operation(summary = "Maestro registra un nuevo alumno en su grupo asignado con cuentas de padres y tutores")
    public ResponseEntity<TeacherStudentResponse> createStudent(
            @Valid @RequestBody TeacherStudentCreateRequest createRequest,
            HttpServletRequest request) {

        String token = request.getHeader("Authorization").substring(7);
        UUID teacherId = UUID.fromString(tokenProvider.getUserIdFromToken(token));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(teacherPortalService.createStudentByTeacher(teacherId, createRequest));
    }

    @PutMapping("/students/{studentId}")
    @Operation(summary = "Maestro edita datos generales y fotografía del alumno asignado a su grupo")
    public ResponseEntity<TeacherStudentResponse> updateStudent(
            @PathVariable UUID studentId,
            @Valid @RequestBody TeacherStudentUpdateRequest updateRequest,
            HttpServletRequest request) {

        String token = request.getHeader("Authorization").substring(7);
        UUID teacherId = UUID.fromString(tokenProvider.getUserIdFromToken(token));
        return ResponseEntity.ok(teacherPortalService.updateStudentByTeacher(teacherId, studentId, updateRequest));
    }

    @PatchMapping("/students/{studentId}/toggle-active")
    @Operation(summary = "Maestro alterna el estado activo/inactivo (dar de baja o reactivar) de un alumno")
    public ResponseEntity<TeacherStudentResponse> toggleStudentActive(
            @PathVariable UUID studentId,
            HttpServletRequest request) {

        String token = request.getHeader("Authorization").substring(7);
        UUID teacherId = UUID.fromString(tokenProvider.getUserIdFromToken(token));
        return ResponseEntity.ok(teacherPortalService.toggleStudentActiveByTeacher(teacherId, studentId));
    }

    @PostMapping("/parents/{parentId}/reset-temp-password")
    @Operation(summary = "Maestro restablece la contraseña temporal (IIT2026) para un padre de sus alumnos")
    public ResponseEntity<TeacherParentAccountDto> resetParentPassword(
            @PathVariable UUID parentId,
            HttpServletRequest request) {

        String token = request.getHeader("Authorization").substring(7);
        UUID teacherId = UUID.fromString(tokenProvider.getUserIdFromToken(token));
        return ResponseEntity.ok(teacherPortalService.resetParentTempPassword(teacherId, parentId));
    }
}

