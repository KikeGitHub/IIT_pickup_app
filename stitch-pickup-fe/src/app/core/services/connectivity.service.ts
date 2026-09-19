import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { fromEvent, merge, Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith, takeUntil, distinctUntilChanged } from 'rxjs/operators';

export type NetworkSimulationMode = 'normal' | 'low_signal' | 'offline';

/**
 * ConnectivityService — Monitors network online/offline status and supports
 * testing simulations (e.g. low signal latency, forced offline).
 *
 * Uses browser's navigator.onLine + window events for reactive detection.
 * Exposes both Signal (for components) and Observable (for services).
 *
 * SOLID: Single Responsibility — connectivity detection & testing controls.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // ─── Network Simulation State ───────────────────────────────────────────────
  readonly simulationMode = signal<NetworkSimulationMode>(
    (typeof localStorage !== 'undefined' && (localStorage.getItem('iit_sim_network_mode') as NetworkSimulationMode)) || 'normal'
  );

  /** Latencia artificial inyectada en modo señal baja (ms) */
  readonly simulatedLatencyMs = signal<number>(2500);

  private readonly modeChange$ = new BehaviorSubject<NetworkSimulationMode>(this.simulationMode());

  // ─── Browser Native Online State ───────────────────────────────────────────
  private readonly _browserOnline = signal<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // ─── Effective Reactive Online State (combines browser + simulation) ────────
  readonly online = computed<boolean>(() => {
    if (this.simulationMode() === 'offline') {
      return false;
    }
    return this._browserOnline();
  });

  readonly isLowSignal = computed<boolean>(() => this.simulationMode() === 'low_signal');
  readonly isSimulatedOffline = computed<boolean>(() => this.simulationMode() === 'offline');

  /** Observable version for services that prefer RxJS */
  readonly online$: Observable<boolean> = combineLatest([
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).pipe(
      startWith(typeof navigator !== 'undefined' ? navigator.onLine : true)
    ),
    this.modeChange$
  ]).pipe(
    map(([browserOnline, simMode]) => {
      this._browserOnline.set(browserOnline);
      if (simMode === 'offline') {
        return false;
      }
      return browserOnline;
    }),
    distinctUntilChanged(),
    takeUntil(this.destroy$)
  );

  constructor() {
    this.online$.subscribe();
  }

  /** Synchronous check — safe to use in interceptors */
  isOnline(): boolean {
    return this.online();
  }

  isOffline(): boolean {
    return !this.online();
  }

  /**
   * Configura el modo de simulación de red:
   * - 'normal': Conexión real estándar
   * - 'low_signal': Agrega 2.5s de latencia en peticiones HTTP
   * - 'offline': Fuerza estado desconectado (dispara encolado y banner offline)
   */
  setSimulationMode(mode: NetworkSimulationMode): void {
    const previous = this.simulationMode();
    this.simulationMode.set(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('iit_sim_network_mode', mode);
    }
    this.modeChange$.next(mode);

    if (typeof window !== 'undefined') {
      if (mode === 'offline') {
        window.dispatchEvent(new Event('offline'));
      } else if (previous === 'offline') {
        window.dispatchEvent(new Event('online'));
      }
    }
  }

  resetSimulation(): void {
    this.setSimulationMode('normal');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
