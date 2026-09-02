package com.stitchpickup.modules.image.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.stitchpickup.modules.image.dto.ImageUploadRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;

/**
 * ImageUploadService — Servicio de subida de imágenes para IIT Pickup.
 *
 * Todas las imágenes van a la carpeta raíz "iit-pickup-fotos" en Cloudinary,
 * organizadas en subcarpetas por tipo: students / teachers / parents.
 *
 * Flujo con RESILIENCIA:
 *  1. Decodifica Base64 (soporta con/sin prefijo data:image/...)
 *  2. Determina subcarpeta por tipo (student → students, etc.)
 *  3. Intenta subir a Cloudinary (crop:limit, 1000px, q_auto, f_auto)
 *  4. Si Cloudinary falla o no tiene credenciales → guarda en disco local /app/uploads
 *  5. Retorna URL pública de Cloudinary o URL relativa /api/v1/images/file/{name}
 *
 * SOLID: S-solo gestión de imágenes. D-depende del Bean Cloudinary inyectado.
 */
@Slf4j
@Service
public class ImageUploadService {

    private static final String ROOT_FOLDER   = "iit-pickup-fotos";
    private static final int    MAX_DIM_PX    = 1000;

    private final Cloudinary cloudinary;

    @Value("${iit-pickup.upload-dir:/app/uploads}")
    private String uploadDir;

    public ImageUploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    /**
     * Sube una imagen al almacenamiento (Cloudinary con fallback local).
     *
     * @param request DTO con type, identifier, extraName y base64File
     * @return URL pública de Cloudinary o URL relativa local
     */
    public String upload(ImageUploadRequest request) throws IOException {
        validateRequest(request);

        byte[] imageBytes = decodeBase64(request.base64File());
        String folder     = resolveFolder(request.type());
        String publicId   = buildPublicId(request);

        return resolveImageUrl(publicId, folder, imageBytes);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /** Soporta Base64 con o sin prefijo "data:image/xxx;base64," */
    private byte[] decodeBase64(String raw) {
        String clean = raw.contains(",") ? raw.split(",", 2)[1] : raw;
        return Base64.getDecoder().decode(clean.trim());
    }

    /**
     * Subcarpeta por tipo dentro de "iit-pickup-fotos".
     * student  → iit-pickup-fotos/students
     * teacher  → iit-pickup-fotos/teachers
     * parent   → iit-pickup-fotos/parents
     */
    private String resolveFolder(String type) {
        return switch (type.toLowerCase()) {
            case "student" -> ROOT_FOLDER + "/students";
            case "teacher" -> ROOT_FOLDER + "/teachers";
            case "parent"  -> ROOT_FOLDER + "/parents";
            default        -> ROOT_FOLDER + "/misc";
        };
    }

    /**
     * Construye el public_id: {type}_{identifier}_{extraName}
     * Ejemplo: student_abc123_sofia-ramirez
     */
    private String buildPublicId(ImageUploadRequest req) {
        StringBuilder sb = new StringBuilder(req.type().toLowerCase());
        if (req.identifier() != null && !req.identifier().isBlank()) {
            sb.append("_").append(sanitize(req.identifier()));
        }
        if (req.extraName() != null && !req.extraName().isBlank()) {
            sb.append("_").append(sanitize(req.extraName()));
        }
        return sb.toString();
    }

    private String sanitize(String input) {
        return input.toLowerCase()
                .replaceAll("[^a-z0-9-]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }

    /**
     * RESILIENCIA: intenta Cloudinary; si falla → disco local.
     */
    private String resolveImageUrl(String publicId, String folder, byte[] bytes) throws IOException {
        try {
            Map<String, Object> result = uploadToCloudinary(bytes, folder, publicId);
            Object url = result.get("secure_url");
            if (url != null && !url.toString().isBlank()) {
                log.info("[ImageUpload] Subida a Cloudinary exitosa → {}", url);
                return url.toString();
            }
            log.warn("[ImageUpload] Cloudinary no retornó secure_url. Usando fallback local.");
        } catch (Exception ex) {
            log.error("[ImageUpload] Error al conectar/subir a Cloudinary: {}. Usando fallback a disco local.", ex.getMessage(), ex);
        }
        return saveLocally(bytes, publicId);
    }

    /**
     * Sube a Cloudinary con transformaciones:
     * crop=limit, w=1000, h=1000, q_auto, f_auto
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> uploadToCloudinary(byte[] bytes, String folder, String publicId)
            throws IOException {
        Map<String, Object> params = ObjectUtils.asMap(
                "folder",           folder,
                "public_id",        publicId,
                "unique_filename",  false,
                "overwrite",        true,
                "transformation",   new Transformation()
                                        .width(MAX_DIM_PX)
                                        .height(MAX_DIM_PX)
                                        .crop("limit")
                                        .quality("auto")
                                        .fetchFormat("auto")
        );
        return cloudinary.uploader().upload(bytes, params);
    }

    /** Guarda en disco local y retorna URL relativa servida por ImageController. */
    private String saveLocally(byte[] bytes, String name) throws IOException {
        String safeName = sanitize(name) + "_" + System.currentTimeMillis() + ".png";
        Path dir = Paths.get(uploadDir);
        try {
            Files.createDirectories(dir);
        } catch (Exception e) {
            // Fallback a /tmp/uploads si el directorio configurado no tiene permisos
            dir = Paths.get(System.getProperty("java.io.tmpdir"), "uploads");
            Files.createDirectories(dir);
        }
        Path file = dir.resolve(safeName);
        Files.write(file, bytes);
        log.info("[ImageUpload] Imagen guardada localmente: {}", file.toAbsolutePath());
        return "/api/v1/images/file/" + safeName;
    }

    private void validateRequest(ImageUploadRequest req) {
        if (req.base64File() == null || req.base64File().isBlank()) {
            throw new IllegalArgumentException("base64File no puede estar vacío.");
        }
        if (req.type() == null || req.type().isBlank()) {
            throw new IllegalArgumentException("type es obligatorio (student | teacher | parent).");
        }
    }
}
