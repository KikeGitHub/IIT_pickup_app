import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryRecord } from '../../services/monitor.service';

@Component({
  selector: 'app-dispatch-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dispatch-confirmation.component.html',
  styleUrl: './dispatch-confirmation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DispatchConfirmationComponent {
  @Input({ required: true }) deliveries: DeliveryRecord[] = [];
  @Input() revertingDeliveryId: string | null = null;
  @Output() revert = new EventEmitter<{ deliveryId: string; studentName: string }>();

  formatTime(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  onRevertClick(delivery: DeliveryRecord): void {
    this.revert.emit({ deliveryId: delivery.id, studentName: delivery.studentName });
  }
}
