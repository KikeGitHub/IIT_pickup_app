import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LevelFilter } from '../../services/monitor.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-level-filter-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './level-filter-sidebar.component.html',
  styleUrl: './level-filter-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LevelFilterSidebarComponent {
  private readonly authService = inject(AuthService);

  @Input({ required: true }) selectedLevel: LevelFilter = 'ALL';
  @Input() kinderCount: number = 0;
  @Input() primariaCount: number = 0;
  @Input() secundariaCount: number = 0;
  @Input() totalCount: number = 0;
  @Output() filterChange = new EventEmitter<LevelFilter>();

  readonly allFilters: { value: LevelFilter; label: string; emoji: string }[] = [
    { value: 'ALL', label: 'Todos', emoji: '🏫' },
    { value: 'KINDER', label: 'Kinder', emoji: '🎒' },
    { value: 'PRIMARIA', label: 'Primaria', emoji: '📚' },
    { value: 'SECUNDARIA', label: 'Secundaria', emoji: '🎓' },
  ];

  readonly visibleFilters = computed(() => {
    const user = this.authService.currentUser();
    if (!user || user.role === 'ADMIN') {
      return this.allFilters;
    }

    const teacherLevels = new Set<string>();

    if (user.level) {
      teacherLevels.add(user.level.toUpperCase());
    }

    if (teacherLevels.size === 0) {
      return this.allFilters;
    }

    return this.allFilters.filter(f => f.value === 'ALL' || teacherLevels.has(f.value));
  });

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
