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
  @Output() dispatch = new EventEmitter<string>();

  get statusConfig(): { label: string; color: string; bgColor: string; priority: number } {
    switch (this.alert.status) {
      case 'URGENTE': return { label: '🚨 URGENTE', color: '#fca5a5', bgColor: 'rgba(239,68,68,0.15)', priority: 4 };
      case 'EN_FILA': return { label: '🚗 EN FILA', color: '#93c5fd', bgColor: 'rgba(59,130,246,0.12)', priority: 3 };
      case 'FIVE_MIN': return { label: '⏱ 5 MIN', color: '#fdba74', bgColor: 'rgba(249,115,22,0.12)', priority: 2 };
      case 'TEN_MIN': return { label: '🕐 10 MIN', color: '#fde68a', bgColor: 'rgba(245,158,11,0.10)', priority: 1 };
      default: return { label: this.alert.status, color: 'white', bgColor: 'rgba(255,255,255,0.05)', priority: 0 };
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
