import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
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
export class StudentMonitorCardComponent implements OnInit, OnDestroy {
  @Input({ required: true }) alert!: MonitorAlert;
  @Input() isDispatching: boolean = false;
  @Input() isUpdated: boolean = false;
  @Output() dispatch = new EventEmitter<string>();

  private readonly cdr = inject(ChangeDetectorRef);
  private timerInterval?: any;
  currentElapsedSeconds: number = 0;

  ngOnInit(): void {
    this.updateElapsed();
    // Cronómetro reactivo en vivo que avanza cada segundo en pantalla
    if (typeof window !== 'undefined') {
      this.timerInterval = setInterval(() => {
        this.updateElapsed();
        this.cdr.markForCheck();
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  private parseSentDate(): Date | null {
    if (!this.alert?.sentAt) return null;

    if (typeof this.alert.sentAt === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(this.alert.sentAt.trim())) {
      const parts = this.alert.sentAt.trim().split(':');
      const now = new Date();
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        parseInt(parts[0], 10),
        parseInt(parts[1], 10),
        parts[2] ? parseInt(parts[2], 10) : 0
      );
    }

    const d = new Date(this.alert.sentAt);
    return isNaN(d.getTime()) || d.getTime() <= 0 ? null : d;
  }

  private updateElapsed(): void {
    const d = this.parseSentDate();
    if (!d) {
      this.currentElapsedSeconds = 0;
      return;
    }
    this.currentElapsedSeconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  }

  /**
   * Hora exacta en que el padre emitió la alerta (ej. 02:35 PM o 14:35)
   */
  get exactTime(): string {
    const d = this.parseSentDate();
    if (!d) return '';

    return d.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Cronómetro de espera formateado (ej. 03:45 min)
   */
  get elapsedFormatted(): string {
    const sec = this.currentElapsedSeconds;
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (mins < 60) {
      return `${pad(mins)}:${pad(remSec)} min`;
    }
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${pad(remMins)}m`;
  }

  /**
   * Semáforo de prioridades según el tiempo transcurrido y estado de la alerta:
   * - normal (< 3 min): Verde/Azul, a tiempo
   * - warning (3 a 6 min): Ámbar/Naranja, requiere atención
   * - critical (> 6 min o URGENTE): Rojo, prioridad alta/demora urgente
   */
  get priorityConfig(): {
    tier: 'normal' | 'warning' | 'critical';
    label: string;
    badgeClass: string;
    icon: string;
  } {
    if (this.alert.status === 'URGENTE' || this.alert.isRejectedByParent || this.currentElapsedSeconds >= 360) {
      return {
        tier: 'critical',
        label: this.alert.status === 'URGENTE' ? 'Prioridad Urgente' : 'Demora Alta',
        badgeClass: 'priority--critical',
        icon: '🚨'
      };
    }

    if (this.currentElapsedSeconds >= 180 || (this.alert.status === 'EN_FILA' && this.currentElapsedSeconds >= 120)) {
      return {
        tier: 'warning',
        label: 'En Espera',
        badgeClass: 'priority--warning',
        icon: '⏱️'
      };
    }

    return {
      tier: 'normal',
      label: 'A tiempo',
      badgeClass: 'priority--normal',
      icon: '⏱️'
    };
  }

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

  onDispatch(): void {
    this.dispatch.emit(this.alert.id);
  }
}
