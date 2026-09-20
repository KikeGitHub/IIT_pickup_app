import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { AlertResponse, AlertStatus, CreateAlertDto, PickupMethod, StudentAlertStatus } from '../models/alert.model';
import { ConnectivityService } from './connectivity.service';
import { OfflineQueueService } from './offline-queue.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private readonly http = inject(HttpClient);
  private readonly connectivity = inject(ConnectivityService);
  private readonly offlineQueue = inject(OfflineQueueService);
  private readonly notification = inject(NotificationService);

  private readonly apiUrl = `${environment.apiUrl}/alerts`;

  // Reactive state map: studentId -> StudentAlertStatus
  readonly alertStatuses = signal<Record<string, StudentAlertStatus>>({});

  constructor() {
    // BLINDAJE 2: Cuando la cola offline envía exitosamente una alerta al servidor,
    // actualizar automáticamente el estado visual del alumno a 'CONFIRMED'.
    this.offlineQueue.queueItemProcessed$.subscribe((body) => {
      const studentId = body['studentId'] as string | undefined;
      const status = body['status'] as AlertStatus | undefined;
      const pickupMethod = body['pickupMethod'] as PickupMethod | undefined;

      if (studentId && status) {
        this.updateStatus(studentId, {
          studentId,
          lastStatus: status,
          pickupMethod: pickupMethod || 'CAR',
          state: 'CONFIRMED',
          updatedAt: new Date().toISOString()
        });

        const statusLabels: Record<string, string> = {
          TEN_MIN: '10 Minutos', FIVE_MIN: '5 Minutos',
          EN_FILA: 'En Fila', URGENTE: 'Urgente'
        };
        this.notification.success(
          `✅ Alerta "${statusLabels[status] || status}" enviada exitosamente tras recuperar señal.`
        );
      }
    });
  }

  sendAlert(studentId: string, status: AlertStatus, pickupMethod: PickupMethod): void {
    const clientId = crypto.randomUUID();
    const payload: CreateAlertDto = {
      studentId,
      status,
      pickupMethod,
      clientId
    };

    // Update state to SENDING
    this.updateStatus(studentId, {
      studentId,
      lastStatus: status,
      pickupMethod,
      state: 'SENDING',
      updatedAt: new Date().toISOString()
    });

    const httpReq = new HttpRequest('POST', this.apiUrl, payload);

    if (!this.connectivity.isOnline()) {
      // Offline -> Queue in IndexedDB (ADR-002)
      this.offlineQueue.enqueueRequest(httpReq);

      this.updateStatus(studentId, {
        studentId,
        lastStatus: status,
        pickupMethod,
        state: 'QUEUED',
        updatedAt: new Date().toISOString()
      });

      this.notification.warning('📡 Sin señal. Tu aviso fue guardado localmente y se enviará automáticamente en cuanto recuperes conexión.');
      return;
    }

    // Online -> POST to backend
    this.http.post<AlertResponse>(this.apiUrl, payload).pipe(
      tap((res) => {
        this.updateStatus(studentId, {
          studentId,
          lastStatus: res.status,
          pickupMethod: res.pickupMethod,
          state: 'CONFIRMED',
          updatedAt: new Date().toISOString()
        });

        const statusLabels: Record<AlertStatus, string> = {
          TEN_MIN: '10 Minutos',
          FIVE_MIN: '5 Minutos',
          EN_FILA: 'En Fila',
          URGENTE: 'Urgente'
        };
        this.notification.success(`¡Alerta "${statusLabels[status]}" registrada! El monitor escolar ha sido notificado.`);
      }),
      catchError((err) => {
        // HTTP Error (network drop during call) -> Enqueue offline
        this.offlineQueue.enqueueRequest(httpReq);

        this.updateStatus(studentId, {
          studentId,
          lastStatus: status,
          pickupMethod,
          state: 'QUEUED',
          updatedAt: new Date().toISOString()
        });

        this.notification.warning('📡 Sin señal o fallo de red. Tu aviso fue guardado en tu teléfono y se enviará automáticamente al reconectarse.');
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Consulta el backend para recuperar la última alerta emitida hoy para el alumno.
   * Esto asegura que al recargar la página o cambiar de hijo, el estado se recupere directamente de la BD.
   */
  loadLatestAlertForStudent(studentId: string): Observable<AlertResponse | null> {
    return this.http.get<AlertResponse>(`${this.apiUrl}/student/${studentId}/latest`).pipe(
      tap((res) => {
        if (res && res.status) {
          this.updateStatus(studentId, {
            studentId,
            lastStatus: res.status,
            pickupMethod: res.pickupMethod,
            state: 'CONFIRMED',
            updatedAt: res.sentAt
          });
        }
      }),
      catchError(() => of(null))
    );
  }

  getStudentStatus(studentId: string): StudentAlertStatus {
    return this.alertStatuses()[studentId] || {
      studentId,
      pickupMethod: 'CAR',
      state: 'IDLE',
      updatedAt: new Date().toISOString()
    };
  }

  setPickupMethod(studentId: string, method: PickupMethod): void {
    const current = this.getStudentStatus(studentId);
    this.updateStatus(studentId, {
      ...current,
      pickupMethod: method
    });
  }

  updateStudentStatusFromEvent(studentId: string, status: AlertStatus, pickupMethod?: PickupMethod): void {
    const current = this.getStudentStatus(studentId);
    this.updateStatus(studentId, {
      ...current,
      studentId,
      lastStatus: status,
      pickupMethod: pickupMethod || current.pickupMethod,
      state: 'CONFIRMED',
      updatedAt: new Date().toISOString()
    });
  }

  private updateStatus(studentId: string, newStatus: StudentAlertStatus): void {
    this.alertStatuses.update(prev => ({
      ...prev,
      [studentId]: newStatus
    }));
  }
}
