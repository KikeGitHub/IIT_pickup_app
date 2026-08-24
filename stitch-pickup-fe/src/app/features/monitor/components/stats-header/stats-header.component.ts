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
  @Output() logout = new EventEmitter<void>();

  onLogout(): void { this.logout.emit(); }

  now(): string {
    return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }
}
