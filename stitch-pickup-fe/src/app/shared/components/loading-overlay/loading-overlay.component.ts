import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-backdrop" *ngIf="active" [class.loading-backdrop--inline]="inline">
      <div class="loading-card">
        <div class="spinner-ring">
          <div></div><div></div><div></div><div></div>
        </div>
        <div class="loading-content">
          <h4 class="loading-title">{{ title || 'Procesando...' }}</h4>
          <p class="loading-desc" *ngIf="message">{{ message }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.15s ease-out;
      user-select: none;

      &--inline {
        position: absolute;
        border-radius: inherit;
        z-index: 50;
      }
    }

    .loading-card {
      background: #ffffff;
      padding: 24px 32px;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      min-width: 240px;
      max-width: 90vw;
      text-align: center;
      border: 1px solid rgba(226, 232, 240, 0.8);
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .loading-title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    .loading-desc {
      margin: 0;
      font-size: 12px;
      color: #64748b;
    }

    /* Dual ring modern spinner */
    .spinner-ring {
      display: inline-block;
      position: relative;
      width: 48px;
      height: 48px;

      div {
        box-sizing: border-box;
        display: block;
        position: absolute;
        width: 40px;
        height: 40px;
        margin: 4px;
        border: 4px solid #2563eb;
        border-radius: 50%;
        animation: spinnerRing 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        border-color: #2563eb transparent transparent transparent;

        &:nth-child(1) { animation-delay: -0.45s; }
        &:nth-child(2) { animation-delay: -0.3s; }
        &:nth-child(3) { animation-delay: -0.15s; }
      }
    }

    @keyframes spinnerRing {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingOverlayComponent {
  @Input() active: boolean = false;
  @Input() title: string = 'Cargando...';
  @Input() message: string = '';
  @Input() inline: boolean = false;
}
