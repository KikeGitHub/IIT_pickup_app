import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * WakeLockService — Screen Wake Lock API
 *
 * Mantiene encendida la pantalla del dispositivo móvil / tablet de los maestros
 * durante el horario de entrega en patio, impidiendo que el teléfono se suspenda o bloquee.
 *
 * Beneficios:
 * 1. La pantalla no se apaga sola mientras el maestro espera en el carril.
 * 2. La conexión WebSocket STOMP nunca se corta por suspensión del SO móvil.
 * 3. El AudioContext se mantiene despierto para emitir alertas y vibraciones inmediatamente.
 */
@Injectable({ providedIn: 'root' })
export class WakeLockService {
  private readonly platformId = inject(PLATFORM_ID);
  private wakeLockSentinel: any = null;
  private isRequested = false;
  private visibilityListener?: () => void;

  readonly isWakeLockActive = signal<boolean>(false);
  readonly isSupported = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId) && typeof navigator !== 'undefined') {
      this.isSupported.set('wakeLock' in navigator);
    }
  }

  /** Solicita mantener la pantalla encendida */
  async requestWakeLock(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !('wakeLock' in navigator)) return;

    this.isRequested = true;

    try {
      this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      this.isWakeLockActive.set(true);
      console.info('[WakeLock] 💡 Pantalla asegurada en modo activo (no se suspenderá en patio).');

      this.wakeLockSentinel.addEventListener('release', () => {
        this.isWakeLockActive.set(false);
        console.info('[WakeLock] 💤 WakeLock liberado.');
      });

      this.setupVisibilityReacquire();
    } catch (err) {
      console.warn('[WakeLock] No se pudo obtener el bloqueo de pantalla:', err);
      this.isWakeLockActive.set(false);
    }
  }

  /** Libera el bloqueo de pantalla cuando el maestro sale del monitor */
  releaseWakeLock(): void {
    this.isRequested = false;
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {}
      this.wakeLockSentinel = null;
      this.isWakeLockActive.set(false);
    }
    if (this.visibilityListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = undefined;
    }
  }

  /** Si el usuario minimiza y vuelve a la app, re-adquirir el WakeLock automáticamente */
  private setupVisibilityReacquire(): void {
    if (this.visibilityListener || typeof document === 'undefined') return;

    this.visibilityListener = () => {
      if (this.isRequested && document.visibilityState === 'visible' && !this.isWakeLockActive()) {
        this.requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityListener);
  }
}
