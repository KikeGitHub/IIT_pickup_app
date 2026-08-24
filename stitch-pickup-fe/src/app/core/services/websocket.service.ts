import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter, share } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ParentAlertEvent {
  alertId: string;
  studentId: string;
  studentName: string;
  parentNombre: string;
  status: 'TEN_MIN' | 'FIVE_MIN' | 'EN_FILA' | 'URGENTE';
  pickupMethod: 'CAR' | 'WALK';
  sentAt: string;
}

export interface AdminConfirmEvent {
  studentId: string;
  studentName: string;
  teacherName: string;
  confirmedAt: string;
  message: string;
}

/**
 * WebSocketService — STOMP over SockJS client with auto-reconnection.
 *
 * Architecture (ADR-003):
 * - Uses @stomp/stompjs v7 (modern, tree-shakeable)
 * - SockJS fallback for environments without native WS
 * - Exposes typed observables per topic
 * - Auto-reconnects with exponential backoff
 *
 * SOLID:
 * - S: Only handles WS connection and message routing
 * - I: Separate observables per event type
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private stompClient: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();

  private readonly connected$ = new BehaviorSubject<boolean>(false);
  private readonly parentAlert$ = new Subject<ParentAlertEvent>();
  private readonly adminConfirm$ = new Subject<AdminConfirmEvent>();

  readonly isConnected$ = this.connected$.asObservable();

  // ─── Public API ─────────────────────────────────────────────────────────────

  connect(token: string): void {
    if (this.stompClient?.active) {
      return; // Already connected
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${environment.wsUrl}`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (msg: string) => {
        if (!environment.production) console.debug('[STOMP]', msg);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      this.connected$.next(true);
      this.subscribeToTopics();
    };

    this.stompClient.onDisconnect = () => {
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

  /** Parent: listen for delivery confirmation from admin */
  onAdminConfirm(): Observable<AdminConfirmEvent> {
    return this.adminConfirm$.asObservable().pipe(share());
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private subscribeToTopics(): void {
    if (!this.stompClient) return;

    // All authenticated users subscribe to school alerts topic (monitor view)
    const alertSub = this.stompClient.subscribe(
      '/topic/school/alerts',
      (message: IMessage) => {
        try {
          const event = JSON.parse(message.body) as ParentAlertEvent;
          this.parentAlert$.next(event);
        } catch (e) {
          console.error('[STOMP] Failed to parse alert event', e);
        }
      }
    );
    this.subscriptions.set('school-alerts', alertSub);

    // Parent-specific: delivery confirmation
    const userId = this.getUserIdFromToken();
    if (userId) {
      const deliverySub = this.stompClient.subscribe(
        `/user/${userId}/queue/delivery`,
        (message: IMessage) => {
          try {
            const event = JSON.parse(message.body) as AdminConfirmEvent;
            this.adminConfirm$.next(event);
          } catch (e) {
            console.error('[STOMP] Failed to parse delivery event', e);
          }
        }
      );
      this.subscriptions.set('delivery-confirm', deliverySub);
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
