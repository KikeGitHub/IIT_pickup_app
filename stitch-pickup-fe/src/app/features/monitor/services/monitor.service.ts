import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of, forkJoin, EMPTY } from 'rxjs';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationSoundService } from '../../../core/services/notification-sound.service';
import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
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
export type AlertStatusFilter = 'ALL' | 'URGENTE' | 'EN_FILA' | 'FIVE_MIN' | 'TEN_MIN';

@Injectable({
  providedIn: 'root'
})
export class MonitorService {
  private readonly http = inject(HttpClient);
  private readonly ws = inject(WebSocketService);
  private readonly notification = inject(NotificationService);
  private readonly sound = inject(NotificationSoundService);
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);

  private readonly apiUrl = environment.apiUrl;

  private pollInterval?: any;
  private clockInterval?: any;
  private visibilityHandler?: () => void;

  // ─── Reactive State ───────────────────────────────────────────────────────
  readonly now = signal<number>(Date.now());
  readonly alerts = signal<MonitorAlert[]>([]);
  readonly deliveries = signal<DeliveryRecord[]>([]);
  readonly selectedLevel = signal<LevelFilter>('ALL');
  readonly selectedStatus = signal<AlertStatusFilter>('ALL');
  readonly isRefreshing = signal<boolean>(false);
  /** Indica que la última sincronización de fondo falló (red caída/timeout). */
  readonly syncError = signal<boolean>(false);
  readonly dispatchingAlertId = signal<string | null>(null);
  readonly revertingDeliveryId = signal<string | null>(null);

  // ─── Computed KPIs ────────────────────────────────────────────────────────
  readonly urgentCount = computed(() =>
    this.alerts().filter(a => a.status === 'URGENTE' && !a.isDispatched).length
  );
  readonly enFilaCount = computed(() =>
    this.alerts().filter(a => a.status === 'EN_FILA' && !a.isDispatched).length
  );
  readonly fiveMinCount = computed(() =>
    this.alerts().filter(a => a.status === 'FIVE_MIN' && !a.isDispatched).length
  );
  readonly tenMinCount = computed(() =>
    this.alerts().filter(a => a.status === 'TEN_MIN' && !a.isDispatched).length
  );
  readonly dispatchedCount = computed(() =>
    this.deliveries().filter(d => d.status !== 'REVERTIDO_DOCENTE').length
  );
  readonly totalActive = computed(() =>
    this.alerts().filter(a => !a.isDispatched).length
  );

  // ─── Filtered & Strictly Prioritized Alerts ──────────────────────────────
  readonly filteredAlerts = computed(() => {
    const level = this.selectedLevel();
    let list = this.alerts().filter(a => !a.isDispatched);

    if (level !== 'ALL') {
      list = list.filter(a => a.level === level);
    }

    // Prioridades estrictas: URGENTE (4) > EN_FILA (3) > FIVE_MIN (2) > TEN_MIN (1)
    const priorityWeight: Record<string, number> = {
      URGENTE: 4,
      EN_FILA: 3,
      FIVE_MIN: 2,
      TEN_MIN: 1
    };

    return [...list].sort((a, b) => {
      const weightA = priorityWeight[a.status] || 0;
      const weightB = priorityWeight[b.status] || 0;

      // 1. Mayor urgencia primero
      if (weightB !== weightA) {
        return weightB - weightA;
      }

      // 2. A igual urgencia: orden FIFO (el que lleva más tiempo en espera primero)
      const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
      const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
      return timeA - timeB;
    });
  });

  // ─── Initialization ──────────────────────────────────────────────────────
  initialize(): void {
    this.loadTodayAlertsGrouped();
    this.loadTodayDeliveries();
    this.subscribeToWebSocket();
    this.setupResilienceSync();
  }

  // ─── Filters & Refresh ────────────────────────────────────────────────────
  setLevelFilter(level: LevelFilter): void {
    this.selectedLevel.set(level);
  }

  setStatusFilter(status: AlertStatusFilter): void {
    this.selectedStatus.set(status);
  }

  refresh(): void {
    this.isRefreshing.set(true);
    forkJoin({
      alerts: this.http.get<AlertResponse[]>(`${this.apiUrl}/alerts/today/grouped`).pipe(catchError(() => of(null as AlertResponse[] | null))),
      deliveries: this.http.get<DeliveryRecord[]>(`${this.apiUrl}/deliveries/today`).pipe(catchError(() => of(null as DeliveryRecord[] | null)))
    }).pipe(
      tap(({ alerts, deliveries }) => {
        this.isRefreshing.set(false);

        // BLINDAJE 1: Si alguna petición falló (null sentinel), conservar las cards actuales.
        if (alerts === null || deliveries === null) {
          this.syncError.set(true);
          console.warn('[MonitorService] ⚠️ Refresh parcial: error de red detectado. Cards conservadas.');
          return;
        }

        this.syncError.set(false);
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
      }),
      catchError(() => {
        this.isRefreshing.set(false);
        this.syncError.set(true);
        return of(null);
      })
    ).subscribe();
  }

  private setupResilienceSync(): void {
    // Reloj reactivo de 1s para cronómetros de tarjetas
    if (!this.clockInterval && typeof setInterval !== 'undefined') {
      this.clockInterval = setInterval(() => {
        this.now.set(Date.now());
      }, 1000);
    }

    // 1. Resincronizar cuando el WebSocket reconecte
    this.ws.isConnected$.subscribe(connected => {
      if (connected) {
        console.info('[MonitorService] 🔄 WebSocket reconectado, sincronizando alertas...');
        this.loadTodayAlertsGrouped();
      }
    });

    // 2. Detección de reactivación de pantalla / cambio de app en móviles
    if (typeof document !== 'undefined' && !this.visibilityHandler) {
      this.visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          console.info('[MonitorService] 📱 Pantalla visible / desbloqueada, reconectando y sincronizando alertas...');
          this.ws.ensureConnected();
          this.loadTodayAlertsGrouped();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
      window.addEventListener('focus', this.visibilityHandler);
      window.addEventListener('online', () => {
        this.ws.ensureConnected();
        this.loadTodayAlertsGrouped();
      });
    }

    // 3. Polling de respaldo cada 8 segundos para tolerar microcortes de 4G/WiFi en patio
    if (!this.pollInterval && typeof setInterval !== 'undefined') {
      this.pollInterval = setInterval(() => {
        this.loadTodayAlertsGrouped();
      }, 8000);
    }
  }

  destroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = undefined;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      window.removeEventListener('focus', this.visibilityHandler);
      this.visibilityHandler = undefined;
    }
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
   * Despachar masivamente todas las alertas activas pendientes de hoy.
   * Ideal para cuando finaliza la jornada escolar y el docente/admin desea limpiar el monitor.
   */
  dispatchAllActive(): void {
    const active = this.alerts().filter(a => !a.isDispatched);
    if (active.length === 0) return;

    active.forEach(alert => {
      this.http.post<DeliveryRecord>(`${this.apiUrl}/deliveries/${alert.id}/dispatch`, {}).pipe(
        catchError(() => of(null))
      ).subscribe(delivery => {
        if (delivery) {
          this.alerts.update(alerts =>
            alerts.map(a => a.id === alert.id ? { ...a, isDispatched: true } : a)
          );
          this.deliveries.update(d => [delivery, ...d.filter(item => item.studentId !== delivery.studentId)]);
        }
      });
    });
    this.notification.success(`✅ Se registraron como entregados los ${active.length} alumnos pendientes.`);
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
      alerts: this.http.get<AlertResponse[]>(`${this.apiUrl}/alerts/today/grouped`).pipe(catchError(() => of(null as AlertResponse[] | null))),
      deliveries: this.http.get<DeliveryRecord[]>(`${this.apiUrl}/deliveries/today`).pipe(catchError(() => of(null as DeliveryRecord[] | null)))
    }).pipe(
      tap(({ alerts, deliveries }) => {
        // BLINDAJE 1: Si alguna petición de red falló, NO sobrescribir las cards existentes.
        // Esto protege al monitor ante microcortes de WiFi o 4G en el patio escolar.
        if (alerts === null || deliveries === null) {
          this.syncError.set(true);
          console.warn('[MonitorService] ⚠️ Sync de fondo: error de red. Cards en pantalla conservadas.');
          return;
        }

        this.syncError.set(false);
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

      // STRICT TEACHER GROUP AND LEVEL FILTERING (Resiliente y Normalizado):
      if (currentUser && currentUser.role === 'TEACHER') {
        const teacherLevel = (currentUser.level || '').trim().toUpperCase();
        const eventLevel = (event.level || '').trim().toUpperCase();

        // 1. REGLA DE NIVEL: Si el docente tiene nivel asignado (ej. SECUNDARIA o PRIMARIA),
        // solo descarta si ambos tienen nivel definido y son claramente distintos.
        if (teacherLevel && eventLevel && teacherLevel !== eventLevel) {
          console.info(`[MonitorService] ⏭️ Alerta ignorada: nivel de la alerta '${eventLevel}' no coincide con el nivel del docente '${teacherLevel}'.`);
          return;
        }

        // 2. OBTENER SALONES ASIGNADOS: Desde currentUser.groups O teacherService.myGroups()
        const assignedFromToken: string[] = currentUser.groups || [];
        const assignedFromService: string[] = this.teacherService.myGroups().map(g => g.name);
        const allAssigned = Array.from(new Set([...assignedFromToken, ...assignedFromService]));

        if (allAssigned.length > 0) {
          const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
          const eventClean = clean(event.groupName || '');
          const eventLevelClean = clean(`${event.level || ''}${event.groupName || ''}`);

          const matchesGroup = allAssigned.some(g => {
            const gClean = clean(g);
            return (
              gClean === eventClean ||
              gClean === eventLevelClean ||
              gClean.endsWith(eventClean) ||
              eventClean.endsWith(gClean) ||
              gClean.includes(eventClean) ||
              eventClean.includes(gClean)
            );
          });

          if (!matchesGroup) {
            console.info(`[MonitorService] ⏭️ Alerta ignorada: grupo '${event.groupName}' no pertenece a los salones asignados del docente.`, allAssigned);
            return;
          }
        }
        // Si el docente no tiene grupos específicos asignados en el momento (ej. guardia de patio/apoyo general),
        // se acepta la alerta conforme al fallback global para que no quede a ciegas.
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

        const statusLabel: Record<string, string> = { TEN_MIN: '10 MIN', FIVE_MIN: '5 MIN', EN_FILA: 'EN FILA', URGENTE: 'URGENTE' };
        const label = statusLabel[event.status] || event.status;
        const methodStr = event.pickupMethod === 'CAR' ? 'En Auto' : 'A Pie';

        if (event.status === 'URGENTE') {
          this.sound.playUrgentSound();
          this.sound.notifyWithVibration(
            `🚨 URGENTE: ${event.studentName}`,
            `Grupo ${event.groupName} (${event.level}) • Requiere atención inmediata del personal`,
            'alert-' + event.studentId
          );
          this.notification.warning(`🚨 ${event.studentName} — URGENTE`);
        } else {
          this.sound.playAlertSound();
          this.sound.notifyWithVibration(
            `🚗 ${event.studentName} (${label})`,
            `Modalidad: ${methodStr} • Grupo: ${event.groupName}`,
            'alert-' + event.studentId
          );
          this.notification.info(`📍 ${event.studentName} — ${label}`);
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

        const statusLabel: Record<string, string> = { TEN_MIN: '10 MIN', FIVE_MIN: '5 MIN', EN_FILA: 'EN FILA', URGENTE: 'URGENTE' };
        const label = statusLabel[event.status] || event.status;
        const methodStr = event.pickupMethod === 'CAR' ? 'En Auto' : 'A Pie';

        if (event.status === 'URGENTE') {
          this.sound.playUrgentSound();
          this.sound.notifyWithVibration(
            `🚨 NUEVA ALERTA: ${event.studentName}`,
            `Grupo ${event.groupName} (${event.level}) • Alumno en espera`,
            'alert-' + event.studentId
          );
          this.notification.warning(`🚨 NUEVA: ${event.studentName} — URGENTE`);
        } else {
          this.sound.playAlertSound();
          this.sound.notifyWithVibration(
            `🚗 NUEVA: ${event.studentName} (${label})`,
            `Modalidad: ${methodStr} • Grupo: ${event.groupName}`,
            'alert-' + event.studentId
          );
          this.notification.info(`📍 NUEVA: ${event.studentName} — ${label}`);
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
        alerts.map(a => a.studentId === delivery.studentId ? { ...a, isDispatched: delivery.status === 'ENTREGADO_ESCUELA' || delivery.status === 'RECIBIDO_PADRE' } : a)
      );

      // Actualizar o agregar en la lista de entregados
      this.deliveries.update(list => {
        const idx = list.findIndex(d => d.id === delivery.id || d.studentId === delivery.studentId);
        const record: DeliveryRecord = {
          id: delivery.id,
          studentId: delivery.studentId,
          studentName: delivery.studentName,
          level: delivery.level,
          groupName: delivery.groupName,
          teacherName: delivery.teacherName,
          pickupMethod: delivery.pickupMethod ?? '',
          status: delivery.status,
          teacherConfirmedAt: delivery.teacherConfirmedAt || new Date().toISOString(),
          parentConfirmedAt: delivery.parentConfirmedAt,
          parentRejectedAt: delivery.parentRejectedAt,
          revertedAt: delivery.revertedAt,
          revertedBy: delivery.revertedBy,
          logDate: delivery.logDate || new Date().toISOString().substring(0, 10)
        };
        if (idx !== -1) {
          return list.map((item, i) => i === idx ? record : item);
        } else {
          return [record, ...list];
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
