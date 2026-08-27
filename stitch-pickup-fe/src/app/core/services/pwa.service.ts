import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private readonly platformId = inject(PLATFORM_ID);
  private deferredPrompt: any = null;

  // Reactive state signals
  readonly canInstall = signal<boolean>(false);
  readonly isInstalled = signal<boolean>(false);
  readonly isIOS = signal<boolean>(false);
  readonly showIOSGuide = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkIfInstalled();
      this.checkIfIOS();
      this.listenToBeforeInstallPrompt();
    }
  }

  private checkIfInstalled(): void {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    this.isInstalled.set(isStandalone);
  }

  private checkIfIOS(): void {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    this.isIOS.set(isIosDevice);
  }

  private listenToBeforeInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // Prevenir el banner por defecto del navegador para usar nuestra UI institucional
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall.set(true);
      console.info('[PWA] 📲 Evento beforeinstallprompt capturado. La aplicación es instalable.');
    });

    window.addEventListener('appinstalled', () => {
      console.info('[PWA] 🎉 Aplicación instalada exitosamente.');
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.isInstalled.set(true);
    });
  }

  async installApp(): Promise<boolean> {
    if (this.isIOS()) {
      this.showIOSGuide.set(true);
      return false;
    }

    if (!this.deferredPrompt) {
      console.warn('[PWA] No hay evento de instalación pendiente en el navegador.');
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      console.info('[PWA] Elección de instalación del usuario:', choiceResult.outcome);

      this.deferredPrompt = null;
      this.canInstall.set(false);

      return choiceResult.outcome === 'accepted';
    } catch (err) {
      console.error('[PWA] Error al disparar diálogo de instalación:', err);
      return false;
    }
  }

  toggleIOSGuide(show?: boolean): void {
    this.showIOSGuide.set(show !== undefined ? show : !this.showIOSGuide());
  }
}
