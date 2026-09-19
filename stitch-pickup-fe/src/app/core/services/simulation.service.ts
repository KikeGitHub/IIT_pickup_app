import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ConnectivityService, NetworkSimulationMode } from './connectivity.service';
import { MonitorService, MonitorAlert } from '../../features/monitor/services/monitor.service';
import { NotificationService } from './notification.service';
import { NotificationSoundService } from './notification-sound.service';
import { TeacherService, TeacherStudent } from './teacher.service';
import { environment } from '../../../environments/environment';

export interface SimulateAlertPayload {
  studentId?: string;
  studentName?: string;
  status: 'TEN_MIN' | 'FIVE_MIN' | 'EN_FILA' | 'URGENTE';
  pickupMethod: 'CAR' | 'WALK';
  minutesAgo: number;
}

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private readonly http = inject(HttpClient);
  private readonly connectivity = inject(ConnectivityService);
  private readonly monitorService = inject(MonitorService);
  private readonly notification = inject(NotificationService);
  private readonly sound = inject(NotificationSoundService);
  private readonly teacherService = inject(TeacherService);

  private readonly apiUrl = environment.apiUrl;

  // ─── State ─────────────────────────────────────────────────────────────────
  readonly isPanelOpen = signal<boolean>(false);
  readonly isSimulating = signal<boolean>(false);

  // Fallback demo students in case school roster is empty
  private readonly fallbackStudents: { id: string; name: string; grade: string; level: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA' }[] = [
    { id: 'sim-1', name: 'Mateo Morales García', grade: 'Primaria 3°-A', level: 'PRIMARIA' },
    { id: 'sim-2', name: 'Sofía Castillo Ramos', grade: 'Kinder 2°-B', level: 'KINDER' },
    { id: 'sim-3', name: 'Emiliano Torres Navarro', grade: 'Primaria 5°-B', level: 'PRIMARIA' },
    { id: 'sim-4', name: 'Valentina Mendoza López', grade: 'Secundaria 1°-A', level: 'SECUNDARIA' },
    { id: 'sim-5', name: 'Santiago Flores Cruz', grade: 'Primaria 1°-A', level: 'PRIMARIA' },
    { id: 'sim-6', name: 'Isabella Gómez Méndez', grade: 'Kinder 3°-A', level: 'KINDER' }
  ];

  openPanel(): void {
    this.isPanelOpen.set(true);
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
  }

  togglePanel(): void {
    this.isPanelOpen.update(v => !v);
  }

  get availableStudents(): { id: string; name: string; groupName: string; level: string }[] {
    const groups = this.teacherService.myGroups();
    const list: { id: string; name: string; groupName: string; level: string }[] = [];

    groups.forEach(g => {
      (g.students || []).forEach(s => {
        if (s.active !== false) {
          list.push({
            id: s.id,
            name: s.name,
            groupName: s.groupName || g.name,
            level: g.level || 'PRIMARIA'
          });
        }
      });
    });

    if (list.length > 0) {
      return list;
    }

    return this.fallbackStudents.map(s => ({
      id: s.id,
      name: s.name,
      groupName: s.grade,
      level: s.level
    }));
  }

  /**
   * Simula la llegada de un alumno.
   * Si está en línea, envía petición al backend (que persiste y emite por WebSocket).
   * Si está offline o falla la red, inyecta la alerta localmente en MonitorService.
   */
  simulateAlert(payload: SimulateAlertPayload): Observable<any> {
    this.isSimulating.set(true);

    const isOffline = this.connectivity.isOffline();

    if (isOffline) {
      this.injectLocalAlert(payload);
      this.isSimulating.set(false);
      this.notification.info(`📱 [Modo Offline] Alerta inyectada localmente para pruebas.`);
      return of({ simulatedLocal: true });
    }

    return this.http.post(`${this.apiUrl}/alerts/simulate`, payload).pipe(
      tap((response: any) => {
        this.isSimulating.set(false);
        this.notification.success(`🚀 Alerta emitida: ${response.studentName || 'Alumno'} (${payload.status})`);
      }),
      catchError(err => {
        console.warn('[SimulationService] Servidor no disponible, inyectando localmente:', err);
        this.injectLocalAlert(payload);
        this.isSimulating.set(false);
        this.notification.info(`📱 Alerta inyectada localmente (servidor no disponible).`);
        return of({ fallbackLocal: true });
      })
    );
  }

  /**
   * Simula una ráfaga de 3 alumnos con diferentes tiempos transcurridos:
   * 1. Uno crítico URGENTE (8 minutos atrás - tarjeta roja)
   * 2. Uno en fila (4 minutos atrás - tarjeta ámbar)
   * 3. Uno recién llegado (0 minutos atrás - tarjeta verde)
   * Permite comprobar al instante el ordenamiento vertical en móvil y el cambio de colores.
   */
  simulateBurst(): void {
    const students = this.availableStudents;
    const s1 = students[0] || this.fallbackStudents[0];
    const s2 = students[1] || this.fallbackStudents[1];
    const s3 = students[2] || this.fallbackStudents[2];

    const alerts: SimulateAlertPayload[] = [
      {
        studentId: s1.id.startsWith('sim-') ? undefined : s1.id,
        studentName: s1.name,
        status: 'URGENTE',
        pickupMethod: 'CAR',
        minutesAgo: 8
      },
      {
        studentId: s2.id.startsWith('sim-') ? undefined : s2.id,
        studentName: s2.name,
        status: 'EN_FILA',
        pickupMethod: 'CAR',
        minutesAgo: 4
      },
      {
        studentId: s3.id.startsWith('sim-') ? undefined : s3.id,
        studentName: s3.name,
        status: 'FIVE_MIN',
        pickupMethod: 'WALK',
        minutesAgo: 0
      }
    ];

    this.isSimulating.set(true);

    if (this.connectivity.isOffline()) {
      alerts.forEach(a => this.injectLocalAlert(a));
      this.isSimulating.set(false);
      this.notification.success(`⚡ Ráfaga de 3 alumnos simulada localmente (Modo Offline)`);
      return;
    }

    forkJoin(alerts.map(a => this.http.post(`${this.apiUrl}/alerts/simulate`, a).pipe(catchError(() => of(null)))))
      .subscribe({
        next: (results) => {
          this.isSimulating.set(false);
          const failed = results.filter(r => r === null).length;
          if (failed > 0) {
            alerts.forEach(a => this.injectLocalAlert(a));
            this.notification.info(`⚡ Ráfaga completada con respaldo local.`);
          } else {
            this.notification.success(`⚡ Ráfaga de 3 alumnos enviada en tiempo real.`);
          }
        },
        error: () => {
          alerts.forEach(a => this.injectLocalAlert(a));
          this.isSimulating.set(false);
          this.notification.info(`⚡ Ráfaga simulada localmente.`);
        }
      });
  }

  private injectLocalAlert(payload: SimulateAlertPayload): void {
    const all = this.availableStudents;
    let chosen = all.find(s => s.id === payload.studentId);
    if (!chosen) {
      chosen = all[Math.floor(Math.random() * all.length)] || this.fallbackStudents[0];
    }

    const sentAt = new Date(Date.now() - (payload.minutesAgo * 60 * 1000)).toISOString();
    const fakeAlertId = 'sim-alert-' + Math.random().toString(36).substring(2, 9);

    const monitorAlert: MonitorAlert = {
      id: fakeAlertId,
      parentId: 'sim-parent-1',
      parentName: 'Tutor Simulación',
      studentId: chosen.id,
      studentName: payload.studentName || chosen.name,
      level: (chosen.level as any) || 'PRIMARIA',
      groupName: chosen.groupName || 'Primaria 3°-A',
      status: payload.status,
      pickupMethod: payload.pickupMethod,
      sentAt: sentAt,
      isDispatched: false,
      isUpdated: true,
      isRejectedByParent: false
    };

    // Agregar o actualizar en MonitorService
    this.monitorService.alerts.update(alerts => {
      const existingIdx = alerts.findIndex(a => a.studentId === chosen!.id && !a.isDispatched);
      if (existingIdx !== -1) {
        return alerts.map((a, idx) => idx === existingIdx ? { ...a, ...monitorAlert } : a);
      }
      return [monitorAlert, ...alerts];
    });

    if (payload.status === 'URGENTE') {
      this.sound.playUrgentSound();
    } else {
      this.sound.playAlertSound();
    }
  }

  setNetworkMode(mode: NetworkSimulationMode): void {
    this.connectivity.setSimulationMode(mode);
  }
}
