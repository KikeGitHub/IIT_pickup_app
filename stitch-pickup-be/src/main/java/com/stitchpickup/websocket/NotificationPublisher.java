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
 *   /topic/deliveries               → Broadcast de entregas (despacho, confirmación, rechazo, reversión)
 *   /topic/delivery/reverted        → Broadcast específico cuando se revierte una entrega (alumno regresa al board)
 *   /topic/delivery/parent/{id}     → Notificación directa al padre (despacho)
 *   /topic/delivery/parent/{id}/reverted → Notificación directa al padre cuando su entrega es revertida
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
            log.info("[WebSocket] 📢 Alert broadcast → /topic/school/alerts: Alumno={} ({}) Grupo={} Estado={}",
                    alertResponse.studentName(), alertResponse.level(), alertResponse.groupName(), alertResponse.status());
        } catch (Exception e) {
            log.error("[WebSocket] ❌ Failed to broadcast alert: {}", e.getMessage(), e);
        }
    }

    /** Broadcast de entrega despachada o confirmada a todos los monitores */
    public void publishDelivery(DeliveryLogResponse delivery) {
        try {
            messagingTemplate.convertAndSend("/topic/deliveries", delivery);
            log.info("[WebSocket] 📢 Delivery broadcast → /topic/deliveries: Alumno={} ({}) Estado={}",
                    delivery.studentName(), delivery.level(), delivery.status());
        } catch (Exception e) {
            log.error("[WebSocket] ❌ Failed to broadcast delivery: {}", e.getMessage(), e);
        }
    }

    /**
     * Broadcast cuando el padre rechaza una entrega — el alumno debe volver al board
     * con indicador de urgencia 🚨 en el monitor.
     */
    public void publishRejectedDeliveryAlert(DeliveryLogResponse delivery) {
        try {
            messagingTemplate.convertAndSend("/topic/delivery/rejected", delivery);
            log.info("[WebSocket] 🚨 Parent rejected delivery → /topic/delivery/rejected: Alumno={}", delivery.studentName());
        } catch (Exception e) {
            log.error("[WebSocket] ❌ Failed to broadcast rejected delivery: {}", e.getMessage(), e);
        }
    }

    /**
     * Broadcast cuando un docente/admin revierte una entrega — el alumno regresa al board activo.
     */
    public void publishRevertedDelivery(DeliveryLogResponse delivery) {
        try {
            messagingTemplate.convertAndSend("/topic/delivery/reverted", delivery);
            log.info("[WebSocket] 🔄 Delivery reverted → /topic/delivery/reverted: Alumno={} by={}",
                    delivery.studentName(), delivery.revertedBy());
        } catch (Exception e) {
            log.error("[WebSocket] ❌ Failed to broadcast reverted delivery: {}", e.getMessage(), e);
        }
    }

    /** Mensaje directo al padre notificando que su hijo ya está en puerta */
    public void notifyParentDeliveryReady(String parentId, DeliveryLogResponse delivery) {
        try {
            // Enviar por topic directo del padre
            messagingTemplate.convertAndSend("/topic/delivery/parent/" + parentId, delivery);
            // Enviar también por cola de usuario
            messagingTemplate.convertAndSendToUser(parentId, "/queue/delivery", delivery);
            log.info("[WebSocket] 📢 Direct parent delivery notification: ParentId={} Alumno={}",
                    parentId, delivery.studentName());
        } catch (Exception e) {
            log.error("[WebSocket] ❌ Failed to notify parent {}: {}", parentId, e.getMessage(), e);
        }
    }

    /**
     * Notificación directa al padre cuando la entrega de su hijo es revertida por el docente.
     * Cierra el modal de entrega en el celular del padre.
     */
    public void notifyParentDeliveryReverted(String parentId, DeliveryLogResponse delivery) {
        try {
            messagingTemplate.convertAndSend("/topic/delivery/parent/" + parentId + "/reverted", delivery);
            messagingTemplate.convertAndSendToUser(parentId, "/queue/delivery-reverted", delivery);
            log.info("[WebSocket] 🔄 Parent delivery reverted notification: ParentId={} Alumno={}",
                    parentId, delivery.studentName());
        } catch (Exception e) {
            log.error("[WebSocket] ❌ Failed to notify parent {} of revert: {}", parentId, e.getMessage(), e);
        }
    }
}
