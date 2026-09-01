import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * NotificationSoundService — Generates notification sounds and haptic feedback.
 *
 * Implements mobile AudioContext unlocking (iOS Safari / Android Chrome)
 * and haptic vibration for instant teacher awareness.
 */
@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private readonly platformId = inject(PLATFORM_ID);
  private audioContext: AudioContext | null = null;
  private isUnlocked = false;

  readonly soundEnabled = signal<boolean>(true);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupGlobalUnlockListeners();
    }
  }

  /**
   * Sets up touch/click listeners to permanently unlock AudioContext
   * on the first user interaction (standard iOS Safari / Chrome policy).
   */
  private setupGlobalUnlockListeners(): void {
    const unlockHandler = () => {
      this.unlockAudio();
      window.removeEventListener('touchstart', unlockHandler);
      window.removeEventListener('touchend', unlockHandler);
      window.removeEventListener('click', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
    };

    window.addEventListener('touchstart', unlockHandler, { passive: true });
    window.addEventListener('touchend', unlockHandler, { passive: true });
    window.addEventListener('click', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
  }

  public unlockAudio(): void {
    if (this.isUnlocked) return;

    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Play a tiny silent buffer to warm up iOS Audio pipeline
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      this.isUnlocked = true;
      console.info('[Sound] 🔊 AudioContext desbloqueado para móvil exitosamente.');
    } catch (e) {
      console.warn('[Sound] Error al desbloquear AudioContext:', e);
    }
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    return this.audioContext;
  }

  /**
   * Plays a pleasant notification chime (two rising tones) and vibrates.
   * Used for normal alerts: TEN_MIN, FIVE_MIN, EN_FILA.
   */
  playAlertSound(): void {
    if (!this.soundEnabled()) return;

    this.triggerHaptic([120, 60, 120]);

    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => this.triggerAlertTones(ctx));
      } else {
        this.triggerAlertTones(ctx);
      }
    } catch (e) {
      console.warn('[Sound] Could not play alert sound:', e);
    }
  }

  /**
   * Plays an urgent alarm sound (four rapid loud tones) and strong vibration.
   * Used for URGENTE alerts to grab teacher attention.
   */
  playUrgentSound(): void {
    if (!this.soundEnabled()) return;

    this.triggerHaptic([200, 100, 200, 100, 300]);

    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => this.triggerUrgentTones(ctx));
      } else {
        this.triggerUrgentTones(ctx);
      }
    } catch (e) {
      console.warn('[Sound] Could not play urgent sound:', e);
    }
  }

  /**
   * User-triggered test sound to verify mobile audio and vibration.
   */
  testSound(): void {
    this.unlockAudio();
    this.playAlertSound();
  }

  private triggerHaptic(pattern: number[]): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (err) {
        // Ignore vibration errors on non-supported platforms
      }
    }
  }

  private triggerAlertTones(ctx: AudioContext): void {
    // First tone - C5
    this.playTone(ctx, 523.25, 0, 0.15, 0.3);
    // Second tone - E5 (higher, pleasant resolution)
    this.playTone(ctx, 659.25, 0.15, 0.2, 0.25);
  }

  private triggerUrgentTones(ctx: AudioContext): void {
    // Four rapid urgent tones - alternating high/mid
    this.playTone(ctx, 880, 0, 0.12, 0.5);      // A5
    this.playTone(ctx, 698.46, 0.15, 0.12, 0.5); // F5
    this.playTone(ctx, 880, 0.30, 0.12, 0.5);    // A5
    this.playTone(ctx, 698.46, 0.45, 0.12, 0.5); // F5
  }

  /**
   * Generates a single sine wave tone at the given frequency.
   */
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

    // Fade in
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);

    // Fade out (prevents click)
    gainNode.gain.linearRampToValueAtTime(0, endTime);

    oscillator.start(startTime);
    oscillator.stop(endTime + 0.01);
  }
}
