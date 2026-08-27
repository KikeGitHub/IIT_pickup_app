import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MonitorService, LevelFilter } from '../../services/monitor.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { TeacherService, TeacherGroup, TeacherStudent } from '../../../../core/services/teacher.service';
import { StatsHeaderComponent } from '../stats-header/stats-header.component';
import { LevelFilterSidebarComponent } from '../level-filter-sidebar/level-filter-sidebar.component';
import { StudentMonitorCardComponent } from '../student-monitor-card/student-monitor-card.component';
import { DispatchConfirmationComponent } from '../dispatch-confirmation/dispatch-confirmation.component';
import { TableSkeletonComponent } from '../../../../shared/components/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-monitor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatsHeaderComponent,
    LevelFilterSidebarComponent,
    StudentMonitorCardComponent,
    DispatchConfirmationComponent,
    TableSkeletonComponent
  ],
  templateUrl: './monitor-dashboard.component.html',
  styleUrl: './monitor-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonitorDashboardComponent implements OnInit, OnDestroy {
  readonly monitorService = inject(MonitorService);
  readonly authService = inject(AuthService);
  readonly teacherService = inject(TeacherService);
  readonly ws = inject(WebSocketService);
  private readonly router = inject(Router);

  readonly currentTheme = signal<'light' | 'dark'>(
    (localStorage.getItem('monitor_theme') as 'light' | 'dark') || 'light'
  );

  readonly activeTab = signal<'MONITOR' | 'GROUPS'>('MONITOR');

  // Student Edit Modal for Teacher
  readonly showEditModal = signal<boolean>(false);
  readonly editingStudent = signal<TeacherStudent | null>(null);
  editName = '';
  editGrade = '';
  editBirthday = '';
  editGender: 'M' | 'F' = 'M';
  editCurp = '';
  editAvatarUrl = '';
  editError = '';
  isSavingStudent = signal<boolean>(false);

  // Group selection filter in GROUPS tab
  readonly selectedGroupId = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      this.ws.connect(token);
    }

    this.monitorService.initialize();

    if (this.authService.userRole() === 'TEACHER' || this.authService.userRole() === 'ADMIN') {
      this.teacherService.loadMyGroups().subscribe(groups => {
        if (groups.length > 0 && !this.selectedGroupId()) {
          this.selectedGroupId.set(groups[0].id);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }

  get teacherName(): string {
    return this.authService.currentUser()?.nombre || '';
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
    localStorage.setItem('monitor_theme', newTheme);
  }

  setTab(tab: 'MONITOR' | 'GROUPS'): void {
    this.activeTab.set(tab);
    if (tab === 'GROUPS') {
      this.teacherService.loadMyGroups().subscribe(groups => {
        if (groups.length > 0 && !this.selectedGroupId()) {
          this.selectedGroupId.set(groups[0].id);
        }
      });
    }
  }

  studentSearchQuery = '';

  selectGroup(groupId: string): void {
    this.selectedGroupId.set(groupId);
    this.studentSearchQuery = '';
  }

  get currentGroup(): TeacherGroup | undefined {
    const gid = this.selectedGroupId();
    return this.teacherService.myGroups().find(g => g.id === gid) || this.teacherService.myGroups()[0];
  }

  get filteredGroupStudents(): TeacherStudent[] {
    const grp = this.currentGroup;
    if (!grp || !grp.students) return [];
    if (!this.studentSearchQuery.trim()) return grp.students;
    const q = this.studentSearchQuery.toLowerCase();
    return grp.students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.curp && s.curp.toLowerCase().includes(q)) ||
      (s.grade && s.grade.toLowerCase().includes(q))
    );
  }

  openEditStudentModal(student: TeacherStudent): void {
    this.editingStudent.set(student);
    this.editName = student.name;
    this.editGrade = student.grade || '';
    this.editBirthday = student.birthday || '';
    this.editGender = (student.gender as 'M' | 'F') || 'M';
    this.editCurp = student.curp || '';
    this.editAvatarUrl = student.avatarUrl || '';
    this.editError = '';
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingStudent.set(null);
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

  saveStudent(): void {
    const s = this.editingStudent();
    if (!s) return;

    if (!this.editName.trim()) {
      this.editError = 'El nombre del alumno es obligatorio.';
      return;
    }

    this.isSavingStudent.set(true);
    this.editError = '';

    const payload = {
      name: this.editName.trim(),
      grade: this.editGrade.trim() || undefined,
      birthday: this.editBirthday || undefined,
      gender: this.editGender,
      curp: this.editCurp.trim().toUpperCase() || undefined,
      avatarUrl: this.editAvatarUrl.trim() || undefined
    };

    this.teacherService.updateStudent(s.id, payload).subscribe({
      next: () => {
        this.isSavingStudent.set(false);
        this.closeEditModal();
      },
      error: (err) => {
        this.isSavingStudent.set(false);
        this.editError = err.error?.message || 'Error al actualizar el alumno.';
      }
    });
  }

  onFilterChange(level: LevelFilter): void {
    this.monitorService.setLevelFilter(level);
  }

  onDispatch(alertId: string): void {
    this.monitorService.dispatch(alertId);
  }

  logout(): void {
    this.ws.disconnect();
    this.authService.logout();
    this.router.navigate(['/auth/maestros']);
  }
}
