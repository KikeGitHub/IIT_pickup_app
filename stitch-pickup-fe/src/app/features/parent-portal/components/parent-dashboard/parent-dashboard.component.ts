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

    this.studentService.loadMyStudents().subscribe();

    // Subscribe to delivery events for bi-directional confirmation
    this.wsSubscription = this.ws.onDeliveryEvent().subscribe(event => {
      const myStudents = this.studentService.students();
      const isMyChild = myStudents.some(s => s.id === event.studentId);

      if (isMyChild && event.status === 'ENTREGADO_ESCUELA') {
        this.pendingDelivery.set(event);
        this.sound.playAlertSound();
        this.notification.info(`🚗 ${event.teacherName || 'El docente'} ha entregado a ${event.studentName} en la puerta.`);

        const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
        this.addHistoryEvent(event.studentId, {
          time: timeStr,
          title: 'Alumno en Línea de Espera',
          description: `${event.teacherName || 'Docente'} confirmó en puerta`,
          type: 'DISPATCH'
        });
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

        const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
        this.addHistoryEvent(delivery.studentId, {
          time: timeStr,
          title: 'Recepción Confirmada',
          description: 'Alumno recibido por el tutor familiar',
          type: 'RECEIVED'
        });
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

  readonly maxBirthdayDate = new Date().toISOString().split('T')[0];
  readonly minBirthdayDate = '2005-01-01';

  editFamilyMembers: Array<{ name: string; relationship: string; phone: string; authorized: boolean }> = [];

  readonly relationshipOptions = [
    'Mamá',
    'Papá',
    'Abuela',
    'Abuelo',
    'Tía',
    'Tío',
    'Hermano/a',
    'Tutor Legal',
    'Chofer / Transporte',
    'Familiar Autorizado'
  ];

  onEditStudent(student: Student): void {
    this.editingStudent.set(student);
    this.editAvatarUrl = student.avatarUrl || '';
    this.editBirthday = student.birthday || '';
    this.editError = '';

    this.editFamilyMembers = (student.familyMembers || []).map(m => ({
      name: m.name || '',
      relationship: m.relationship || 'Mamá',
      phone: m.phone || '',
      authorized: m.authorized !== false
    }));

    if (this.editFamilyMembers.length === 0) {
      this.editFamilyMembers.push({
        name: '',
        relationship: 'Mamá',
        phone: '',
        authorized: true
      });
    }

    this.showEditModal.set(true);
  }

  addFamilyMember(): void {
    if (this.editFamilyMembers.length >= 4) {
      this.editError = 'Máximo 4 tutores autorizados por alumno.';
      return;
    }
    this.editFamilyMembers.push({
      name: '',
      relationship: 'Familiar Autorizado',
      phone: '',
      authorized: true
    });
  }

  removeFamilyMember(index: number): void {
    this.editFamilyMembers.splice(index, 1);
  }

  onPhotoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.editError = 'La fotografía no debe superar 2MB.';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.editAvatarUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  clearPhoto(): void {
    this.editAvatarUrl = '';
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingStudent.set(null);
  }

  saveStudentProfile(): void {
    const student = this.editingStudent();
    if (!student) return;

    if (this.editBirthday && this.editBirthday > this.maxBirthdayDate) {
      this.editError = `La fecha de nacimiento no puede ser futura (${this.editBirthday}). El año actual es ${new Date().getFullYear()}.`;
      return;
    }

    this.isSavingStudent.set(true);
    this.editError = '';

    const validMembers = this.editFamilyMembers
      .filter(m => m.name.trim().length > 0)
      .map(m => ({
        name: m.name.trim(),
        relationship: m.relationship.trim() || 'Familiar',
        phone: m.phone.trim(),
        authorized: m.authorized
      }));

    const payload = {
      avatarUrl: this.editAvatarUrl.trim() || undefined,
      birthday: this.editBirthday || undefined,
      familyMembers: validMembers
    };

    this.studentService.updateStudentByParent(student.id, payload).subscribe({
      next: () => {
        this.isSavingStudent.set(false);
        this.closeEditModal();
        this.notification.success('Perfil y tutores autorizados actualizados correctamente.');
      },
      error: (err) => {
        this.isSavingStudent.set(false);
        this.editError = err.error?.message || 'Error al guardar los cambios.';
      }
    });
  }

  logout(): void {
    this.ws.disconnect();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
