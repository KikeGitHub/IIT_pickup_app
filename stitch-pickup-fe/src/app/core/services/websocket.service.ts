import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { share } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ParentAlertEvent {
  id: string;
  studentId: string;
  studentName: string;
  parentId: string;
  parentName: string;
  level: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA';
  groupName: string;
  status: 'TEN_MIN' | 'FIVE_MIN' | 'EN_FILA' | 'URGENTE';
  pickupMethod: 'CAR' | 'WALK';
  sentAt: string;
}

export interface DeliveryDispatchedEvent {
  id: string;
  studentId: string;
  studentName: string;
  level: string;
  groupName: string;
  teacherName: string;
  pickupMethod?: string;
  status: 'ENTREGADO_ESCUELA' | 'RECIBIDO_PADRE' | 'RECHAZADO_PADRE' | 'REVERTIDO_DOCENTE';
  teacherConfirmedAt?: string;
  parentConfirmedAt?: string;
  parentRejectedAt?: string;
  revertedAt?: string;
  revertedBy?: string;
  logDate: string;
}

/**
 * WebSocketService — STOMP over SockJS client with auto-reconnection.
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private stompClient: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();

  private readonly connected$ = new BehaviorSubject<boolean>(false);
  private readonly parentAlert$ = new Subject<ParentAlertEvent>();
  private readonly deliveryEvent$ = new Subject<DeliveryDispatchedEvent>();
  /** Emite cuando una entrega es REVERTIDA por docente/admin → alumno vuelve al board */
  private readonly deliveryReverted$ = new Subject<DeliveryDispatchedEvent>();
  /** Emite cuando el padre rechaza una entrega → alerta urgente en monitor */
  private readonly deliveryRejected$ = new Subject<DeliveryDispatchedEvent>();

  readonly isConnected$ = this.connected$.asObservable();

  // ─── Public API ─────────────────────────────────────────────────────────────

  connect(token?: string): void {
    if (this.stompClient?.active) {
      return;
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${environment.wsUrl}`),
      connectHeaders: headers,
      debug: (msg: string) => {
        if (!environment.production) console.debug('[STOMP]', msg);
      },
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      console.info('[WebSocket] ✅ Conectado exitosamente al broker STOMP.');
      this.connected$.next(true);
      this.subscribeToTopics();
    };

    this.stompClient.onDisconnect = () => {
      console.warn('[WebSocket] ⚠️ Desconectado del broker.');
      this.connected$.next(false);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('[STOMP] Broker error:', frame.headers['message']);
    };

    this.stompClient.activate();
  }

  disconnect(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.stompClient?.deactivate();
    this.connected$.next(false);
  }

  /** Monitor/Teacher: listen for parent alerts in real-time */
  onParentAlert(): Observable<ParentAlertEvent> {
    return this.parentAlert$.asObservable().pipe(share());
  }

  /** Parent & Teacher: listen for delivery dispatch/confirmations */
  onDeliveryEvent(): Observable<DeliveryDispatchedEvent> {
    return this.deliveryEvent$.asObservable().pipe(share());
  }

  /** Monitor/Teacher/Admin: entrega revertida → alumno debe volver al board activo */
  onDeliveryReverted(): Observable<DeliveryDispatchedEvent> {
    return this.deliveryReverted$.asObservable().pipe(share());
  }

  /** Monitor/Teacher/Admin: padre rechazó entrega → marcar con badge 🚨 */
  onDeliveryRejected(): Observable<DeliveryDispatchedEvent> {
    return this.deliveryRejected$.asObservable().pipe(share());
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private subscribeToTopics(): void {
    if (!this.stompClient || !this.stompClient.connected) return;

    // School alerts topic
    const alertSub = this.stompClient.subscribe(
      '/topic/school/alerts',
      (message: IMessage) => {
        try {
          const event = JSON.parse(message.body) as ParentAlertEvent;
          console.info('[WebSocket] 🔔 Nueva Alerta Recibida por Broadcast:', event);
          this.parentAlert$.next(event);
        } catch (e) {
          console.error('[STOMP] Failed to parse alert event', e);
        }
      }
    );
    this.subscriptions.set('school-alerts', alertSub);

    // School deliveries broadcast topic
    const deliveriesSub = this.stompClient.subscribe(
      '/topic/deliveries',
      (message: IMessage) => {
        try {
          const event = JSON.parse(message.body) as DeliveryDispatchedEvent;
          console.info('[WebSocket] 🚗 Evento de Entrega Recibido:', event);
          this.deliveryEvent$.next(event);
        } catch (e) {
          console.error('[STOMP] Failed to parse delivery event', e);
        }
      }
    );
    this.subscriptions.set('school-deliveries', deliveriesSub);

    // Delivery reverted: alumno regresa al board activo
    const revertedSub = this.stompClient.subscribe(
      '/topic/delivery/reverted',
      (message: IMessage) => {
        try {
          const event = JSON.parse(message.body) as DeliveryDispatchedEvent;
          console.info('[WebSocket] 🔄 Entrega Revertida:', event);
          this.deliveryReverted$.next(event);
        } catch (e) {
          console.error('[STOMP] Failed to parse reverted delivery event', e);
        }
      }
    );
    this.subscriptions.set('delivery-reverted', revertedSub);

    // Delivery rejected by parent: urgente en monitor
    const rejectedSub = this.stompClient.subscribe(
      '/topic/delivery/rejected',
      (message: IMessage) => {
        try {
          const event = JSON.parse(message.body) as DeliveryDispatchedEvent;
          console.info('[WebSocket] 🚨 Entrega Rechazada por Padre:', event);
          this.deliveryRejected$.next(event);
        } catch (e) {
          console.error('[STOMP] Failed to parse rejected delivery event', e);
        }
      }
    );
    this.subscriptions.set('delivery-rejected', rejectedSub);

    // Parent direct topic & queue
    const userId = this.getUserIdFromToken();
    if (userId) {
      const parentDeliverySub = this.stompClient.subscribe(
        `/topic/delivery/parent/${userId}`,
        (message: IMessage) => {
          try {
            const event = JSON.parse(message.body) as DeliveryDispatchedEvent;
            this.deliveryEvent$.next(event);
          } catch (e) {
            console.error('[STOMP] Failed to parse parent delivery event', e);
          }
        }
      );
      this.subscriptions.set('parent-delivery-topic', parentDeliverySub);

      const userQueueSub = this.stompClient.subscribe(
        `/user/${userId}/queue/delivery`,
        (message: IMessage) => {
          try {
            const event = JSON.parse(message.body) as DeliveryDispatchedEvent;
            this.deliveryEvent$.next(event);
          } catch (e) {
            console.error('[STOMP] Failed to parse queue delivery event', e);
          }
        }
      );
      this.subscriptions.set('delivery-queue', userQueueSub);

      // Padre: notificación de que SU entrega fue revertida
      const parentRevertedSub = this.stompClient.subscribe(
        `/topic/delivery/parent/${userId}/reverted`,
        (message: IMessage) => {
          try {
            const event = JSON.parse(message.body) as DeliveryDispatchedEvent;
            console.info('[WebSocket] 🔄 Mi entrega fue revertida por el docente:', event);
            this.deliveryReverted$.next(event);
          } catch (e) {
            console.error('[STOMP] Failed to parse parent reverted event', e);
          }
        }
      );
      this.subscriptions.set('parent-delivery-reverted', parentRevertedSub);

      // Padre: cola privada para reversiones
      const parentRevertedQueueSub = this.stompClient.subscribe(
        `/user/${userId}/queue/delivery-reverted`,
        (message: IMessage) => {
          try {
            const event = JSON.parse(message.body) as DeliveryDispatchedEvent;
            this.deliveryReverted$.next(event);
          } catch (e) {
            console.error('[STOMP] Failed to parse parent reverted queue event', e);
          }
        }
      );
      this.subscriptions.set('parent-delivery-reverted-queue', parentRevertedQueueSub);
    }
  }

  private getUserIdFromToken(): string | null {
    try {
      const token = localStorage.getItem('sp_jwt');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId ?? null;
    } catch {
      return null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
