package com.stitchpickup.config;

import com.stitchpickup.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * WebSocketConfig — Configura el broker STOMP sobre WebSocket con autenticación JWT.
 *
 * Seguridad de datos de menores:
 * - Valida JWT obligatorio en el frame STOMP CONNECT.
 * - Restringe suscripciones STOMP SUBSCRIBE para que un PARENT únicamente pueda
 *   suscribirse a sus propios canales y a los canales de sus hijos vinculados.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider tokenProvider;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/user");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }

                StompCommand command = accessor.getCommand();
                if (StompCommand.CONNECT.equals(command)) {
                    authenticateConnect(accessor);
                } else if (StompCommand.SUBSCRIBE.equals(command)) {
                    authorizeSubscription(accessor);
                }
                return message;
            }
        });
    }

    private void authenticateConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            log.warn("[WebSocket] Conexión STOMP rechazada: falta header Authorization Bearer");
            throw new MessagingException("Autenticación JWT requerida para WebSocket");
        }

        String token = authHeader.substring(7);
        if (!tokenProvider.validateToken(token)) {
            log.warn("[WebSocket] Conexión STOMP rechazada: JWT inválido o expirado");
            throw new MessagingException("Token JWT inválido o expirado");
        }

        Claims claims = tokenProvider.getClaims(token);
        String email = claims.getSubject();
        String userId = claims.get("userId", String.class);
        String role = claims.get("role", String.class);
        if (!StringUtils.hasText(role)) {
            role = "PARENT";
        }
        String normalizedRole = role.toUpperCase();

        @SuppressWarnings("unchecked")
        List<String> studentIds = claims.get("studentIds", List.class);

        Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
        if (sessionAttrs != null) {
            sessionAttrs.put("userId", userId);
            sessionAttrs.put("role", normalizedRole);
            sessionAttrs.put("studentIds", studentIds != null ? studentIds : List.of());
        }

        var auth = new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + normalizedRole))
        );
        accessor.setUser(auth);
    }

    private void authorizeSubscription(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
        if (user == null || sessionAttrs == null) {
            throw new MessagingException("Sesión WebSocket no autenticada");
        }

        String role = String.valueOf(sessionAttrs.getOrDefault("role", ""));
        if (!"PARENT".equals(role)) {
            // TEACHER, ADMIN, MONITOR pueden suscribirse a los canales operativos del monitor
            return;
        }

        String destination = accessor.getDestination();
        String userId = String.valueOf(sessionAttrs.getOrDefault("userId", ""));
        @SuppressWarnings("unchecked")
        List<String> studentIds = (List<String>) sessionAttrs.getOrDefault("studentIds", List.of());

        if (!isAllowedParentDestination(destination, userId, studentIds)) {
            log.warn("[WebSocket] Suscripción denegada a padre userId={} hacia destination={}", userId, destination);
            throw new MessagingException("No autorizado para suscribirse a este canal");
        }
    }

    private boolean isAllowedParentDestination(String destination, String userId, List<String> studentIds) {
        if (!StringUtils.hasText(destination) || !StringUtils.hasText(userId)) {
            return false;
        }
        if (destination.equals("/topic/delivery/parent/" + userId)
                || destination.equals("/topic/delivery/parent/" + userId + "/reverted")
                || destination.equals("/topic/alert/parent/" + userId + "/seen")
                || destination.startsWith("/user/" + userId + "/queue/")) {
            return true;
        }
        for (String sid : studentIds) {
            if (destination.startsWith("/topic/student/" + sid + "/")) {
                return true;
            }
        }
        return false;
    }
}
