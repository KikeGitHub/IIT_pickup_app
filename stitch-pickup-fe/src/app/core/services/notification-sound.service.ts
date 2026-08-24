import { Injectable } from '@angular/core';

/**
 * NotificationSoundService — Generates notification sounds using the Web Audio API.
 *
 * No external .mp3 files needed. Synthesizes tones programmatically.
 * - playAlertSound(): short pleasant chime for new/updated alerts
 * - playUrgentSound(): louder, more insistent alarm for URGENTE status
 *
 * SOLID — S: Only handles sound generation.
 */
@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private audioContext: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Plays a pleasant notification chime (two rising tones).
   * Used for normal alerts: TEN_MIN, FIVE_MIN, EN_FILA.
   */
  playAlertSound(): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // First tone - C5
      this.playTone(ctx, 523.25, 0, 0.15, 0.3);
      // Second tone - E5 (higher, pleasant resolution)
      this.playTone(ctx, 659.25, 0.15, 0.2, 0.25);
    } catch (e) {
      console.warn('[Sound] Could not play alert sound:', e);
    }
  }

  /**
   * Plays an urgent alarm sound (rapid descending tones).
   * Used for URGENTE alerts to grab attention.
   */
  playUrgentSound(): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Three rapid urgent tones - descending
      this.playTone(ctx, 880, 0, 0.12, 0.5);      // A5
      this.playTone(ctx, 698.46, 0.15, 0.12, 0.5); // F5
      this.playTone(ctx, 880, 0.30, 0.12, 0.5);    // A5
      this.playTone(ctx, 698.46, 0.45, 0.12, 0.5); // F5
    } catch (e) {
      console.warn('[Sound] Could not play urgent sound:', e);
    }
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
