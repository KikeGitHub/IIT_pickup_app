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

      this.notification.warning('Sin conexión. Alerta guardada localmente, se enviará automáticamente al reconectarse.');
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

        this.notification.warning('Error de red. Alerta guardada en cola offline.');
        return of(null);
      })
    ).subscribe();
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

  private updateStatus(studentId: string, newStatus: StudentAlertStatus): void {
    this.alertStatuses.update(prev => ({
      ...prev,
      [studentId]: newStatus
    }));
  }
}
