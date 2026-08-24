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
import { DayHistoryComponent } from '../day-history/day-history.component';

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
    DayHistoryComponent
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

  // Bi-directional Delivery Confirmation State
  readonly pendingDelivery = signal<DeliveryDispatchedEvent | null>(null);
  readonly isConfirmingDelivery = signal<boolean>(false);

  // Student Edit Modal State for Parent
  readonly showEditModal = signal<boolean>(false);
  readonly editingStudent = signal<Student | null>(null);
  editAvatarUrl = '';
  editBirthday = '';
  editTutors: Array<{ name: string; relationship: string; phone: string; authorized: boolean }> = [];
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
      }
    });
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
  }

  get currentStudentId(): string | null {
    return this.studentService.selectedStudentId();
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

  // ─── Edit Student Profile by Parent ──────────────────────────────────────
  onEditStudent(student: Student): void {
    this.editingStudent.set(student);
    this.editAvatarUrl = student.avatarUrl || '';
    this.editBirthday = '';
    this.editTutors = student.familyMembers ? student.familyMembers.map(m => ({
      name: m.name,
      relationship: m.relationship,
      phone: m.phone || '',
      authorized: m.authorized !== false
    })) : [];

    while (this.editTutors.length < 2) {
      this.editTutors.push({ name: '', relationship: 'Familiar', phone: '', authorized: true });
    }

    this.editError = '';
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingStudent.set(null);
  }

  addTutorRow(): void {
    if (this.editTutors.length < 3) {
      this.editTutors.push({ name: '', relationship: 'Familiar', phone: '', authorized: true });
    }
  }

  removeTutorRow(index: number): void {
    this.editTutors.splice(index, 1);
  }

  saveStudentProfile(): void {
    const student = this.editingStudent();
    if (!student) return;

    this.isSavingStudent.set(true);
    this.editError = '';

    const validTutors = this.editTutors.filter(t => t.name.trim().length > 0);

    const payload = {
      avatarUrl: this.editAvatarUrl.trim() || undefined,
      birthday: this.editBirthday || undefined,
      familyMembers: validTutors
    };

    this.studentService.updateStudentByParent(student.id, payload).subscribe({
      next: () => {
        this.isSavingStudent.set(false);
        this.closeEditModal();
        this.notification.success('Perfil y fotografía del alumno actualizados.');
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
