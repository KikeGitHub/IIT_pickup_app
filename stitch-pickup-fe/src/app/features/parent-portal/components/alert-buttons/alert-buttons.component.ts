import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertStatus } from '../../../../core/models/alert.model';

@Component({
  selector: 'app-alert-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-buttons.component.html',
  styleUrl: './alert-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertButtonsComponent {
  @Input() activeStatus?: AlertStatus;
  @Input() disabled: boolean = false;
  @Output() sendAlert = new EventEmitter<AlertStatus>();

  onAlertClick(status: AlertStatus): void {
    if (this.disabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(60);
      } catch (e) {}
    }
    this.sendAlert.emit(status);
  }
}
