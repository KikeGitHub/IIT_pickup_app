import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ConnectivityService } from '../../services/connectivity.service';

/**
 * JWT Interceptor — Attaches Bearer token to every outgoing request
 * that targets the API base URL.
 * Also injects simulated network latency when "Señal Baja" mode is active.
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const connectivity = inject(ConnectivityService);
  const token = authService.getToken();

  let clonedReq = req;
  // Only attach token for API requests
  if (token && req.url.includes('/api/')) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  const response$ = next(clonedReq);

  // Inyectar latencia artificial si está activo el modo de prueba con Señal Baja
  if (connectivity.isLowSignal()) {
    return response$.pipe(delay(connectivity.simulatedLatencyMs()));
  }

  return response$;
};
