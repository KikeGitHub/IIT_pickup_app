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
    if (!this.alert?.sentAt) return 'hace un momento';

    let date: Date;

    // Si viene en formato solo hora "HH:mm" o "HH:mm:ss"
    if (typeof this.alert.sentAt === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(this.alert.sentAt.trim())) {
      const parts = this.alert.sentAt.trim().split(':');
      const now = new Date();
      date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        parseInt(parts[0], 10),
        parseInt(parts[1], 10),
        parts[2] ? parseInt(parts[2], 10) : 0
      );
    } else {
      date = new Date(this.alert.sentAt);
    }

    const timestamp = date.getTime();
    if (isNaN(timestamp) || timestamp <= 0) {
      return 'hace un momento';
    }

    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 0 || diff < 30) return 'hace un momento';
    if (diff < 60) return `hace ${diff}s`;

    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `hace ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  onDispatch(): void {
    this.dispatch.emit(this.alert.id);
  }
}
