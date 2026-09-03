import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of, forkJoin } from 'rxjs';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationSoundService } from '../../../core/services/notification-sound.service';
import { AuthService } from '../../../core/services/auth.service';
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
  isUpdated: boolean;
  /** Indica que el padre reportó no haber recibido al alumno — mostrar badge 🚨 */
  isRejectedByParent?: boolean;
}

export interface DeliveryRecord {
  id: string;
  studentId: string;
  studentName: string;
  level: string;
  groupName: string;
  teacherName: string;
  pickupMethod: string;
  status: 'ENTREGADO_ESCUELA' | 'RECIBIDO_PADRE' | 'RECHAZADO_PADRE' | 'REVERTIDO_DOCENTE';
  teacherConfirmedAt: string;
  parentConfirmedAt?: string;
  parentRejectedAt?: string;
  revertedAt?: string;
  revertedBy?: string;
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
  private readonly sound = inject(NotificationSoundService);
  private readonly auth = inject(AuthService);

  private readonly apiUrl = environment.apiUrl;

  // ─── Reactive State ───────────────────────────────────────────────────────
  readonly alerts = signal<MonitorAlert[]>([]);
  readonly deliveries = signal<DeliveryRecord[]>([]);
  readonly selectedLevel = signal<LevelFilter>('ALL');
  readonly dispatchingAlertId = signal<string | null>(null);
  readonly revertingDeliveryId = signal<string | null>(null);

