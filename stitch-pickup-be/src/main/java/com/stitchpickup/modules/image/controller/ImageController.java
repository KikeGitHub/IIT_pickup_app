package com.stitchpickup.modules.image.controller;

import com.stitchpickup.modules.image.dto.ImageUploadRequest;
import com.stitchpickup.modules.image.service.ImageUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * ImageController — REST para subida y servicio de imágenes IIT Pickup.
 *
 * Endpoints:
 *   POST /api/v1/images/upload         → Sube imagen Base64; retorna URL absoluta
 *   GET  /api/v1/images/file/{filename} → Sirve archivo local con cache headers
 *
 * SOLID: S — solo enrutamiento HTTP de imágenes.
 *        D — depende de la abstracción ImageUploadService.
 */
@Slf4j
@Tag(name = "Images", description = "Subida y servicio de imágenes (Cloudinary folder: iit-pickup-fotos)")
@RestController
@RequestMapping("/api/v1/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageUploadService imageUploadService;

    @Value("${iit-pickup.upload-dir:/app/uploads}")
    private String uploadDir;

    // ── POST /api/v1/images/upload ────────────────────────────────────────────

    @Operation(
        summary = "Subir imagen en Base64",
        description = "Sube imagen a Cloudinary (carpeta iit-pickup-fotos). "
                    + "Si Cloudinary no está disponible, usa disco local como fallback. "
                    + "Retorna URL absoluta lista para <img src='...'>.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @PostMapping(value = "/upload", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> upload(
            @Valid @RequestBody ImageUploadRequest request,
            HttpServletRequest httpRequest) {
        try {
            String url = imageUploadService.upload(request);
            return ResponseEntity.ok(toAbsoluteUrl(httpRequest, url));
        } catch (IllegalArgumentException ex) {
            log.warn("[ImageController] Validación: {}", ex.getMessage());
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (IOException ex) {
            log.error("[ImageController] Error al subir imagen", ex);
            return ResponseEntity.internalServerError()
                    .body("Error al procesar la imagen: " + ex.getMessage());
        }
    }

    // ── GET /api/v1/images/file/{filename} ────────────────────────────────────

    @Operation(
        summary = "Servir imagen local (fallback)",
        description = "Devuelve archivo guardado en disco cuando Cloudinary no estaba disponible."
    )
    @GetMapping("/file/{filename}")
    public ResponseEntity<byte[]> serveFile(@PathVariable String filename) {
        // Path Traversal protection
        String safe = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path file   = Paths.get(uploadDir).resolve(safe).normalize();

        if (!Files.exists(file)) {
            return ResponseEntity.notFound().build();
        }
        try {
            byte[] data = Files.readAllBytes(file);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(detectMimeType(safe)))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=604800, immutable")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(data.length))
                    .body(data);
        } catch (IOException ex) {
            log.error("[ImageController] Error leyendo archivo local: {}", safe, ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Convierte URLs relativas (/api/...) a absolutas.
     * Soporta proxy inverso Nginx via X-Forwarded-Proto y X-Forwarded-Host.
     */
    private String toAbsoluteUrl(HttpServletRequest request, String url) {
        if (url == null || !url.startsWith("/api/")) return url;

        String proto  = request.getHeader("X-Forwarded-Proto");
        String scheme = (proto != null && !proto.isBlank()) ? proto.split(",")[0].trim() : "https";

        String fwdHost = request.getHeader("X-Forwarded-Host");
        String host    = (fwdHost != null && !fwdHost.isBlank())
                ? fwdHost.split(",")[0].trim()
                : request.getServerName();

        return scheme + "://" + host + url;
    }

    private String detectMimeType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return MediaType.IMAGE_JPEG_VALUE;
        if (lower.endsWith(".gif"))  return MediaType.IMAGE_GIF_VALUE;
        if (lower.endsWith(".svg"))  return "image/svg+xml";
        if (lower.endsWith(".webp")) return "image/webp";
        return MediaType.IMAGE_PNG_VALUE;
    }
}
