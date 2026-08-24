import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentAlertStatus } from '../../../../core/models/alert.model';

@Component({
  selector: 'app-alert-status-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-status-card.component.html',
  styleUrl: './alert-status-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertStatusCardComponent {
  @Input({ required: true }) alertStatus!: StudentAlertStatus;

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'TEN_MIN': return '10 Minutos';
      case 'FIVE_MIN': return '5 Minutos';
      case 'EN_FILA': return 'En Fila';
      case 'URGENTE': return 'Urgente';
      default: return 'Ninguna';
    }
  }
}
