import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ConnectivityService, NetworkSimulationMode } from './connectivity.service';
import { MonitorService, MonitorAlert } from '../../features/monitor/services/monitor.service';
import { NotificationService } from './notification.service';
import { NotificationSoundService } from './notification-sound.service';
import { TeacherService } from './teacher.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface SimulateAlertPayload {
  studentId?: string;
  studentName?: string;
  status: 'TEN_MIN' | 'FIVE_MIN' | 'EN_FILA' | 'URGENTE';
  pickupMethod: 'CAR' | 'WALK';
  minutesAgo: number;
}

const SIM_MEXICAN_NAMES = [
  'Santiago Morales García', 'Mateo Castillo Ramos', 'Sebastián Torres Navarro',
  'Leonardo Mendoza López', 'Matías Flores Cruz', 'Emiliano Gómez Méndez',
  'Diego Ramírez Silva', 'Daniel Hernández Ortiz', 'Alexander Vargas Peña',
  'Sofía Castro Delgado', 'Valentina Rojas Benítez', 'Isabella Guerrero Soto',
  'Camila Estrada Aguilar', 'Valeria Benítez Ruiz', 'Mariana Pacheco Díaz',
  'Luciana Cruz Morales', 'Regina Flores Reyes', 'Renata Romero Jiménez',
  'Victoria Soto Vázquez', 'Natalia Delgado Moreno', 'Alejandro Benítez León',
  'Joaquín Navarro Ruiz', 'Nicolás Méndez Ramos', 'Samuel Luna Castillo',
  'Gabriel Medina Torres', 'Gael Campos Hernández', 'Ángel Paredes Ortiz',
  'Ximena Ríos Salazar', 'Fernanda Cabrera Soto', 'Andrea Santana Morales',
  'Daniela Velasco Cruz', 'Elena Cárdenas Silva', 'Clara Orozco Gómez',
  'Mauricio Corona Ruiz', 'Rodrigo Figueroa Peña', 'Julieta Galindo Díaz',
  'Paula Lara Mendoza', 'Felipe Aguirre Ramos', 'Manuel Cordero Flores',
  'Bruno Valenzuela Ortiz', 'Esteban Santillán Cruz', 'Pablo Barajas Reyes',
  'Alonso Zúñiga Delgado', 'Emilio Rangel Castro', 'Iker Corona Silva',
  'Maximiliano Duarte Ortiz', 'Damián Meza Morales', 'Adrián Becerra Soto',
  'Iván Trejo Navarro', 'Gael Salgado Mendoza', 'Romina Espinosa Cruz',
  'Jimena Saucedo Ramos', 'Renata Villegas Flores', 'Aranza Montes Peña',
  'Paulina Zamora Díaz', 'Miranda Beltrán Ruiz', 'Elisa Cervantes Ortiz',
  'Fabiola Villalobos Castro', 'Lorena Godínez Morales', 'Cecilia Ibarra Reyes'
];

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
  private readonly auth = inject(AuthService);

  private readonly apiUrl = environment.apiUrl;
  private simCounter = 0;

  // ─── State ─────────────────────────────────────────────────────────────────
  readonly isPanelOpen = signal<boolean>(false);
  readonly isSimulating = signal<boolean>(false);

  // Fallback demo students in case school roster is empty
  private readonly fallbackStudents: { id: string; name: string; grade: string; level: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA' }[] = [
    { id: 'sim-1', name: 'Mateo Morales García', grade: 'Primaria 3°-A', level: 'PRIMARIA' },
    { id: 'sim-2', name: 'Sofía Castillo Ramos', grade: 'Primaria 3°-A', level: 'PRIMARIA' },
    { id: 'sim-3', name: 'Emiliano Torres Navarro', grade: 'Primaria 3°-A', level: 'PRIMARIA' },
    { id: 'sim-4', name: 'Valentina Mendoza López', grade: 'Primaria 3°-A', level: 'PRIMARIA' },
    { id: 'sim-5', name: 'Santiago Flores Cruz', grade: 'Primaria 3°-A', level: 'PRIMARIA' },
    { id: 'sim-6', name: 'Isabella Gómez Méndez', grade: 'Primaria 3°-A', level: 'PRIMARIA' }
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

  /**
   * Retorna los alumnos disponibles del maestro o del colegio.
   */
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

    const currentTeacherGroup = this.teacherGroupInfo;
    return this.fallbackStudents.map(s => ({
      id: s.id,
      name: s.name,
      groupName: currentTeacherGroup.groupName,
      level: currentTeacherGroup.level
    }));
  }

  private get teacherGroupInfo(): { groupName: string; level: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA' } {
    const groups = this.teacherService.myGroups();
    const currentUser = this.auth.currentUser();
    const groupName = groups[0]?.name || currentUser?.groups?.[0] || 'Primaria 3°-A';
    const level = (groups[0]?.level as any) || (currentUser?.level as any) || 'PRIMARIA';
    return { groupName, level };
  }

  /**
   * Simula la llegada de un alumno individual.
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
   * Compatibilidad hacia atrás: simula ráfaga rápida de 5 alumnos.
   */
  simulateBurst(): void {
    this.simulateBatch(5);
  }

  /**
   * Simula un lote masivo de alumnos (5, 10, 25, 50, 100 sin límite).
   * Genera tarjetas con prioridades escalonadas (Urgente, En Fila, 5 min) y cronómetros reales.
   */
  simulateBatch(count: number = 5): void {
    const safeCount = Math.max(1, Math.min(count, 100));
    this.isSimulating.set(true);

    if (this.connectivity.isOffline()) {
      this.injectLocalBatch(safeCount);
      this.isSimulating.set(false);
      this.notification.success(`⚡ ${safeCount} alumnos simulados localmente (Modo Offline). Total en espera: ${this.monitorService.totalActive()}`);
      return;
    }

    this.http.post<any[]>(`${this.apiUrl}/alerts/simulate/batch?count=${safeCount}`, {}).pipe(
      tap((responses) => {
        this.isSimulating.set(false);

        // Integración reactiva inmediata en MonitorService
        if (Array.isArray(responses) && responses.length > 0) {
          const deliveredIds = new Set(this.monitorService.deliveries().map(d => d.studentId));
          this.monitorService.alerts.update(existing => {
            const existingIds = new Set(existing.map(a => a.studentId));
            const newAlerts: MonitorAlert[] = responses
              .filter(r => !existingIds.has(r.studentId))
              .map(r => ({
                id: r.id,
                parentId: r.parentId,
                parentName: r.parentName,
                studentId: r.studentId,
                studentName: r.studentName,
                level: r.level as any,
                groupName: r.groupName,
                status: r.status as any,
                pickupMethod: r.pickupMethod as any,
                sentAt: r.sentAt,
                isDispatched: deliveredIds.has(r.studentId),
                isUpdated: true,
                isRejectedByParent: false
              }));
            return [...newAlerts, ...existing];
          });
        }

        this.sound.playAlertSound();
        this.notification.success(`🚀 Se simularon +${safeCount} alumnos con éxito. Total en espera: ${this.monitorService.totalActive()}`);
      }),
      catchError(err => {
        console.warn('[SimulationService] Batch vía servidor falló, inyectando localmente:', err);
        this.injectLocalBatch(safeCount);
        this.isSimulating.set(false);
        this.notification.info(`⚡ ${safeCount} alumnos simulados con respaldo local. Total en espera: ${this.monitorService.totalActive()}`);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Inyecta masivamente N alumnos simulados directamente en MonitorService con IDs y nombres únicos.
   * Sin colisiones, asignados al grupo del docente para pasar todos los filtros.
   */
  injectLocalBatch(count: number): void {
    const { groupName, level } = this.teacherGroupInfo;
    const now = Date.now();
    const newAlerts: MonitorAlert[] = [];

    for (let i = 0; i < count; i++) {
      this.simCounter++;
      const uniqueId = `sim-batch-${now}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const studentName = SIM_MEXICAN_NAMES[(this.simCounter) % SIM_MEXICAN_NAMES.length];

      // Distribución realista de tiempos y prioridades
      const mod = i % 10;
      let status: MonitorAlert['status'];
      let minutesAgo: number;

      if (mod < 2) {
        status = 'URGENTE';
        minutesAgo = 8 + (i % 6);
      } else if (mod < 6) {
        status = 'EN_FILA';
        minutesAgo = 3 + (i % 4);
      } else if (mod < 8) {
        status = 'FIVE_MIN';
        minutesAgo = 1 + (i % 2);
      } else {
        status = 'TEN_MIN';
        minutesAgo = 0;
      }

      const sentAt = new Date(now - (minutesAgo * 60 * 1000)).toISOString();

      newAlerts.push({
        id: `alert-${uniqueId}`,
        parentId: `parent-${uniqueId}`,
        parentName: `Tutor ${studentName.split(' ')[0]}`,
        studentId: uniqueId,
        studentName: studentName,
        level: level,
        groupName: groupName,
        status: status,
        pickupMethod: (i % 2 === 0) ? 'CAR' : 'WALK',
        sentAt: sentAt,
        isDispatched: false,
        isUpdated: true,
        isRejectedByParent: false
      });
    }

    // Agregar todas las tarjetas nuevas al monitor
    this.monitorService.alerts.update(existing => [...newAlerts, ...existing]);
    this.sound.playAlertSound();
  }

  /**
   * Inyecta una alerta individual en MonitorService.
   * Si no se pasó alumno específico o es RANDOM, crea un alumno único para que sume una tarjeta nueva.
   */
  private injectLocalAlert(payload: SimulateAlertPayload): void {
    const { groupName, level } = this.teacherGroupInfo;
    const all = this.availableStudents;

    let chosenStudentId = payload.studentId;
    let chosenStudentName = payload.studentName;

    // Si es aleatorio o no especificado, crear ID y nombre únicos para no sobreescribir tarjetas
    if (!chosenStudentId || chosenStudentId === 'RANDOM') {
      this.simCounter++;
      chosenStudentId = `sim-single-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      chosenStudentName = chosenStudentName || SIM_MEXICAN_NAMES[this.simCounter % SIM_MEXICAN_NAMES.length];
    } else {
      const match = all.find(s => s.id === chosenStudentId);
      if (match) {
        chosenStudentName = match.name;
      }
    }

    const sentAt = new Date(Date.now() - (payload.minutesAgo * 60 * 1000)).toISOString();
    const fakeAlertId = 'sim-alert-' + Math.random().toString(36).substring(2, 9);

    const monitorAlert: MonitorAlert = {
      id: fakeAlertId,
      parentId: 'sim-parent-1',
      parentName: 'Tutor Simulación',
      studentId: chosenStudentId,
      studentName: chosenStudentName || 'Alumno Simulado',
      level: level,
      groupName: groupName,
      status: payload.status,
      pickupMethod: payload.pickupMethod,
      sentAt: sentAt,
      isDispatched: false,
      isUpdated: true,
      isRejectedByParent: false
    };

    // Si el ID existe exactamente, actualiza; si no, inserta al principio
    this.monitorService.alerts.update(alerts => {
      const existingIdx = alerts.findIndex(a => a.studentId === chosenStudentId && !a.isDispatched);
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
