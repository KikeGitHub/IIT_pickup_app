import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PickupMethod } from '../../../../core/models/alert.model';

@Component({
  selector: 'app-pickup-mode-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pickup-mode-selector.component.html',
  styleUrl: './pickup-mode-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PickupModeSelectorComponent {
  @Input() selectedMethod: PickupMethod = 'CAR';
  @Output() methodChange = new EventEmitter<PickupMethod>();

  selectMode(method: PickupMethod): void {
    this.methodChange.emit(method);
  }
}
