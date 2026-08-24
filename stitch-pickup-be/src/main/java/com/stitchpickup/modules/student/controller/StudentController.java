package com.stitchpickup.modules.student.controller;

import com.stitchpickup.modules.student.dto.StudentResponse;
import com.stitchpickup.modules.student.service.StudentService;
import com.stitchpickup.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
@Tag(name = "Students", description = "Gestión de alumnos")
public class StudentController {

    private final StudentService studentService;
    private final JwtTokenProvider tokenProvider;

    @GetMapping("/my-students")
    @PreAuthorize("hasRole('PARENT')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Obtener alumnos vinculados al padre",
        description = "Devuelve la lista de alumnos vinculados al padre autenticado junto con sus familiares autorizados."
    )
    public ResponseEntity<List<StudentResponse>> getMyStudents(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        UUID parentId = UUID.fromString(tokenProvider.getUserIdFromToken(token));

        return ResponseEntity.ok(studentService.getStudentsByParentId(parentId));
    }
}
