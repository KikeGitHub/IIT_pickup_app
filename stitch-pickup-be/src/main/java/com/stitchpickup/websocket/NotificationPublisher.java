package com.stitchpickup.websocket;

import com.stitchpickup.modules.alert.dto.AlertResponse;
import com.stitchpickup.modules.delivery.dto.DeliveryLogResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * NotificationPublisher — Centraliza toda la emisión de eventos WebSocket.
 *
 * Tópicos:
 *   /topic/alerts       → Broadcast de nueva alerta a todos los monitores
 *   /topic/deliveries   → Broadcast de entrega confirmada a todos los monitores
 *   /user/{parentId}/queue/delivery → Confirmación privada al padre
 *
 * SOLID — S: Solo emite mensajes. No contiene lógica de negocio.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    /** Broadcast de alerta de proximidad a todos los monitores */
    public void publishAlert(AlertResponse alertResponse) {
        try {
            messagingTemplate.convertAndSend("/topic/alerts", alertResponse);
            log.debug("Alert broadcast → /topic/alerts for student: {}", alertResponse.studentName());
        } catch (Exception e) {
            log.warn("Failed to broadcast alert: {}", e.getMessage());
        }
    }

    /** Broadcast de entrega despachada a todos los monitores */
    public void publishDelivery(DeliveryLogResponse delivery) {
        try {
            messagingTemplate.convertAndSend("/topic/deliveries", delivery);
            log.debug("Delivery broadcast → /topic/deliveries for student: {}", delivery.studentName());
        } catch (Exception e) {
            log.warn("Failed to broadcast delivery: {}", e.getMessage());
        }
    }

    /** Mensaje privado al padre notificando que su hijo ya está en puerta */
    public void notifyParentDeliveryReady(String parentId, DeliveryLogResponse delivery) {
        try {
            messagingTemplate.convertAndSendToUser(parentId, "/queue/delivery", delivery);
            log.debug("Delivery notification → /user/{}/queue/delivery", parentId);
        } catch (Exception e) {
            log.warn("Failed to notify parent {}: {}", parentId, e.getMessage());
        }
    }
}
