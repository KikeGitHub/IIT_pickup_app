import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagination-container" *ngIf="totalItems > 0">
      <div class="pagination-info">
        <span>Mostrando <strong>{{ startItem }}-{{ endItem }}</strong> de <strong>{{ totalItems | number }}</strong> registros</span>
        <span class="page-count-badge">Página {{ currentPage }} de {{ totalPages }}</span>
      </div>

      <div class="pagination-controls">
        <!-- Page size selector -->
        <div class="page-size-selector">
          <label for="pageSizeSelect">Filas:</label>
          <select
            id="pageSizeSelect"
            [ngModel]="pageSize"
            (ngModelChange)="onPageSizeChange($event)"
            class="page-size-dropdown"
          >
            <option *ngFor="let opt of pageSizeOptions" [value]="opt">{{ opt }} por pág.</option>
          </select>
        </div>

        <!-- Navigation Buttons -->
        <div class="page-nav-group">
          <button
            type="button"
            class="page-btn page-btn--nav"
            [disabled]="currentPage === 1"
            (click)="goToPage(1)"
            title="Primera página"
          >
            ««
          </button>
          <button
            type="button"
            class="page-btn page-btn--nav"
            [disabled]="currentPage === 1"
            (click)="goToPage(currentPage - 1)"
            title="Página anterior"
          >
            ‹ Ant
          </button>

          <!-- Numbered page buttons -->
          <ng-container *ngFor="let p of visiblePages">
            <button
              *ngIf="p !== -1"
              type="button"
              class="page-btn page-btn--num"
              [class.page-btn--active]="p === currentPage"
              (click)="goToPage(p)"
            >
              {{ p }}
            </button>
            <span *ngIf="p === -1" class="page-ellipsis">…</span>
          </ng-container>

          <button
            type="button"
            class="page-btn page-btn--nav"
            [disabled]="currentPage >= totalPages"
            (click)="goToPage(currentPage + 1)"
            title="Página siguiente"
          >
            Sig ›
          </button>
          <button
            type="button"
            class="page-btn page-btn--nav"
            [disabled]="currentPage >= totalPages"
            (click)="goToPage(totalPages)"
            title="Última página"
          >
            »»
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      padding: 12px 18px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #475569;
    }

    .pagination-info {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;

      strong {
        color: #0f172a;
        font-weight: 600;
      }
    }

    .page-count-badge {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;

      .page-size-dropdown {
        padding: 5px 8px;
        font-size: 12px;
        font-weight: 600;
        color: #1e293b;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        outline: none;
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s;

        &:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
        }
      }
    }

    .page-nav-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .page-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      padding: 0 8px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;

      &:hover:not(:disabled) {
        background: #f1f5f9;
        color: #0f172a;
        border-color: #94a3b8;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: #f8fafc;
      }

      &--active {
        background: #2563eb !important;
        color: #ffffff !important;
        border-color: #2563eb !important;
        box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
      }

      &--nav {
        font-size: 11px;
        padding: 0 8px;
      }
    }

    .page-ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 32px;
      font-weight: bold;
      color: #94a3b8;
    }

    @media (max-width: 640px) {
      .pagination-container {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }

      .pagination-controls {
        justify-content: space-between;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 15;
  @Input() currentPage: number = 1;
  @Input() pageSizeOptions: number[] = [15, 30, 100];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    // Always include page 1
    pages.push(1);

    if (current > 3) {
      pages.push(-1); // ellipsis
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push(-1); // ellipsis
    }

    // Always include last page
    pages.push(total);

    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(newSize: number): void {
    const size = Number(newSize);
    this.pageSizeChange.emit(size);
  }
}
