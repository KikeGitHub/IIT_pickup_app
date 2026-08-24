package com.stitchpickup.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocketConfig — Configura el broker STOMP sobre WebSocket.
 *
 * Arquitectura (ADR-003-websocket-stomp):
 * - Endpoint: /ws  (con fallback SockJS)
 * - Prefijo de app: /app  (mensajes que van al servidor)
 * - Prefijos de broker: /topic (broadcast), /user (user-queue)
 *
 * SOLID — S: Solo configura WebSocket. Lógica de mensajería en NotificationPublisher.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${spring.websocket.allowed-origins:http://localhost:3000,http://localhost:4200}")
    private String allowedOriginsRaw;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefijos para mensajes del servidor hacia el cliente
        registry.enableSimpleBroker("/topic", "/user");

        // Prefijo para mensajes del cliente hacia el servidor (@MessageMapping)
        registry.setApplicationDestinationPrefixes("/app");

        // Prefijo para user-specific destinations (/user/{userId}/queue/delivery)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = allowedOriginsRaw.split(",");

        registry.addEndpoint("/ws")
                .setAllowedOrigins(origins)
                .withSockJS();  // Fallback para navegadores sin WebSocket nativo
    }
}
