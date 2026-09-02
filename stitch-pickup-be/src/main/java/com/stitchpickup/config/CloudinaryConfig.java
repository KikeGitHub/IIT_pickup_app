package com.stitchpickup.config;

import com.cloudinary.Cloudinary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * CloudinaryConfig — crea el Bean {@link Cloudinary} para IIT Pickup.
 *
 * Estrategia de inicialización (por orden de precedencia):
 *  1. CLOUDINARY_URL   → cloudinary://api_key:secret@cloud_name
 *  2. Variables individuales → CLOUDINARY_CLOUD_NAME / API_KEY / SECRET
 *  3. Sin credenciales → Bean vacío; ImageUploadService usará disco local
 *
 * SOLID-S: única responsabilidad — configurar el SDK de Cloudinary.
 */
@Configuration
public class CloudinaryConfig {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryConfig.class);

    @Value("${cloudinary.url:}")
    private String cloudinaryUrl;

    @Value("${cloudinary.cloud_name:}")
    private String cloudName;

    @Value("${cloudinary.api_key:}")
    private String apiKey;

    @Value("${cloudinary.api_secret:}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        // Opción 1: CLOUDINARY_URL única
        if (cloudinaryUrl != null && !cloudinaryUrl.isBlank()) {
            log.info("[Cloudinary] Configurado via CLOUDINARY_URL");
            return new Cloudinary(cloudinaryUrl);
        }

        // Opción 2: credenciales individuales
        if (cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank()) {
            Map<String, String> config = new HashMap<>();
            config.put("cloud_name", cloudName);
            config.put("api_key",    apiKey);
            config.put("api_secret", apiSecret);
            log.info("[Cloudinary] Configurado via credenciales individuales (cloud={})", cloudName);
            return new Cloudinary(config);
        }

        // Opción 3: sin credenciales → fallback a disco local
        log.warn("[Cloudinary] Sin credenciales configuradas. Las imágenes se guardarán en disco local.");
        return new Cloudinary(new HashMap<>());
    }
}
