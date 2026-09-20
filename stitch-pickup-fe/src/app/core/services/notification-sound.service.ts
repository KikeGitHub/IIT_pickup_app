import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * NotificationSoundService — Motor de audio acústico profesional para IIT Pickup.
 *
 * Características de audio de alta fidelidad:
 * 1. Acústica armónica: síntesis con armónico cálido secundario y filtro pasa-bajos (cálido, similar a chimes de Apple / iOS / macOS).
 * 2. Cero pops / clics: envolventes de ataque suave (12ms) y decaimiento exponencial natural sin cortes abruptos.
 * 3. Prevención de colisiones: reproducción exclusiva (no solapa Web Audio con HTML5 Audio).
 * 4. Respaldo HTML5 en alta calidad (44.1 kHz, 16-bit PCM WAV) para navegadores que bloquean Web Audio.
 * 5. Vibración háptica sincronizada en dispositivos móviles.
 */
@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private readonly platformId = inject(PLATFORM_ID);
  private audioContext: AudioContext | null = null;
  private htmlAudioAlert: HTMLAudioElement | null = null;
  private htmlAudioUrgent: HTMLAudioElement | null = null;
  private isUnlocked = false;
  private lastPlayTimestamp = 0;

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
      const alertWav = generateChimeWavDataUri('alert');
      this.htmlAudioAlert = new Audio(alertWav);
      this.htmlAudioAlert.preload = 'auto';

      const urgentWav = generateChimeWavDataUri('urgent');
      this.htmlAudioUrgent = new Audio(urgentWav);
      this.htmlAudioUrgent.preload = 'auto';
    } catch (e) {
      console.warn('[Sound] Fallback HTML Audio initialization error:', e);
    }
  }

  /**
   * Listeners globales en la primera interacción (touch / click) para desbloquear
   * la tubería de audio en iOS Safari y Android.
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
        ctx.resume().catch(() => {});
      }

      // Micro-buffer silencioso para despertar el hardware de audio sin ruido
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      // Desbloquear elementos HTML5 Audio en iOS de forma 100% silenciosa
      if (this.htmlAudioAlert) {
        const prevVol = this.htmlAudioAlert.volume;
        this.htmlAudioAlert.volume = 0;
        this.htmlAudioAlert.play().then(() => {
          this.htmlAudioAlert?.pause();
          if (this.htmlAudioAlert) {
            this.htmlAudioAlert.currentTime = 0;
            this.htmlAudioAlert.volume = prevVol || 1.0;
          }
        }).catch(() => {
          if (this.htmlAudioAlert) this.htmlAudioAlert.volume = prevVol || 1.0;
        });
      }
      if (this.htmlAudioUrgent) {
        const prevVol = this.htmlAudioUrgent.volume;
        this.htmlAudioUrgent.volume = 0;
        this.htmlAudioUrgent.play().then(() => {
          this.htmlAudioUrgent?.pause();
          if (this.htmlAudioUrgent) {
            this.htmlAudioUrgent.currentTime = 0;
            this.htmlAudioUrgent.volume = prevVol || 1.0;
          }
        }).catch(() => {
          if (this.htmlAudioUrgent) this.htmlAudioUrgent.volume = prevVol || 1.0;
        });
      }

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
   * Reproduce el sonido de alerta normal (Chime profesional suave ascendente: G5 -> C6).
   */
  playAlertSound(): void {
    if (!this.soundEnabled()) return;

    // Debounce ligero para evitar sonidos empalmados si llegan 2 alertas en el mismo milisegundo
    const now = Date.now();
    if (now - this.lastPlayTimestamp < 180) return;
    this.lastPlayTimestamp = now;

    // Vibración háptica suave
    this.triggerHaptic([100, 50, 100]);

    // Intentar Web Audio API
    try {
      const ctx = this.getContext();
      if (ctx.state === 'running') {
        this.triggerAlertTones(ctx);
        return;
      } else if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          if (ctx.state === 'running') {
            this.triggerAlertTones(ctx);
          } else {
            this.playHtmlAudio(this.htmlAudioAlert);
          }
        }).catch(() => {
          this.playHtmlAudio(this.htmlAudioAlert);
        });
        return;
      }
    } catch (e) {
      console.warn('[Sound] Web Audio failed, falling back to HTML5 audio:', e);
    }

    // Fallback HTML5 Audio exclusivo si Web Audio no estaba disponible
    this.playHtmlAudio(this.htmlAudioAlert);
  }

  /**
   * Reproduce el sonido urgente (Arpegio mayor enérgico pero suave: A5 -> C#6 -> E6).
   */
  playUrgentSound(): void {
    if (!this.soundEnabled()) return;

    const now = Date.now();
    if (now - this.lastPlayTimestamp < 180) return;
    this.lastPlayTimestamp = now;

    // Vibración háptica de prioridad
    this.triggerHaptic([200, 80, 200, 80, 350]);

    try {
      const ctx = this.getContext();
      if (ctx.state === 'running') {
        this.triggerUrgentTones(ctx);
        return;
      } else if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          if (ctx.state === 'running') {
            this.triggerUrgentTones(ctx);
          } else {
            this.playHtmlAudio(this.htmlAudioUrgent);
          }
        }).catch(() => {
          this.playHtmlAudio(this.htmlAudioUrgent);
        });
        return;
      }
    } catch (e) {
      console.warn('[Sound] Web Audio urgent failed, falling back to HTML5 audio:', e);
    }

    this.playHtmlAudio(this.htmlAudioUrgent);
  }

  private playHtmlAudio(audioEl: HTMLAudioElement | null): void {
    if (!audioEl) return;
    try {
      audioEl.currentTime = 0;
      audioEl.volume = 1.0;
      audioEl.play().catch((err) => {
        console.warn('[Sound] HTML Audio play error:', err);
      });
    } catch (err) {}
  }

  /**
   * Emite una notificación nativa del sistema operativo y vibración (sin duplicar sonido de audio).
   */
  async notifyWithVibration(title: string, body: string, tag?: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const res = await Notification.requestPermission();
          this.notificationsAllowed.set(res === 'granted');
        } catch {}
      }

      if (Notification.permission === 'granted') {
        try {
          const n = new Notification(title, {
            body,
            icon: '/logo_IIT.jpg',
            tag: tag || 'iit-pickup-alert',
            ...({ vibrate: [200, 80, 200] } as any)
          });
          // Mantener visible al menos 6 segundos en Android/Chrome
          setTimeout(() => {
            try { n.close(); } catch {}
          }, 6000);
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
        } catch {}
      }

      if (Notification.permission === 'granted') {
        try {
          new Notification('🔊 IIT Pickup — Prueba de Alerta', {
            body: '¡Sonido profesional, vibración y notificaciones listos en tu dispositivo!',
            icon: '/logo_IIT.jpg',
            tag: 'test-sound'
          });
        } catch {}
      }
    }
  }

  private triggerHaptic(pattern: number[]): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  /**
   * Alerta Normal: Chime armónico de 2 notas (G5: 783.99 Hz -> C6: 1046.50 Hz)
   * Timbre cristalino, suave, profesional y sin asperezas.
   */
  private triggerAlertTones(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Nota 1: G5 cálido
    this.playHarmonicChime(ctx, 783.99, now, 0.35, 0.35);
    // Nota 2: C6 brillante (inicia a los 120ms para un arpegio fluido)
    this.playHarmonicChime(ctx, 1046.50, now + 0.12, 0.45, 0.42);
  }

  /**
   * Alerta Urgente: Arpegio mayor ascendente de 3 notas (A5 -> C#6 -> E6 + eco de brillo)
   * Notable y de alta prioridad pero musical, pulido y agradable.
   */
  private triggerUrgentTones(ctx: AudioContext): void {
    const now = ctx.currentTime;
    this.playHarmonicChime(ctx, 880.00, now, 0.20, 0.35);
    this.playHarmonicChime(ctx, 1108.73, now + 0.11, 0.20, 0.38);
    this.playHarmonicChime(ctx, 1318.51, now + 0.22, 0.38, 0.45);
    this.playHarmonicChime(ctx, 1318.51, now + 0.38, 0.30, 0.38);
  }

  /**
   * Síntesis acústica armónica en Web Audio API:
   * - Oscilador fundamental senoidal puro
   * - Armónico secundario (2x frecuencia) al 18% para calidez
   * - Filtro pasa-bajos analógico para eliminar estridencias
   * - Envolvente exponencial sin chasquidos / clics
   */
  private playHarmonicChime(
    ctx: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    peakVolume: number
  ): void {
    try {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(frequency, startTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(frequency * 2, startTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(frequency * 3.5, 4200), startTime);

      const masterGain = ctx.createGain();
      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.18, startTime);

      // Envolvente de volumen: ataque suave de 12ms y decaimiento exponencial natural
      masterGain.gain.setValueAtTime(0.0001, startTime);
      masterGain.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.012);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.connect(masterGain);
      osc2.connect(overtoneGain);
      overtoneGain.connect(masterGain);
      masterGain.connect(filter);
      filter.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration + 0.05);
      osc2.stop(startTime + duration + 0.05);
    } catch (e) {
      console.warn('[Sound] Error in playHarmonicChime:', e);
    }
  }
}

