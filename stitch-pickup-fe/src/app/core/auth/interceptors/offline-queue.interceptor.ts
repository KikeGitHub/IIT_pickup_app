import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { OfflineQueueService } from '../../services/offline-queue.service';
import { ConnectivityService } from '../../services/connectivity.service';

/**
 * Offline Queue Interceptor — Captures failed requests due to connectivity
 * and enqueues them in IndexedDB for retry via Background Sync.
 *
 * IMPORTANT: Only intercepts WRITE operations (POST/PUT/DELETE) to /api/v1/alerts
 * This is the core of the offline-first architecture.
 */
export const offlineQueueInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const offlineQueue = inject(OfflineQueueService);
  const connectivity = inject(ConnectivityService);

  // Only queue alert POST requests when offline
  const isAlertEndpoint = req.url.includes('/api/v1/alerts') && req.method === 'POST';

  if (isAlertEndpoint && !connectivity.isOnline()) {
    // Enqueue in IndexedDB and return a synthetic success response
    return from(offlineQueue.enqueueRequest(req)).pipe(
      switchMap(() => {
        // Return a synthetic response to keep the UI flow going
        throw new HttpErrorResponse({
          status: 0,
          statusText: 'QUEUED_OFFLINE',
          error: { queued: true, message: 'Alerta en cola. Se enviará al recuperar señal.' },
        });
      })
    );
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Network error (status 0) on alert endpoints → queue it
      if (error.status === 0 && isAlertEndpoint) {
        return from(offlineQueue.enqueueRequest(req)).pipe(
          switchMap(() => throwError(() => ({ ...error, queued: true })))
        );
      }
      return throwError(() => error);
    })
  );
};
