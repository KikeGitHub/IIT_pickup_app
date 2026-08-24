package com.stitchpickup.modules.auth.controller;

import com.stitchpickup.modules.auth.dto.ChangePasswordRequest;
import com.stitchpickup.modules.auth.dto.LoginRequest;
import com.stitchpickup.modules.auth.dto.LoginResponse;
import com.stitchpickup.modules.auth.service.AuthService;
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

import java.util.Map;
import java.util.UUID;

/**
 * AuthController — Endpoints de autenticación y cambio de contraseña.
 *
 * Rutas:
 * POST /api/v1/auth/parent/login            → Login de padres
 * POST /api/v1/auth/teacher/login           → Login de maestros y admin
 * POST /api/v1/auth/parent/change-password  → Cambiar contraseña (padre autenticado)
 * POST /api/v1/auth/teacher/change-password → Cambiar contraseña (maestro autenticado)
 * GET  /api/v1/auth/me                      → Info del usuario autenticado
 *
 * SOLID — S: Solo gestiona el HTTP. Lógica de negocio en AuthService.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Autenticación y gestión de contraseñas")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider tokenProvider;

    // ─── Login Padre ──────────────────────────────────────────────────────────

    @PostMapping("/parent/login")
    @Operation(
        summary = "Login de padre de familia",
        description = "Autentica a un padre de familia y devuelve un JWT con la lista de alumnos vinculados."
    )
    public ResponseEntity<LoginResponse> loginParent(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginParent(request));
    }

    // ─── Login Maestro / Admin ────────────────────────────────────────────────

    @PostMapping("/teacher/login")
    @Operation(
        summary = "Login de maestro o administrador",
        description = "Autentica a un maestro (TEACHER) o al Super Admin (ADMIN). El rol en el JWT determina el portal destino."
    )
    public ResponseEntity<LoginResponse> loginTeacher(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginTeacher(request));
    }

    // ─── Cambio de Contraseña ─────────────────────────────────────────────────

    @PostMapping("/parent/change-password")
    @PreAuthorize("hasRole('PARENT')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Cambiar contraseña de padre",
        description = "Permite al padre cambiar su contraseña temporal. Requiere Bearer token."
    )
    public ResponseEntity<Map<String, String>> changePasswordParent(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {

        UUID userId = extractUserIdFromToken(httpRequest);
        authService.changePasswordParent(userId, request);
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente."));
    }

    @PostMapping("/teacher/change-password")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Cambiar contraseña de maestro/admin",
        description = "Permite al maestro o admin cambiar su contraseña temporal."
    )
    public ResponseEntity<Map<String, String>> changePasswordTeacher(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {

        UUID userId = extractUserIdFromToken(httpRequest);
        authService.changePasswordTeacher(userId, request);
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente."));
    }

    // ─── Información del usuario autenticado ─────────────────────────────────

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Información del usuario autenticado",
        description = "Devuelve los claims del JWT activo. Útil para validar el estado de sesión."
    )
    public ResponseEntity<Map<String, Object>> me(HttpServletRequest request) {
        String token = extractRawToken(request);
        var claims = tokenProvider.getClaims(token);

        return ResponseEntity.ok(Map.of(
            "userId", claims.get("userId"),
            "email", claims.getSubject(),
            "nombre", claims.getOrDefault("nombre", ""),
            "role", claims.getOrDefault("role", ""),
            "tempPassword", claims.getOrDefault("tempPassword", false)
        ));
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private UUID extractUserIdFromToken(HttpServletRequest request) {
        String token = extractRawToken(request);
        return UUID.fromString(tokenProvider.getUserIdFromToken(token));
    }

    private String extractRawToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        throw new IllegalArgumentException("Token JWT no encontrado en el header Authorization");
    }
}
