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
        String url = (cloudinaryUrl != null && !cloudinaryUrl.isBlank()) 
                ? cloudinaryUrl : System.getenv("CLOUDINARY_URL");
        
        if (url != null && !url.isBlank()) {
            log.info("[Cloudinary] Configurado exitosamente via CLOUDINARY_URL");
            return new Cloudinary(url);
        }

        String cName = (cloudName != null && !cloudName.isBlank()) 
                ? cloudName : System.getenv("CLOUDINARY_CLOUD_NAME");
        String aKey = (apiKey != null && !apiKey.isBlank()) 
                ? apiKey : System.getenv("CLOUDINARY_API_KEY");
        String aSecret = (apiSecret != null && !apiSecret.isBlank()) 
                ? apiSecret : System.getenv("CLOUDINARY_SECRET");

        if (cName != null && !cName.isBlank()
                && aKey != null && !aKey.isBlank()
                && aSecret != null && !aSecret.isBlank()) {
            Map<String, String> config = new HashMap<>();
            config.put("cloud_name", cName);
            config.put("api_key",    aKey);
            config.put("api_secret", aSecret);
            log.info("[Cloudinary] Configurado exitosamente via credenciales individuales (cloud={})", cName);
            return new Cloudinary(config);
        }

        log.warn("[Cloudinary] Sin credenciales configuradas.");
        return new Cloudinary(new HashMap<>());
    }
}
