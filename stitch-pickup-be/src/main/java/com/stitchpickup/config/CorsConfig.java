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

    @Value("${spring.websocket.allowed-origins:http://localhost:3000,http://localhost:4200}")
    private String allowedOriginsRaw;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Orígenes permitidos
        List<String> origins = Arrays.asList(allowedOriginsRaw.split(","));
        config.setAllowedOrigins(origins);

        // Métodos HTTP permitidos
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Headers permitidos
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));

        // Headers expuestos al cliente
        config.setExposedHeaders(List.of("Authorization"));

        // Credenciales (necesario para WebSocket con Authorization header)
        config.setAllowCredentials(true);

        // Tiempo de caché del preflight (segundos)
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
