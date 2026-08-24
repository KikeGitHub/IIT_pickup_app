package com.stitchpickup.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * JwtTokenProvider — Genera y valida JSON Web Tokens.
 *
 * Arquitectura (ADR-002-jwt-stateless):
 * - HMAC-SHA256 con clave de 256 bits mínimo
 * - Claims personalizados: userId, role, nombre, studentIds (padres), groups (maestros)
 * - Sin estado: el servidor no almacena sesiones
 *
 * SOLID — S: Solo genera/valida tokens. No conoce usuarios ni HTTP.
 */
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    // ─── Generación de Tokens ─────────────────────────────────────────────────

    /**
     * Genera JWT para un padre de familia.
     *
     * @param userId      UUID del padre
     * @param email       Email (subject)
     * @param nombre      Nombre completo
     * @param studentIds  Lista de UUIDs de alumnos vinculados
     * @param tempPassword Si debe cambiar contraseña
     */
    public String generateParentToken(
            UUID userId, String email, String nombre,
            List<String> studentIds, boolean tempPassword) {

        return buildToken(email, Map.of(
            "userId", userId.toString(),
            "role", "PARENT",
            "nombre", nombre,
            "studentIds", studentIds,
            "tempPassword", tempPassword
        ));
    }

    /**
     * Genera JWT para un maestro o administrador.
     *
     * @param userId      UUID del maestro/admin
     * @param email       Email (subject)
     * @param nombre      Nombre completo
     * @param role        "TEACHER" o "ADMIN"
     * @param level       Nivel escolar asignado (puede ser null para ADMIN)
     * @param groups      Lista de nombres de grupos asignados
     * @param tempPassword Si debe cambiar contraseña
     */
    public String generateTeacherToken(
            UUID userId, String email, String nombre,
            String role, String level, List<String> groups,
            boolean tempPassword) {

        return buildToken(email, Map.of(
            "userId", userId.toString(),
            "role", role,
            "nombre", nombre,
            "level", level != null ? level : "",
            "groups", groups,
            "tempPassword", tempPassword
        ));
    }

    // ─── Validación y Extracción ──────────────────────────────────────────────

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public String getRoleFromToken(String token) {
        return getClaims(token).get("role", String.class);
    }

    public String getUserIdFromToken(String token) {
        return getClaims(token).get("userId", String.class);
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private String buildToken(String subject, Map<String, Object> extraClaims) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(subject)
                .issuedAt(now)
                .expiration(expiry)
                .claims(extraClaims)
                .signWith(secretKey)
                .compact();
    }
}
