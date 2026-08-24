import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
// Monitor Dashboard Component for Sprint 4
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MonitorService, LevelFilter } from '../../services/monitor.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { StatsHeaderComponent } from '../stats-header/stats-header.component';
import { LevelFilterSidebarComponent } from '../level-filter-sidebar/level-filter-sidebar.component';
import { StudentMonitorCardComponent } from '../student-monitor-card/student-monitor-card.component';
import { DispatchConfirmationComponent } from '../dispatch-confirmation/dispatch-confirmation.component';

@Component({
  selector: 'app-monitor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatsHeaderComponent,
    LevelFilterSidebarComponent,
    StudentMonitorCardComponent,
    DispatchConfirmationComponent
  ],
  templateUrl: './monitor-dashboard.component.html',
  styleUrl: './monitor-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonitorDashboardComponent implements OnInit {
  readonly monitorService = inject(MonitorService);
  readonly authService = inject(AuthService);
  readonly ws = inject(WebSocketService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.monitorService.initialize();
  }

  get teacherName(): string {
    return this.authService.currentUser()?.nombre || '';
  }

  get isConnected(): boolean {
    return true; // Controlled by WebSocketService state
  }

  onFilterChange(level: LevelFilter): void {
    this.monitorService.setLevelFilter(level);
  }

  onDispatch(alertId: string): void {
    this.monitorService.dispatch(alertId);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/maestros']);
  }
}
