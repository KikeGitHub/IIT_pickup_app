package com.stitchpickup.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * GlobalExceptionHandler — Transforma excepciones en respuestas HTTP estandarizadas (RFC 9457).
 *
 * Usa ProblemDetail de Spring 6 para respuestas consistentes con el frontend Angular.
 *
 * SOLID — S: Solo maneja el mapeo de excepciones a HTTP responses.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ─── Validación Bean Validation (@Valid) ──────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : "Valor inválido",
                        (a, b) -> a
                ));

        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Error de validación");
        pd.setDetail("Uno o más campos contienen errores");
        pd.setType(URI.create("urn:stitch-pickup:validation-error"));
        pd.setProperty("errors", errors);
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    // ─── Credenciales Inválidas ───────────────────────────────────────────────

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        pd.setTitle("Credenciales inválidas");
        pd.setDetail(ex.getMessage());
        pd.setType(URI.create("urn:stitch-pickup:invalid-credentials"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    // ─── Acceso Denegado ──────────────────────────────────────────────────────

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        pd.setTitle("Acceso denegado");
        pd.setDetail("No tienes permisos para realizar esta acción");
        pd.setType(URI.create("urn:stitch-pickup:access-denied"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    // ─── Argumento Ilegal ─────────────────────────────────────────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        pd.setTitle("Recurso no encontrado");
        pd.setDetail(ex.getMessage());
        pd.setType(URI.create("urn:stitch-pickup:not-found"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    // ─── Error General ────────────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneral(Exception ex) {
        log.error("Error no controlado: {}", ex.getMessage(), ex);
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        pd.setTitle("Error interno del servidor");
        pd.setDetail("Ocurrió un error inesperado. Contacta al administrador.");
        pd.setType(URI.create("urn:stitch-pickup:internal-error"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }
}
