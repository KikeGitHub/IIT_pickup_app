package com.stitchpickup;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada del sistema Stitch Pickup.
 *
 * Sistema de logística de recogida de alumnos para el Instituto Inglés de Toluca.
 * Stack: Spring Boot 3.3 · Spring Security (JWT) · PostgreSQL 16 · Flyway · STOMP WebSocket
 */
@SpringBootApplication
public class StitchPickupApplication {

    public static void main(String[] args) {
        SpringApplication.run(StitchPickupApplication.class, args);
    }
}
