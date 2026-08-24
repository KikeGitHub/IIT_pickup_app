package com.stitchpickup.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CorsConfig — Permite requests desde el frontend Angular.
 *
 * En desarrollo: http://localhost:3000 y http://localhost:4200
 * En producción: configurar WS_ALLOWED_ORIGINS con el dominio real.
 *
 * SOLID — S: Solo configura CORS.
 */
@Configuration
public class CorsConfig {

    @Value("${spring.websocket.allowed-origins:http://localhost:3000,http://localhost:4200,http://127.0.0.1:3000,http://127.0.0.1:4200}")
    private String allowedOriginsRaw;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Orígenes permitidos (soporta lista explícita y patrones)
        List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        config.setAllowedOrigins(origins);
        config.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));

        // Métodos HTTP permitidos
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));

        // Headers permitidos (todos)
        config.setAllowedHeaders(List.of("*"));

        // Headers expuestos al cliente
        config.setExposedHeaders(List.of("Authorization", "Content-Disposition"));

        // Credenciales habilitadas
        config.setAllowCredentials(true);

        // Tiempo de caché del preflight (1 hora)
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
