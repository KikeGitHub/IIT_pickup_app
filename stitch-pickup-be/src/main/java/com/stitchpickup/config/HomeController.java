package com.stitchpickup.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * HomeController — Endpoint raíz informativo para comprobaciones rápidas de estado.
 */
@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
            "app", "IIT Pickup API",
            "status", "UP",
            "swagger", "/swagger-ui.html",
            "timestamp", Instant.now().toString()
        ));
    }
}