  // ─── Computed KPIs ────────────────────────────────────────────────────────
  readonly urgentCount = computed(() =>
    this.alerts().filter(a => a.status === 'URGENTE' && !a.isDispatched).length
  );
  readonly enFilaCount = computed(() =>
    this.alerts().filter(a => a.status === 'EN_FILA' && !a.isDispatched).length
  );
  readonly dispatchedCount = computed(() =>
    this.deliveries().filter(d => d.status !== 'REVERTIDO_DOCENTE').length
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
    this.loadTodayAlertsGrouped();
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
        // Add or update in deliveries
        this.deliveries.update(d => [delivery, ...d.filter(item => item.studentId !== delivery.studentId)]);
        this.notification.success(`✅ ${delivery.studentName} entregado en puerta`);
      }),
      catchError((err) => {
        this.dispatchingAlertId.set(null);
        this.notification.error('Error al registrar la entrega. Intente nuevamente.');
        return of(null);
      })
    ).subscribe();
  }

  /**
   * revertDelivery — Maestro/Admin deshace una entrega errónea.
   * El alumno regresa al board activo en estado EN_FILA.
   */
  revertDelivery(deliveryId: string, studentName: string): void {
    this.revertingDeliveryId.set(deliveryId);

    this.http.post<DeliveryRecord>(`${this.apiUrl}/deliveries/${deliveryId}/revert`, {}).pipe(
      tap((reverted) => {
        this.revertingDeliveryId.set(null);
        // Quitar de la lista de entregados
        this.deliveries.update(list =>
          list.filter(d => d.id !== deliveryId)
        );
        // El alumno volverá al board por WebSocket (/topic/delivery/reverted o /topic/school/alerts)
        this.notification.success(`🔄 Entrega de ${studentName} revertida. El alumno regresó al board.`);
      }),
      catchError(() => {
        this.revertingDeliveryId.set(null);
        this.notification.error('Error al revertir la entrega. Intente nuevamente.');
        return of(null);
      })
    ).subscribe();
  }

  // ─── Private: HTTP Load (Grouped — one alert per student) ────────────────
  private loadTodayAlertsGrouped(): void {
    forkJoin({
      alerts: this.http.get<AlertResponse[]>(`${this.apiUrl}/alerts/today/grouped`).pipe(catchError(() => of([]))),
      deliveries: this.http.get<DeliveryRecord[]>(`${this.apiUrl}/deliveries/today`).pipe(catchError(() => of([])))
    }).pipe(
      tap(({ alerts, deliveries }) => {
        this.deliveries.set(deliveries);
        const deliveredStudentIds = new Set(deliveries.map(d => d.studentId));

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
          isDispatched: deliveredStudentIds.has(a.studentId),
          isUpdated: false,
          isRejectedByParent: false
        }));
        this.alerts.set(monitorAlerts);
      })
    ).subscribe();
  }

  private loadTodayDeliveries(): void {
    this.http.get<DeliveryRecord[]>(`${this.apiUrl}/deliveries/today`).pipe(
      tap((deliveries) => this.deliveries.set(deliveries)),
      catchError(() => { this.deliveries.set([]); return of([]); })
    ).subscribe();
  }

  private subscribeToWebSocket(): void {
    // 1. Listen for new parent proximity alerts
    this.ws.onParentAlert().subscribe(event => {
      console.info('[MonitorService] 🔔 Evaluando alerta en monitor:', event);
      const currentUser = this.auth.currentUser();

      // STRICT TEACHER GROUP FILTERING:
      if (currentUser && currentUser.role === 'TEACHER') {
        const teacherGroups: string[] = currentUser.groups || [];
        const eventGroup = (event.groupName || '').trim().toLowerCase();
        const eventLevelGroup = `${event.level}-${event.groupName}`.trim().toLowerCase();

        const matchesGroup = teacherGroups.length === 0 || teacherGroups.some(g => {
          const gNorm = g.trim().toLowerCase();
          return (
            gNorm === eventGroup ||
            gNorm === eventLevelGroup ||
            gNorm.endsWith(`-${eventGroup}`) ||
            gNorm.includes(eventGroup)
          );
        }) || (currentUser.level && currentUser.level.toUpperCase() === event.level.toUpperCase());

        if (!matchesGroup) {
          console.info('[MonitorService] ⏭️ Alerta ignorada (no pertenece a los grupos de este maestro).');
          return;
        }
      }

      // Dedup by studentId: if a card for this student already exists, UPDATE it
      const existingIndex = this.alerts().findIndex(a => a.studentId === event.studentId && !a.isDispatched);

      if (existingIndex !== -1) {
        this.alerts.update(alerts =>
          alerts.map((a, i) => {
            if (i === existingIndex) {
              return {
                ...a,
                id: event.id,
                status: event.status,
                pickupMethod: event.pickupMethod,
                sentAt: event.sentAt,
                parentName: event.parentName,
                level: event.level,
                groupName: event.groupName,
                isUpdated: true
              };
            }
            return a;
          })
        );

        setTimeout(() => {
          this.alerts.update(alerts =>
            alerts.map(a => a.studentId === event.studentId ? { ...a, isUpdated: false } : a)
          );
        }, 2000);

        if (event.status === 'URGENTE') {
          this.sound.playUrgentSound();
          this.notification.warning(`🚨 ${event.studentName} — URGENTE`);
        } else {
          this.sound.playAlertSound();
          const statusLabel: Record<string, string> = { TEN_MIN: '10 MIN', FIVE_MIN: '5 MIN', EN_FILA: 'EN FILA' };
          this.notification.info(`📍 ${event.studentName} — ${statusLabel[event.status] || event.status}`);
        }
      } else {
        const newAlert: MonitorAlert = {
          id: event.id,
          parentId: event.parentId,
          parentName: event.parentName,
          studentId: event.studentId,
          studentName: event.studentName,
          level: event.level,
          groupName: event.groupName,
          status: event.status,
          pickupMethod: event.pickupMethod,
          sentAt: event.sentAt,
          isDispatched: false,
          isUpdated: true,
          isRejectedByParent: false
        };
        this.alerts.update(alerts => [newAlert, ...alerts]);

        setTimeout(() => {
          this.alerts.update(alerts =>
            alerts.map(a => a.studentId === event.studentId ? { ...a, isUpdated: false } : a)
          );
        }, 2000);

        if (event.status === 'URGENTE') {
          this.sound.playUrgentSound();
          this.notification.warning(`🚨 NUEVA: ${event.studentName} — URGENTE`);
        } else {
          this.sound.playAlertSound();
          const statusLabel: Record<string, string> = { TEN_MIN: '10 MIN', FIVE_MIN: '5 MIN', EN_FILA: 'EN FILA' };
          this.notification.info(`📍 NUEVA: ${event.studentName} — ${statusLabel[event.status] || event.status}`);
        }
      }
    });

    // 2. Listen for delivery status updates (dispatch, confirm, reject, revert)
    this.ws.onDeliveryEvent().subscribe(delivery => {
      console.info('[MonitorService] 📦 Evento de entrega recibido por WebSocket:', delivery);

      if (delivery.status === 'REVERTIDO_DOCENTE') {
        // Quitar de la lista de entregados si fue revertido
        this.deliveries.update(list => list.filter(d => d.id !== delivery.id));
        return;
      }

      // Actualizar el flag isDispatched en el alert correspondiente
      this.alerts.update(alerts =>
        alerts.map(a => (a.studentId === delivery.studentId || a.id === delivery.id) ? { ...a, isDispatched: true } : a)
      );

      this.deliveries.update(list => {
        const idx = list.findIndex(d => d.studentId === delivery.studentId || d.id === delivery.id);
        if (idx !== -1) {
          return list.map((item, i) => i === idx ? { ...item, ...delivery } : item);
        } else {
          return [{
            id: delivery.id,
            studentId: delivery.studentId,
            studentName: delivery.studentName,
            level: delivery.level,
            groupName: delivery.groupName,
            teacherName: delivery.teacherName,
            pickupMethod: delivery.pickupMethod || 'CAR',
            status: delivery.status,
            teacherConfirmedAt: delivery.teacherConfirmedAt || new Date().toISOString(),
            parentConfirmedAt: delivery.parentConfirmedAt,
            parentRejectedAt: delivery.parentRejectedAt,
            revertedAt: delivery.revertedAt,
            revertedBy: delivery.revertedBy,
            logDate: delivery.logDate
          }, ...list];
        }
      });
    });

    // 3. Listen for delivery REJECTED by parent → alumno vuelve al board con badge 🚨
    this.ws.onDeliveryRejected().subscribe(delivery => {
      console.info('[MonitorService] 🚨 Entrega rechazada por padre:', delivery);
      this.sound.playUrgentSound();
      this.notification.warning(`🚨 ¡ATENCIÓN! El padre de ${delivery.studentName} reporta NO haber recibido al alumno.`);

      // Devolver la card al board con isDispatched=false e isRejectedByParent=true
      this.alerts.update(alerts => {
        const existingIdx = alerts.findIndex(a => a.studentId === delivery.studentId);
        if (existingIdx !== -1) {
          return alerts.map((a, i) => i === existingIdx
            ? { ...a, isDispatched: false, isUpdated: true, isRejectedByParent: true, status: 'URGENTE' }
            : a
          );
        }
        return alerts;
      });

      // Quitar de la lista de "Entregados Hoy"
      this.deliveries.update(list => list.filter(d => d.id !== delivery.id));
    });

    // 4. Listen for delivery REVERTED by teacher/admin → alumno regresa al board
    this.ws.onDeliveryReverted().subscribe(delivery => {
      console.info('[MonitorService] 🔄 Entrega revertida por docente:', delivery);

      // Devolver la card al board con isDispatched=false
      this.alerts.update(alerts => {
        const existingIdx = alerts.findIndex(a => a.studentId === delivery.studentId);
        if (existingIdx !== -1) {
          return alerts.map((a, i) => i === existingIdx
            ? { ...a, isDispatched: false, isUpdated: true, isRejectedByParent: false, status: 'EN_FILA' }
            : a
          );
        }
        return alerts;
      });

      // Quitar de entregados
      this.deliveries.update(list => list.filter(d => d.id !== delivery.id));
    });
  }
}
