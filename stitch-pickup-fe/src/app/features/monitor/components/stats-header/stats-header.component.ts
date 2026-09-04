import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
 
@Component({
  selector: 'app-stats-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './stats-header.component.html',
  styleUrl: './stats-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsHeaderComponent {
  readonly authService = inject(AuthService);

  @Input() totalActive: number = 0;
  @Input() urgentCount: number = 0;
  @Input() enFilaCount: number = 0;
  @Input() dispatchedCount: number = 0;
  @Input() isConnected: boolean = false;
  @Input() teacherName: string = '';
  @Input() currentTheme: 'light' | 'dark' = 'light';
  @Input() activeTab: 'MONITOR' | 'GROUPS' = 'MONITOR';

  @Output() logout = new EventEmitter<void>();
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() tabChange = new EventEmitter<'MONITOR' | 'GROUPS'>();

  onLogout(): void { this.logout.emit(); }
  onToggleTheme(): void { this.toggleTheme.emit(); }
  setTab(tab: 'MONITOR' | 'GROUPS'): void { this.tabChange.emit(tab); }

  now(): string {
    return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  get teacherGroups(): string[] {
    const user = this.authService.currentUser();
    return user?.groups || [];
  }
}
