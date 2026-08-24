import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/interceptors/jwt.interceptor';
import { offlineQueueInterceptor } from './core/auth/interceptors/offline-queue.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    // ── Router ───────────────────────────────────────────────────────────────
    provideRouter(
      routes,
      withComponentInputBinding(),        // Route params as @Input()
      withViewTransitions()               // Smooth page transitions
    ),

    // ── HTTP Client + Interceptors ───────────────────────────────────────────
    provideHttpClient(
      withInterceptors([
        jwtInterceptor,            // Attaches Bearer token
        offlineQueueInterceptor,   // Queues alerts when offline
      ])
    ),

    // ── Service Worker (PWA) ─────────────────────────────────────────────────
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
