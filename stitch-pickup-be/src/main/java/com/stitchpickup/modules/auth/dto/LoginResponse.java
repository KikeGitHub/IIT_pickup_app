package com.stitchpickup.modules.auth.dto;

import java.util.List;

/**
 * DTO de respuesta del login.
 *
 * Incluye el JWT y toda la información necesaria para inicializar
 * el estado de la aplicación Angular sin hacer requests adicionales.
 *
 * SOLID — I: Contiene exactamente lo que el frontend necesita saber.
 */
public record LoginResponse(
    /** JSON Web Token (Bearer) */
    String token,

    /** ID del usuario */
    String userId,

    /** Email del usuario */
    String email,

    /** Nombre completo */
    String nombre,

    /** Rol: PARENT, TEACHER, ADMIN */
    String role,

    /** Si el usuario debe cambiar su contraseña */
    boolean tempPassword,

    /**
     * Para PARENT: lista de IDs de alumnos vinculados.
     * Para TEACHER/ADMIN: null o lista de grupos.
     */
    List<String> studentIds,

    /**
     * Para TEACHER/ADMIN: nivel escolar asignado.
     * Para PARENT: null.
     */
    String level,

    /**
     * Para TEACHER/ADMIN: grupos asignados (ej: ["3A", "5B"]).
     * Para PARENT: null.
     */
    List<String> groups
) {}
