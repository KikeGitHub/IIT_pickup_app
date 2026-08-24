import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
// Admin Shell Component for Sprint 5
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { KpiDashboardComponent } from '../kpi-dashboard/kpi-dashboard.component';
import { UserManagementComponent } from '../user-management/user-management.component';
import { CsvImportComponent } from '../csv-import/csv-import.component';

export type AdminTab = 'KPIS' | 'USERS' | 'CSV';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    CommonModule,
    KpiDashboardComponent,
    UserManagementComponent,
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
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/teacher']);
  }
}
