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
  private readonly sound = inject(NotificationSoundService);
  private readonly notification = inject(NotificationService);
  private readonly imageUpload = inject(ImageUploadService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly apiUrl = environment.apiUrl;
  private wsSubscription?: Subscription;

  // Real-time daily history map per student
  readonly historyMap = signal<Record<string, HistoryEvent[]>>({});

  // Bi-directional Delivery Confirmation State
  readonly pendingDelivery = signal<DeliveryDispatchedEvent | null>(null);
  readonly isConfirmingDelivery = signal<boolean>(false);

  // Student Edit Modal State for Parent
  readonly showEditModal = signal<boolean>(false);
  readonly editingStudent = signal<Student | null>(null);
  editAvatarUrl = '';
  editBirthday = '';
  editError = '';
  isSavingStudent = signal<boolean>(false);

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      this.ws.connect(token);
    }

    this.studentService.loadMyStudents().subscribe({
      next: (students) => {
        students.forEach(s => this.loadHistoryForStudent(s.id));
      }
    });

    // Subscribe to delivery events for bi-directional confirmation
    this.wsSubscription = this.ws.onDeliveryEvent().subscribe(event => {
      const myStudents = this.studentService.students();
      const isMyChild = myStudents.some(s => s.id === event.studentId);

      if (isMyChild && event.status === 'ENTREGADO_ESCUELA') {
        this.pendingDelivery.set(event);
        this.sound.playAlertSound();
        this.notification.info(`🚗 ${event.teacherName || 'El docente'} ha entregado a ${event.studentName} en la puerta.`);

        this.loadHistoryForStudent(event.studentId);
      }
    });
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
    this.wsSubscription?.unsubscribe();
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
