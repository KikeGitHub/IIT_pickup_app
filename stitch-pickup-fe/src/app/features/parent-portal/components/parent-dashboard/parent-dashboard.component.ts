import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StudentService } from '../../../../core/services/student.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConnectivityService } from '../../../../core/services/connectivity.service';
import { AlertStatus, PickupMethod } from '../../../../core/models/alert.model';
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
export class ParentDashboardComponent implements OnInit {
  readonly studentService = inject(StudentService);
  readonly alertService = inject(AlertService);
  readonly authService = inject(AuthService);
  readonly connectivity = inject(ConnectivityService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.studentService.loadMyStudents().subscribe();
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
