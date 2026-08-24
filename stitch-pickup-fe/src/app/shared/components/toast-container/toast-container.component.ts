import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Toast } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-label="Notificaciones">
      @for (toast of notifService.toasts(); track toast.id) {
        <div
          class="toast"
          [class]="'toast--' + toast.type"
          role="alert"
        >
          <span class="toast-icon">{{ getIcon(toast.type) }}</span>
          <p class="toast-msg">{{ toast.message }}</p>
          <button
            type="button"
            class="toast-close"
            (click)="notifService.dismiss(toast.id)"
            aria-label="Cerrar notificación"
          >✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: min(480px, 95vw);
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.22);
      backdrop-filter: blur(12px);
      pointer-events: all;
      animation: slideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1);
      font-family: 'Hanken Grotesk', sans-serif;
      font-size: 14px;
      font-weight: 600;

      &--success { background: rgba(22, 163, 74, 0.92); color: white; }
      &--error   { background: rgba(220, 38, 38, 0.92); color: white; }
      &--warning { background: rgba(217, 119, 6, 0.92); color: white; }
      &--info    { background: rgba(37, 99, 235, 0.92); color: white; }
      &--offline { background: rgba(100, 116, 139, 0.94); color: white; }
    }

    .toast-icon { font-size: 18px; flex-shrink: 0; }
    .toast-msg { flex: 1; margin: 0; line-height: 1.4; }
    .toast-close {
      background: none; border: none; color: rgba(255,255,255,0.7);
      font-size: 16px; cursor: pointer; flex-shrink: 0; padding: 2px;
      &:hover { color: white; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainerComponent {
  readonly notifService = inject(NotificationService);

  getIcon(type: Toast['type']): string {
    switch (type) {
      case 'success': return '✅';
      case 'error':   return '❌';
      case 'warning': return '⚠️';
      case 'info':    return '📍';
      case 'offline': return '📶';
      default:        return '🔔';
    }
  }
}
