import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper" [class.skeleton-wrapper--inline]="inline">
      <!-- Animated Top Accent Progress Bar -->
      <div class="skeleton-progress-bar">
        <div class="skeleton-progress-fill"></div>
      </div>

      <!-- Modern Shimmer Rows -->
      <div class="skeleton-rows">
        @for (row of rowList; track $index) {
          <div class="skeleton-row" [style.animation-delay]="$index * 0.05 + 's'">
            <!-- Avatar & Primary Info Column -->
            <div class="skeleton-cell cell-primary">
              <div class="skeleton-shimmer skeleton-circle"></div>
              <div class="skeleton-lines">
                <div class="skeleton-shimmer skeleton-line skeleton-line--title"></div>
                <div class="skeleton-shimmer skeleton-line skeleton-line--sub"></div>
              </div>
            </div>

            <!-- Secondary Columns -->
            @for (col of colList; track $index) {
              <div class="skeleton-cell">
                <div class="skeleton-shimmer skeleton-pill"></div>
              </div>
            }

            <!-- Action Buttons Column -->
            <div class="skeleton-cell cell-actions">
              <div class="skeleton-shimmer skeleton-btn"></div>
              <div class="skeleton-shimmer skeleton-btn"></div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      width: 100%;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      border-radius: inherit;
    }

    .skeleton-progress-bar {
      height: 3px;
      width: 100%;
      background: #f1f5f9;
      position: relative;
      overflow: hidden;
    }

    .skeleton-progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 45%;
      background: linear-gradient(90deg, #1e3a8a, #3b82f6, #60a5fa, #1e3a8a);
      background-size: 200% 100%;
      border-radius: 2px;
      animation: indeterminate 1.6s infinite ease-in-out, gradientShift 2s infinite linear;
    }

    .skeleton-rows {
      display: flex;
      flex-direction: column;
    }

    .skeleton-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid #f1f5f9;
      gap: 16px;
      animation: fadeInRow 0.25s ease-out both;
    }

    .skeleton-cell {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;

      &.cell-primary {
        flex: 2;
        gap: 12px;
      }

      &.cell-actions {
        flex: 0 0 80px;
        justify-content: flex-end;
        gap: 8px;
      }
    }

    .skeleton-lines {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    /* Modern Shimmer Effect */
    .skeleton-shimmer {
      background: linear-gradient(
        90deg,
        #f1f5f9 0%,
        #e2e8f0 35%,
        #f8fafc 65%,
        #f1f5f9 100%
      );
      background-size: 300% 100%;
      animation: shimmer 1.6s infinite cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 6px;
    }

    .skeleton-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .skeleton-line {
      height: 12px;
      border-radius: 4px;

      &--title {
        width: 75%;
        height: 14px;
      }

      &--sub {
        width: 45%;
        height: 10px;
      }
    }

    .skeleton-pill {
      height: 22px;
      width: 80px;
      border-radius: 12px;
    }

    .skeleton-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
    }

    @keyframes shimmer {
      0% { background-position: 100% 50%; }
      100% { background-position: 0 50%; }
    }

    @keyframes indeterminate {
      0% { left: -45%; width: 35%; }
      50% { left: 30%; width: 55%; }
      100% { left: 100%; width: 45%; }
    }

    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }

    @keyframes fadeInRow {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableSkeletonComponent {
  @Input() rows: number = 6;
  @Input() cols: number = 3;
  @Input() inline: boolean = false;

  get rowList(): number[] {
    return Array(Math.max(1, this.rows)).fill(0);
  }

  get colList(): number[] {
    return Array(Math.max(1, this.cols)).fill(0);
  }
}
