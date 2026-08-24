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
 *   /topic/school/alerts            → Broadcast de nueva alerta a monitores
 *   /topic/deliveries               → Broadcast de entregas a monitores y padres
 *   /topic/delivery/parent/{id}     → Notificación directa al padre
 *   /user/{parentId}/queue/delivery → Cola privada del padre
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
            messagingTemplate.convertAndSend("/topic/school/alerts", alertResponse);
            log.debug("Alert broadcast → /topic/school/alerts for student: {}", alertResponse.studentName());
        } catch (Exception e) {
            log.warn("Failed to broadcast alert: {}", e.getMessage());
        }
    }

    /** Broadcast de entrega despachada o confirmada a todos los monitores */
    public void publishDelivery(DeliveryLogResponse delivery) {
        try {
            messagingTemplate.convertAndSend("/topic/deliveries", delivery);
            log.debug("Delivery broadcast → /topic/deliveries for student: {}", delivery.studentName());
        } catch (Exception e) {
            log.warn("Failed to broadcast delivery: {}", e.getMessage());
        }
    }

    /** Mensaje directo al padre notificando que su hijo ya está en puerta */
    public void notifyParentDeliveryReady(String parentId, DeliveryLogResponse delivery) {
        try {
            // Enviar por topic directo del padre
            messagingTemplate.convertAndSend("/topic/delivery/parent/" + parentId, delivery);
            // Enviar también por cola de usuario
            messagingTemplate.convertAndSendToUser(parentId, "/queue/delivery", delivery);
            log.debug("Delivery notification sent to parent: {}", parentId);
        } catch (Exception e) {
            log.warn("Failed to notify parent {}: {}", parentId, e.getMessage());
        }
    }
}