/**
 * Genera un Data URI base64 con un archivo WAV PCM real de 16 bits a 44,100 Hz (Calidad CD).
 * Totalmente continuo, sin saltos de fase y con envolventes armónicas orgánicas.
 */
function generateChimeWavDataUri(type: 'alert' | 'urgent'): string {
  const sampleRate = 44100;
  const duration = type === 'urgent' ? 0.75 : 0.55;
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

  if (type === 'alert') {
    // Chime armónico de 2 notas (G5: 783.99 Hz -> C6: 1046.50 Hz)
    const n1Start = 0;
    const n2Start = 0.12;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      if (t >= n1Start) {
        const dt1 = t - n1Start;
        const env1 = Math.min(dt1 / 0.012, 1) * Math.exp(-dt1 * 8.0);
        sample += (Math.sin(2 * Math.PI * 783.99 * dt1) + 0.18 * Math.sin(2 * Math.PI * 1567.98 * dt1)) * env1 * 0.40;
      }

      if (t >= n2Start) {
        const dt2 = t - n2Start;
        const env2 = Math.min(dt2 / 0.012, 1) * Math.exp(-dt2 * 5.5);
        sample += (Math.sin(2 * Math.PI * 1046.50 * dt2) + 0.16 * Math.sin(2 * Math.PI * 2093.00 * dt2)) * env2 * 0.50;
      }

      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(44 + i * 2, intSample, true);
    }
  } else {
    // Alerta urgente: Arpegio mayor dinámico (A5: 880Hz, C#6: 1108.7Hz, E6: 1318.5Hz)
    const notes = [
      { start: 0.00, freq: 880.00, decay: 9.5, vol: 0.35 },
      { start: 0.11, freq: 1108.73, decay: 9.5, vol: 0.38 },
      { start: 0.22, freq: 1318.51, decay: 7.0, vol: 0.45 },
      { start: 0.38, freq: 1318.51, decay: 6.0, vol: 0.40 }
    ];

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      for (const n of notes) {
        if (t >= n.start) {
          const dt = t - n.start;
          const env = Math.min(dt / 0.012, 1) * Math.exp(-dt * n.decay);
          sample += (Math.sin(2 * Math.PI * n.freq * dt) + 0.18 * Math.sin(2 * Math.PI * (n.freq * 2) * dt)) * env * n.vol;
        }
      }
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(44 + i * 2, intSample, true);
    }
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
