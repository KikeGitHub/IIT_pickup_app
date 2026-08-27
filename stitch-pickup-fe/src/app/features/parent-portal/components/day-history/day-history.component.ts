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
  @Input() events: HistoryEvent[] = [];
}
