import { Injectable, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'offline';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;    // ms, default 4000
  action?: {
    label: string;
    callback: () => void;
  };
}

/**
 * NotificationService — In-app toast notification manager.
 *
 * Used throughout the app for user feedback (alert sent, offline, errors).
 * Toast component subscribes to this service.
 *
 * SOLID: S — only manages notifications, no HTTP, no auth.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private readonly toast$ = new Subject<Toast>();

  // ─── Public API ─────────────────────────────────────────────────────────────

  success(message: string, duration = 5500): void {
    this.show({ type: 'success', message, duration });
  }

  error(message: string, duration = 7500): void {
    this.show({ type: 'error', message, duration });
  }

  warning(message: string, duration = 6500): void {
    this.show({ type: 'warning', message, duration });
  }

  info(message: string, duration = 5500): void {
    this.show({ type: 'info', message, duration });
  }

  offline(message = 'Sin conexión. La alerta se enviará al recuperar señal.'): void {
    this.show({ type: 'offline', message, duration: 7000 });
  }

  dismiss(id: string): void {
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  getToastStream(): Observable<Toast> {
    return this.toast$.asObservable();
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private show(config: Omit<Toast, 'id'>): void {
    const toast: Toast = {
      ...config,
      id: crypto.randomUUID(),
    };

    this._toasts.update((toasts) => [...toasts, toast]);
    this.toast$.next(toast);

    // Auto-dismiss after duration (default 5.5s to allow reading on Android / iOS)
    const duration = config.duration ?? 5500;
    setTimeout(() => {
      this.dismiss(toast.id);
    }, duration);
  }
}
