import { Injectable, signal, OnDestroy } from '@angular/core';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
import { map, startWith, takeUntil, distinctUntilChanged } from 'rxjs/operators';

/**
 * ConnectivityService — Monitors network online/offline status.
 *
 * Uses browser's navigator.onLine + window events for reactive detection.
 * Exposes both Signal (for components) and Observable (for services).
 *
 * SOLID: Single Responsibility — only handles connectivity detection.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // ─── Reactive State ─────────────────────────────────────────────────────────
  private _isOnline = signal<boolean>(navigator.onLine);

  readonly online = this._isOnline.asReadonly();

  /** Observable version for services that prefer RxJS */
  readonly online$: Observable<boolean> = merge(
    fromEvent(window, 'online').pipe(map(() => true)),
    fromEvent(window, 'offline').pipe(map(() => false))
  ).pipe(
    startWith(navigator.onLine),
    distinctUntilChanged(),
    takeUntil(this.destroy$)
  );

  constructor() {
    // Keep the signal in sync with the observable
    this.online$.subscribe((online) => {
      this._isOnline.set(online);
    });
  }

  /** Synchronous check — safe to use in interceptors */
  isOnline(): boolean {
    return this._isOnline();
  }

  isOffline(): boolean {
    return !this._isOnline();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
