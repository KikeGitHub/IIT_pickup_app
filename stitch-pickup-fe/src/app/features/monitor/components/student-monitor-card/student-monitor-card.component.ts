import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitorAlert } from '../../services/monitor.service';

@Component({
  selector: 'app-student-monitor-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-monitor-card.component.html',
  styleUrl: './student-monitor-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentMonitorCardComponent {
  @Input({ required: true }) alert!: MonitorAlert;
  @Input() isDispatching: boolean = false;
  @Input() isUpdated: boolean = false;
  @Output() dispatch = new EventEmitter<string>();

  get statusConfig(): { label: string; color: string; bgColor: string; borderColor: string; priority: number } {
    switch (this.alert.status) {
      case 'URGENTE':
        return {
          label: '🚨 URGENTE',
          color: '#b91c1c',
          bgColor: '#fee2e2',
          borderColor: '#ef4444',
          priority: 4
        };
      case 'EN_FILA':
        return {
          label: '🚗 EN FILA',
          color: '#1d4ed8',
          bgColor: '#dbeafe',
          borderColor: '#3b82f6',
          priority: 3
        };
      case 'FIVE_MIN':
        return {
          label: '⏱ 5 MIN',
          color: '#b45309',
          bgColor: '#fef3c7',
          borderColor: '#f59e0b',
          priority: 2
        };
      case 'TEN_MIN':
        return {
          label: '🕐 10 MIN',
          color: '#334155',
          bgColor: '#f1f5f9',
          borderColor: '#94a3b8',
          priority: 1
        };
      default:
        return {
          label: this.alert.status,
          color: '#1e293b',
          bgColor: '#f8fafc',
          borderColor: '#cbd5e1',
          priority: 0
        };
    }
  }

  get levelBadge(): string {
    switch (this.alert.level) {
      case 'KINDER': return '🌱 Kinder';
      case 'PRIMARIA': return '📚 Primaria';
      case 'SECUNDARIA': return '🎓 Secundaria';
      default: return this.alert.level;
    }
  }

  get timeAgo(): string {
    const diff = (Date.now() - new Date(this.alert.sentAt).getTime()) / 1000;
    if (diff < 60) return `hace ${Math.round(diff)}s`;
    const m = Math.round(diff / 60);
    return `hace ${m} min`;
  }

  onDispatch(): void {
    this.dispatch.emit(this.alert.id);
  }
}
