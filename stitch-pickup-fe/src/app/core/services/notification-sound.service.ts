import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * NotificationSoundService — Genera sonidos de notificación, vibración háptica
 * y notificaciones del sistema para móviles (iOS Safari, Android Chrome, tablets).
 *
 * Implementa estrategia híbrida:
 * 1. Web Audio API con osciladores afinados.
 * 2. Elemento HTML5 Audio precargado y pre-desbloqueado con Data URI generado localmente.
 * 3. Vibración háptica con la API navigator.vibrate.
 * 4. Notificaciones del sistema con Web Notifications API para alertar con pantalla bloqueada o app en segundo plano.
 */
@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private readonly platformId = inject(PLATFORM_ID);
  private audioContext: AudioContext | null = null;
  private htmlAudioAlert: HTMLAudioElement | null = null;
  private htmlAudioUrgent: HTMLAudioElement | null = null;
  private isUnlocked = false;

  readonly soundEnabled = signal<boolean>(true);
  readonly audioUnlocked = signal<boolean>(false);
  readonly notificationsAllowed = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initHtmlAudioFallbacks();
      this.setupGlobalUnlockListeners();
      this.checkNotificationPermission();
    }
  }

  private initHtmlAudioFallbacks(): void {
    try {
      const alertWav = generateChimeWavDataUri(523.25, 659.25, 0.45);
      this.htmlAudioAlert = new Audio(alertWav);
      this.htmlAudioAlert.preload = 'auto';

      const urgentWav = generateChimeWavDataUri(880, 698.46, 0.55);
      this.htmlAudioUrgent = new Audio(urgentWav);
      this.htmlAudioUrgent.preload = 'auto';
    } catch (e) {
      console.warn('[Sound] Fallback HTML Audio initialization error:', e);
    }
  }

  /**
   * Listeners globales en la primera interacción (touch / click) para desbloquear
   * permanentemente la tubería de audio en iOS y Android.
   */
  private setupGlobalUnlockListeners(): void {
    if (!isPlatformBrowser(this.platformId) || this.isUnlocked) return;

    const unlockHandler = () => {
      this.unlockAudio();
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('touchstart', unlockHandler);
      window.removeEventListener('touchend', unlockHandler);
      window.removeEventListener('click', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
    };

    window.addEventListener('touchstart', unlockHandler, { passive: true, once: true });
    window.addEventListener('touchend', unlockHandler, { passive: true, once: true });
    window.addEventListener('click', unlockHandler, { passive: true, once: true });
    window.addEventListener('keydown', unlockHandler, { passive: true, once: true });
  }

  public unlockAudio(): void {
    if (!isPlatformBrowser(this.platformId) || this.isUnlocked) return;

    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Buffer de 1 muestra completamente silencioso para desbloquear el hardware de audio sin sonido audible
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      this.isUnlocked = true;
      this.audioUnlocked.set(true);
    } catch (e) {
      console.warn('[Sound] Error al desbloquear AudioContext:', e);
    }
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    return this.audioContext;
  }

  /**
   * Reproduce el sonido de alerta normal (dos tonos ascendentes) y hace vibrar el dispositivo.
   */
  playAlertSound(): void {
    if (!this.soundEnabled()) return;

    // 1. Vibración háptica
    this.triggerHaptic([150, 80, 150]);

    // 2. Web Audio API
    let webAudioSuccess = false;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'running') {
        this.triggerAlertTones(ctx);
        webAudioSuccess = true;
      } else if (ctx.state === 'suspended') {
        ctx.resume().then(() => this.triggerAlertTones(ctx)).catch(() => {});
        webAudioSuccess = true;
      }
    } catch (e) {
      console.warn('[Sound] Web Audio failed, trying HTML5 audio fallback:', e);
    }

    // 3. Fallback HTML5 Audio solo si Web Audio falló
    if (!webAudioSuccess && this.htmlAudioAlert) {
      try {
        this.htmlAudioAlert.currentTime = 0;
        this.htmlAudioAlert.volume = 1.0;
        this.htmlAudioAlert.play().catch(() => {});
      } catch (err) {
        // Ignorar si el navegador bloquea
      }
    }
  }

  /**
   * Reproduce el sonido urgente (cuatro tonos de alarma rápidos) y vibración intensa.
   */
  playUrgentSound(): void {
    if (!this.soundEnabled()) return;

    // 1. Vibración háptica intensa
    this.triggerHaptic([300, 100, 300, 100, 500]);

    // 2. Web Audio API
    let webAudioSuccess = false;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'running') {
        this.triggerUrgentTones(ctx);
        webAudioSuccess = true;
      } else if (ctx.state === 'suspended') {
        ctx.resume().then(() => this.triggerUrgentTones(ctx)).catch(() => {});
        webAudioSuccess = true;
      }
    } catch (e) {
      console.warn('[Sound] Web Audio urgent tones failed:', e);
    }

    // 3. Fallback HTML5 Audio solo si Web Audio falló
    if (!webAudioSuccess && this.htmlAudioUrgent) {
      try {
        this.htmlAudioUrgent.currentTime = 0;
        this.htmlAudioUrgent.volume = 1.0;
        this.htmlAudioUrgent.play().catch(() => {});
      } catch (err) {
        // Ignorar si el navegador bloquea
      }
    }
  }

  /**
   * Solicita permisos y emite una notificación del sistema operativo con sonido y vibración.
   * Muy útil cuando el maestro o padre tiene el teléfono con la app en segundo plano.
   */
  async notifyWithVibration(title: string, body: string, tag?: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    // Vibrar y sonar localmente
    this.playAlertSound();

    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const res = await Notification.requestPermission();
          this.notificationsAllowed.set(res === 'granted');
        } catch {
          // Ignorar
        }
      }

      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/logo_IIT.jpg',
            tag: tag || 'iit-pickup-alert',
            ...({ vibrate: [300, 100, 300, 100, 500] } as any)
          });
        } catch (err) {
          console.warn('[Notification] Could not show native notification:', err);
        }
      }
    }
  }

  private checkNotificationPermission(): void {
    if ('Notification' in window) {
      this.notificationsAllowed.set(Notification.permission === 'granted');
    }
  }

  /**
   * Prueba de sonido iniciada explícitamente por el usuario para validar celular/tablet.
   */
  async testSound(): Promise<void> {
    this.unlockAudio();
    this.playAlertSound();

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const res = await Notification.requestPermission();
          this.notificationsAllowed.set(res === 'granted');
        } catch {
          // Ignorar
        }
      }

      if (Notification.permission === 'granted') {
        try {
          new Notification('🔊 IIT Pickup — Prueba de Alerta', {
            body: '¡Sonido, vibración y notificaciones listos en tu dispositivo!',
            icon: '/logo_IIT.jpg',
            tag: 'test-sound'
          });
        } catch {
          // Ignorar
        }
      }
    }
  }

  private triggerHaptic(pattern: number[]): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignorar si el dispositivo no soporta vibración
      }
    }
  }

  private triggerAlertTones(ctx: AudioContext): void {
    this.playTone(ctx, 523.25, 0, 0.15, 0.35); // C5
    this.playTone(ctx, 659.25, 0.14, 0.22, 0.3); // E5
  }

  private triggerUrgentTones(ctx: AudioContext): void {
    this.playTone(ctx, 880, 0, 0.12, 0.5);       // A5
    this.playTone(ctx, 698.46, 0.15, 0.12, 0.5);  // F5
    this.playTone(ctx, 880, 0.30, 0.12, 0.5);    // A5
    this.playTone(ctx, 698.46, 0.45, 0.12, 0.5);  // F5
  }

  private playTone(
    ctx: AudioContext,
    frequency: number,
    startDelay: number,
    duration: number,
    volume: number
  ): void {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const startTime = ctx.currentTime + startDelay;
    const endTime = startTime + duration;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, endTime);

    oscillator.start(startTime);
    oscillator.stop(endTime + 0.01);
  }
}

/**
 * Genera un Data URI base64 con un archivo WAV PCM real de 16 bits en mono.
 */
function generateChimeWavDataUri(freq1: number, freq2: number, duration: number): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16 bits
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  const splitT = duration * 0.4;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    if (t < splitT) {
      sample = Math.sin(2 * Math.PI * freq1 * t) * (1 - t / splitT) * 0.55;
    } else {
      const t2 = t - splitT;
      sample = Math.sin(2 * Math.PI * freq2 * t2) * Math.exp(-t2 * 5) * 0.75;
    }
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
