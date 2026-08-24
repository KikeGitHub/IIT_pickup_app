import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HistoryEvent {
  time: string;
  title: string;
  description: string;
  type: 'ALERT' | 'DISPATCH' | 'RECEIVED';
}

@Component({
  selector: 'app-day-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './day-history.component.html',
  styleUrl: './day-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DayHistoryComponent {
  @Input() events: HistoryEvent[] = [
    { time: '14:05', title: 'Alerta Enviada (10 MIN)', description: 'Enviada desde la app', type: 'ALERT' },
    { time: '14:18', title: 'Alumno en Línea de Espera', description: 'Prof. Solis confirmó en puerta', type: 'DISPATCH' }
  ];
}
