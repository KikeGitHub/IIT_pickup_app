import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LevelFilter } from '../../services/monitor.service';

@Component({
  selector: 'app-level-filter-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './level-filter-sidebar.component.html',
  styleUrl: './level-filter-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LevelFilterSidebarComponent {
  @Input({ required: true }) selectedLevel: LevelFilter = 'ALL';
  @Input() kinderCount: number = 0;
  @Input() primariaCount: number = 0;
  @Input() secundariaCount: number = 0;
  @Input() totalCount: number = 0;
  @Output() filterChange = new EventEmitter<LevelFilter>();

  readonly filters: { value: LevelFilter; label: string; emoji: string }[] = [
    { value: 'ALL', label: 'Todos', emoji: '🏫' },
    { value: 'KINDER', label: 'Kinder', emoji: '🎒' },
    { value: 'PRIMARIA', label: 'Primaria', emoji: '📚' },
    { value: 'SECUNDARIA', label: 'Secundaria', emoji: '🎓' },
  ];

  getCount(level: LevelFilter): number {
    switch (level) {
      case 'KINDER': return this.kinderCount;
      case 'PRIMARIA': return this.primariaCount;
      case 'SECUNDARIA': return this.secundariaCount;
      default: return this.totalCount;
    }
  }

  onFilter(level: LevelFilter): void {
    this.filterChange.emit(level);
  }
}
