import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { KpiDashboardComponent } from '../kpi-dashboard/kpi-dashboard.component';
import { GroupConfigComponent } from '../group-config/group-config.component';
import { StudentCrudComponent } from '../student-crud/student-crud.component';
import { TeacherUserCrudComponent } from '../teacher-user-crud/teacher-user-crud.component';
import { ParentUserCrudComponent } from '../parent-user-crud/parent-user-crud.component';
import { CsvImportComponent } from '../csv-import/csv-import.component';

export type AdminTab = 'KPIS' | 'GROUPS' | 'STUDENTS' | 'TEACHERS' | 'PARENTS' | 'CSV';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    KpiDashboardComponent,
    GroupConfigComponent,
    StudentCrudComponent,
    TeacherUserCrudComponent,
    ParentUserCrudComponent,
    CsvImportComponent
  ],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminShellComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly activeTab = signal<AdminTab>('KPIS');

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/maestros']);
  }
}
