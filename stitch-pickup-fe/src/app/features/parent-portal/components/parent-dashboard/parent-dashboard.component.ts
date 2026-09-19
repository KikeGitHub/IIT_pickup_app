import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { StudentService } from '../../../../core/services/student.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConnectivityService } from '../../../../core/services/connectivity.service';
import { WebSocketService, DeliveryDispatchedEvent } from '../../../../core/services/websocket.service';
import { NotificationSoundService } from '../../../../core/services/notification-sound.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ImageUploadService } from '../../../../core/services/image-upload.service';
import { AlertStatus, PickupMethod } from '../../../../core/models/alert.model';
import { Student } from '../../../../core/models/student.model';
import { environment } from '../../../../../environments/environment';
import { StudentCardComponent } from '../student-card/student-card.component';
import { PickupModeSelectorComponent } from '../pickup-mode-selector/pickup-mode-selector.component';
import { AlertButtonsComponent } from '../alert-buttons/alert-buttons.component';
import { AlertStatusCardComponent } from '../alert-status-card/alert-status-card.component';
import { DayHistoryComponent, HistoryEvent } from '../day-history/day-history.component';
import { PwaInstallBannerComponent } from '../../../../shared/components/pwa-install-banner/pwa-install-banner.component';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StudentCardComponent,
    PickupModeSelectorComponent,
    AlertButtonsComponent,
    AlertStatusCardComponent,
    DayHistoryComponent,
    PwaInstallBannerComponent
  ],
  templateUrl: './parent-dashboard.component.html',
  styleUrl: './parent-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentDashboardComponent implements OnInit, OnDestroy {
  readonly studentService = inject(StudentService);
  readonly alertService = inject(AlertService);
  readonly authService = inject(AuthService);
  readonly connectivity = inject(ConnectivityService);
  readonly ws = inject(WebSocketService);
  readonly sound = inject(NotificationSoundService);
  private readonly notification = inject(NotificationService);
  private readonly imageUpload = inject(ImageUploadService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly apiUrl = environment.apiUrl;
  readonly appVersion = environment.appVersion;
  private subscriptions = new Subscription();
  private visibilityHandler?: () => void;
  private pollInterval?: number;

  // Real-time daily history map per student
  readonly historyMap = signal<Record<string, HistoryEvent[]>>({});

  // Accordion state for Day History on mobile
  readonly isHistoryOpen = signal<boolean>(false);

  // Bi-directional Delivery Confirmation State
  readonly pendingDelivery = signal<DeliveryDispatchedEvent | null>(null);
  readonly isConfirmingDelivery = signal<boolean>(false);
  readonly isRejectingDelivery = signal<boolean>(false);
  readonly showRejectConfirm = signal<boolean>(false);

  // Student Edit Modal State for Parent
  readonly showEditModal = signal<boolean>(false);
  readonly editingStudent = signal<Student | null>(null);
  editAvatarUrl = '';
  editError = '';
  isSavingStudent = signal<boolean>(false);

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      this.ws.connect(token);
    }

    // Consulta inicial de entregas pendientes en puerta
    this.checkPendingDeliveries();

    this.studentService.loadMyStudents().subscribe({
      next: (students) => {
        students.forEach(s => {
          this.loadHistoryForStudent(s.id);
          this.alertService.loadLatestAlertForStudent(s.id).subscribe();
        });
        this.checkPendingDeliveries();
      }
    });

    // Sincronizar entregas pendientes cada vez que el WebSocket reconecte
    this.subscriptions.add(
      this.ws.isConnected$.subscribe(connected => {
        if (connected) {
          this.checkPendingDeliveries();
          const curr = this.currentStudentId;
          if (curr) this.alertService.loadLatestAlertForStudent(curr).subscribe();
        }
      })
    );

    // Cuando el teléfono se desbloquea o la app regresa al primer plano (pantalla encendida)
    if (typeof document !== 'undefined') {
      this.visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          this.sound.unlockAudio();
          this.checkPendingDeliveries();
          const curr = this.currentStudentId;
          if (curr) {
            this.loadHistoryForStudent(curr);
            this.alertService.loadLatestAlertForStudent(curr).subscribe();
          }
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    // Sondeo periódico ligero de respaldo (cada 15s) cuando hay alerta activa o entrega pendiente
    this.pollInterval = window.setInterval(() => {
      if (this.currentAlertStatus.state !== 'IDLE' || this.pendingDelivery()) {
        this.checkPendingDeliveries();
      }
    }, 15000);

    // Suscribirse a eventos de entrega en tiempo real
    this.subscriptions.add(
      this.ws.onDeliveryEvent().subscribe(event => {
        const normalize = (id?: string) => (id || '').trim().toLowerCase();
        const eventStudentId = normalize(event.studentId);

        const myStudents = this.studentService.students();
        const tokenStudentIds = this.authService.currentUser()?.studentIds || [];

        const isMyChild =
          myStudents.some(s => normalize(s.id) === eventStudentId) ||
          tokenStudentIds.some(id => normalize(id) === eventStudentId);

        if (isMyChild && event.status === 'ENTREGADO_ESCUELA') {
          this.pendingDelivery.set(event);
          this.showRejectConfirm.set(false);
          this.sound.playAlertSound();
          this.sound.notifyWithVibration(
            '🚗 ¡Tu hijo/a está en la puerta!',
            `${event.studentName} ha sido entregado/a en puerta por ${event.teacherName || 'el docente'}.`,
            'delivery-' + event.id
          );
          this.notification.info(`🚗 ${event.teacherName || 'El docente'} ha entregado a ${event.studentName} en la puerta.`);

          this.loadHistoryForStudent(event.studentId);
        }
      })
    );

    // Cuando docente/admin revierte la entrega → cerrar modal de entrega automáticamente
    this.subscriptions.add(
      this.ws.onDeliveryReverted().subscribe(event => {
        const pending = this.pendingDelivery();
        if (pending && pending.studentId === event.studentId) {
          this.pendingDelivery.set(null);
          this.showRejectConfirm.set(false);
          this.notification.info(`ℹ️ La entrega de ${event.studentName} fue corregida por el docente.`);
          this.loadHistoryForStudent(event.studentId);
        }
      })
    );

    // Suscribirse a eventos de alerta de sus hijos en tiempo real (cuando se emite o actualiza alerta)
    this.subscriptions.add(
      this.ws.onParentAlert().subscribe(event => {
        const normalize = (id?: string) => (id || '').trim().toLowerCase();
        const eventStudentId = normalize(event.studentId);

        const myStudents = this.studentService.students();
        const tokenStudentIds = this.authService.currentUser()?.studentIds || [];

        const isMyChild =
          myStudents.some(s => normalize(s.id) === eventStudentId) ||
          tokenStudentIds.some(id => normalize(id) === eventStudentId);

        if (isMyChild) {
          console.info('[ParentDashboard] 🔔 Alerta recibida para hijo/a:', event);
          this.alertService.updateStudentStatusFromEvent(event.studentId, event.status, event.pickupMethod);

          const statusLabels: Record<string, string> = {
            TEN_MIN: '10 MIN',
            FIVE_MIN: '5 MIN',
            EN_FILA: 'En Fila',
            URGENTE: 'Urgente'
          };
          const statusText = statusLabels[event.status] || event.status;
          const timeStr = event.sentAt
            ? new Date(event.sentAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
            : new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

          this.addHistoryEvent(event.studentId, {
            time: timeStr,
            title: `Alerta Actualizada (${statusText})`,
            description: `Modalidad ${event.pickupMethod === 'CAR' ? 'En Auto' : 'A Pie'} por ${event.parentName || 'Tutor'}`,
            type: 'ALERT'
          });

          if (event.status === 'URGENTE') {
            this.sound.playUrgentSound();
            this.sound.notifyWithVibration(
              `🚨 ¡Alerta Urgente: ${event.studentName}!`,
              `Prioridad máxima registrada en puerta.`,
              'parent-alert-' + event.id
            );
          } else {
            this.sound.playAlertSound();
            this.sound.notifyWithVibration(
              `🔔 Alerta ${statusText}: ${event.studentName}`,
              `Estatus actualizado a ${statusText}.`,
              'parent-alert-' + event.id
            );
          }
        }
      })
    );
  }

  /**
   * Consulta al backend si hay entregas pendientes de confirmación hoy para los alumnos del padre.
   */
  checkPendingDeliveries(): void {
    this.http.get<DeliveryDispatchedEvent[]>(`${this.apiUrl}/deliveries/my-pending`).subscribe({
      next: (deliveries) => {
        if (deliveries && deliveries.length > 0) {
          const first = deliveries[0];
          if (!this.pendingDelivery() || this.pendingDelivery()?.id !== first.id) {
            this.pendingDelivery.set(first);
            this.showRejectConfirm.set(false);
            this.sound.playAlertSound();
            this.sound.notifyWithVibration(
              '🚗 ¡Tu hijo/a está en la puerta!',
              `${first.studentName} ha sido entregado/a en puerta por ${first.teacherName || 'el docente'}.`,
              'delivery-' + first.id
            );
            this.notification.info(`🚗 ${first.teacherName || 'El docente'} ha entregado a ${first.studentName} en la puerta.`);
            this.loadHistoryForStudent(first.studentId);
          }
        } else if (this.pendingDelivery()) {
          this.pendingDelivery.set(null);
        }
      },
      error: (err) => {
        console.warn('[ParentDashboard] Error al consultar entregas pendientes:', err);
      }
    });
  }

  toggleHistory(): void {
    this.isHistoryOpen.update(v => !v);
  }

  testAudio(): void {
    this.sound.testSound();
    this.notification.info('🔊 Prueba de sonido ejecutada. Si no escuchas nada en tu iPhone, revisa que el switch lateral de silencio esté desactivado.');
  }

  loadHistoryForStudent(studentId: string): void {
    if (!studentId) return;
    this.http.get<HistoryEvent[]>(`${this.apiUrl}/deliveries/student/${studentId}/today-events`).subscribe({
      next: (events) => {
        this.historyMap.update(map => ({
          ...map,
          [studentId]: events
        }));
      },
      error: (err) => {
        console.warn('[History] No se pudo cargar el historial del backend:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  get currentStudentId(): string | null {
    return this.studentService.selectedStudentId();
  }

  get currentStudentEvents(): HistoryEvent[] {
    const id = this.currentStudentId;
    return id ? (this.historyMap()[id] || []) : [];
  }

  get currentAlertStatus() {
    const id = this.currentStudentId;
    return id ? this.alertService.getStudentStatus(id) : {
      studentId: '',
      pickupMethod: 'CAR' as PickupMethod,
      state: 'IDLE' as const,
      updatedAt: new Date().toISOString()
    };
  }

  private addHistoryEvent(studentId: string, event: HistoryEvent): void {
    this.historyMap.update(map => {
      const existing = map[studentId] || [];
      return {
        ...map,
        [studentId]: [event, ...existing]
      };
    });
  }

  onSelectStudent(studentId: string): void {
    this.studentService.selectStudent(studentId);
    this.loadHistoryForStudent(studentId);
    this.alertService.loadLatestAlertForStudent(studentId).subscribe();
  }

  onPickupMethodChange(method: PickupMethod): void {
    const id = this.currentStudentId;
    if (id) {
      this.alertService.setPickupMethod(id, method);
    }
  }

  onSendAlert(status: AlertStatus): void {
    const id = this.currentStudentId;
    if (!id) return;

    // Feedback sonoro y háptico inmediato en el dispositivo móvil del padre
    if (status === 'URGENTE') {
      this.sound.playUrgentSound();
    } else {
      this.sound.playAlertSound();
    }

    const method = this.currentAlertStatus.pickupMethod || 'CAR';
    this.alertService.sendAlert(id, status, method);

    const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
    const statusLabels: Record<AlertStatus, string> = {
      TEN_MIN: '10 MIN',
      FIVE_MIN: '5 MIN',
      EN_FILA: 'En Fila',
      URGENTE: 'Urgente'
    };
    this.addHistoryEvent(id, {
      time: timeStr,
      title: `Alerta Enviada (${statusLabels[status] || status})`,
      description: `Enviada en modalidad ${method === 'CAR' ? 'En Auto' : 'A Pie'}`,
      type: 'ALERT'
    });

    setTimeout(() => this.loadHistoryForStudent(id), 1200);
  }

  // ─── Bi-directional Delivery Receipt Confirmation ────────────────────────
  confirmDeliveryReceipt(): void {
    const delivery = this.pendingDelivery();
    if (!delivery) return;

    this.isConfirmingDelivery.set(true);

    this.http.post(`${this.apiUrl}/deliveries/${delivery.id}/parent-confirm`, {}).subscribe({
      next: () => {
        this.isConfirmingDelivery.set(false);
        this.pendingDelivery.set(null);
        this.sound.playAlertSound();
        this.notification.success(`✅ Has confirmado la recepción de ${delivery.studentName}. ¡Buen regreso a casa!`);

        this.loadHistoryForStudent(delivery.studentId);
      },
      error: (err) => {
        this.isConfirmingDelivery.set(false);
        this.notification.error('Error al confirmar la recepción. Intente nuevamente.');
      }
    });
  }

  dismissDeliveryModal(): void {
    this.pendingDelivery.set(null);
    this.showRejectConfirm.set(false);
  }

  openRejectConfirm(): void {
    this.showRejectConfirm.set(true);
  }

  closeRejectConfirm(): void {
    this.showRejectConfirm.set(false);
  }

  // ─── Parent Rejects Delivery (reports non-receipt) ───────────────────────
  rejectDeliveryReceipt(): void {
    const delivery = this.pendingDelivery();
    if (!delivery) return;

    this.isRejectingDelivery.set(true);

    this.http.post(`${this.apiUrl}/deliveries/${delivery.id}/parent-reject`, {}).subscribe({
      next: () => {
        this.isRejectingDelivery.set(false);
        this.pendingDelivery.set(null);
        this.showRejectConfirm.set(false);
        this.notification.warning(`⚠️ Reporte enviado. El docente será alertado de inmediato sobre ${delivery.studentName}.`);
        this.loadHistoryForStudent(delivery.studentId);
      },
      error: () => {
        this.isRejectingDelivery.set(false);
        this.notification.error('Error al enviar el reporte. Intente nuevamente.');
      }
    });
  }

  onEditStudent(student: Student): void {
    this.editingStudent.set(student);
    this.editAvatarUrl = student.avatarUrl || '';
    this.editError = '';
    this.showEditModal.set(true);
  }

  /**
   * Sube la foto seleccionada a Cloudinary (carpeta iit-pickup-fotos/students)
   * y actualiza editAvatarUrl con la URL pública resultante.
   */
  onPhotoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    const student = this.editingStudent();
    this.editError = '';
    this.isSavingStudent.set(true);

    this.imageUpload
      .uploadFile(file, 'student', student?.id, student?.name)
      .subscribe({
        next: (url) => {
          // Aplica thumbnail 400x400 si viene de Cloudinary
          this.editAvatarUrl = this.imageUpload.applyTransform(url, {
            width: 400, height: 400, crop: 'fill', gravity: 'face',
            format: 'auto', quality: 'auto'
          });
          this.isSavingStudent.set(false);
        },
        error: (err) => {
          this.editError = err.message || 'Error al subir la fotografía.';
          this.isSavingStudent.set(false);
        }
      });
  }

  clearPhoto(): void {
    this.editAvatarUrl = '';
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingStudent.set(null);
  }

  /**
   * Guarda el perfil del alumno con la URL ya subida a Cloudinary.
   * La foto fue procesada en onPhotoFileSelected() — aquí solo se persiste la URL.
   */
  saveStudentProfile(): void {
    const student = this.editingStudent();
    if (!student) return;

    this.isSavingStudent.set(true);
    this.editError = '';

    const payload = { avatarUrl: this.editAvatarUrl.trim() || undefined };

    this.studentService.updateStudentByParent(student.id, payload).subscribe({
      next: () => {
        this.isSavingStudent.set(false);
        this.closeEditModal();
        this.notification.success('Fotografía del alumno actualizada correctamente.');
      },
      error: (err) => {
        this.isSavingStudent.set(false);
        this.editError = err.error?.message || 'Error al guardar la fotografía.';
      }
    });
  }

  logout(): void {
    this.ws.disconnect();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
