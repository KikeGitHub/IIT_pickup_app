package com.stitchpickup.modules.student.controller;

import com.stitchpickup.modules.student.dto.TeacherGroupDetailResponse;
import com.stitchpickup.modules.student.dto.TeacherStudentResponse;
import com.stitchpickup.modules.student.dto.TeacherStudentUpdateRequest;
import com.stitchpickup.modules.student.service.TeacherPortalService;
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
}
