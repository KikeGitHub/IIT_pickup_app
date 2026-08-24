import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AlertResponse } from '../../../core/models/alert.model';
import { environment } from '../../../../environments/environment';

export interface MonitorAlert {
  id: string;
  parentId: string;
  parentName: string;
  studentId: string;
  studentName: string;
  level: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA';
  groupName: string;
  status: 'TEN_MIN' | 'FIVE_MIN' | 'EN_FILA' | 'URGENTE';
  pickupMethod: 'CAR' | 'WALK';
  sentAt: string;
  isDispatched: boolean;
}

export interface DeliveryRecord {
  id: string;
  studentId: string;
  studentName: string;
  level: string;
  groupName: string;
  teacherName: string;
  pickupMethod: string;
  status: 'ENTREGADO_ESCUELA' | 'RECIBIDO_PADRE';
  teacherConfirmedAt: string;
  logDate: string;
}

export type LevelFilter = 'ALL' | 'KINDER' | 'PRIMARIA' | 'SECUNDARIA';

@Injectable({
  providedIn: 'root'
})
export class MonitorService {
  private readonly http = inject(HttpClient);
  private readonly ws = inject(WebSocketService);
  private readonly notification = inject(NotificationService);

  private readonly apiUrl = environment.apiUrl;

  // ─── Reactive State ───────────────────────────────────────────────────────
  readonly alerts = signal<MonitorAlert[]>([]);
  readonly deliveries = signal<DeliveryRecord[]>([]);
  readonly selectedLevel = signal<LevelFilter>('ALL');
  readonly dispatchingAlertId = signal<string | null>(null);

  // ─── Computed KPIs ────────────────────────────────────────────────────────
  readonly urgentCount = computed(() =>
    this.alerts().filter(a => a.status === 'URGENTE' && !a.isDispatched).length
  );
  readonly enFilaCount = computed(() =>
    this.alerts().filter(a => a.status === 'EN_FILA' && !a.isDispatched).length
  );
  readonly dispatchedCount = computed(() =>
    this.deliveries().length
  );
  readonly totalActive = computed(() =>
    this.alerts().filter(a => !a.isDispatched).length
  );

  // ─── Filtered Alerts ─────────────────────────────────────────────────────
  readonly filteredAlerts = computed(() => {
    const level = this.selectedLevel();
    const all = this.alerts().filter(a => !a.isDispatched);
    if (level === 'ALL') return all;
    return all.filter(a => a.level === level);
  });

  // ─── Initialization ──────────────────────────────────────────────────────
  initialize(): void {
    this.loadTodayAlerts();
    this.loadTodayDeliveries();
    this.subscribeToWebSocket();
  }

  // ─── Level Filter ─────────────────────────────────────────────────────────
  setLevelFilter(level: LevelFilter): void {
    this.selectedLevel.set(level);
  }

  // ─── Dispatch (Teacher confirms student at gate) ──────────────────────────
  dispatch(alertId: string): void {
    this.dispatchingAlertId.set(alertId);

    this.http.post<DeliveryRecord>(`${this.apiUrl}/deliveries/${alertId}/dispatch`, {}).pipe(
      tap((delivery) => {
        this.dispatchingAlertId.set(null);
        // Mark alert as dispatched
        this.alerts.update(alerts =>
          alerts.map(a => a.id === alertId ? { ...a, isDispatched: true } : a)
        );
        // Add to deliveries
        this.deliveries.update(d => [delivery, ...d]);
        this.notification.success(`✅ ${delivery.studentName} entregado a ${delivery.teacherName ?? 'maestro'}`);
      }),
      catchError((err) => {
        this.dispatchingAlertId.set(null);
        this.notification.error('Error al registrar la entrega. Intente nuevamente.');
        return of(null);
      })
    ).subscribe();
  }

  // ─── Private: HTTP Load ──────────────────────────────────────────────────
  private loadTodayAlerts(): void {
    this.http.get<AlertResponse[]>(`${this.apiUrl}/alerts/today`).pipe(
      tap((alerts) => {
        const monitorAlerts: MonitorAlert[] = alerts.map(a => ({
          id: a.id,
          parentId: a.parentId,
          parentName: a.parentName,
          studentId: a.studentId,
          studentName: a.studentName,
          level: a.level as MonitorAlert['level'],
          groupName: a.groupName,
          status: a.status,
          pickupMethod: a.pickupMethod,
          sentAt: a.sentAt,
          isDispatched: false
        }));
        this.alerts.set(monitorAlerts);
      }),
      catchError(() => {
        // Demo data offline
        this.alerts.set([
          { id: 'demo-1', parentId: 'p1', parentName: 'Carlos Ramírez', studentId: 's1', studentName: 'Sofía Ramírez', level: 'PRIMARIA', groupName: '3A', status: 'EN_FILA', pickupMethod: 'CAR', sentAt: new Date().toISOString(), isDispatched: false },
          { id: 'demo-2', parentId: 'p2', parentName: 'Ana Torres', studentId: 's3', studentName: 'Isabella Torres', level: 'KINDER', groupName: 'KB', status: 'URGENTE', pickupMethod: 'WALK', sentAt: new Date().toISOString(), isDispatched: false },
          { id: 'demo-3', parentId: 'p3', parentName: 'Roberto González', studentId: 's2', studentName: 'Mateo González', level: 'PRIMARIA', groupName: '3A', status: 'FIVE_MIN', pickupMethod: 'CAR', sentAt: new Date().toISOString(), isDispatched: false },
        ]);
        return of([]);
      })
    ).subscribe();
  }

  private loadTodayDeliveries(): void {
    this.http.get<DeliveryRecord[]>(`${this.apiUrl}/deliveries/today`).pipe(
      tap((deliveries) => this.deliveries.set(deliveries)),
      catchError(() => { this.deliveries.set([]); return of([]); })
    ).subscribe();
  }

  // ─── Private: WebSocket ──────────────────────────────────────────────────
  private subscribeToWebSocket(): void {
    // Listen for new parent proximity alerts
    this.ws.onParentAlert().subscribe(event => {
      const exists = this.alerts().some(a => a.id === event.alertId);
      if (!exists) {
        const newAlert: MonitorAlert = {
          id: event.alertId,
          parentId: '',
          parentName: event.parentNombre,
          studentId: event.studentId,
          studentName: event.studentName,
          level: 'PRIMARIA', // will be updated from full alert
          groupName: '',
          status: event.status,
          pickupMethod: event.pickupMethod,
          sentAt: event.sentAt,
          isDispatched: false
        };
        this.alerts.update(alerts => [newAlert, ...alerts]);

        const statusLabel: Record<string, string> = { TEN_MIN: '10 MIN', FIVE_MIN: '5 MIN', EN_FILA: 'EN FILA', URGENTE: '🚨 URGENTE' };
        this.notification.info(`📍 ${event.studentName} — ${statusLabel[event.status] || event.status}`);
      }
    });
  }
}
