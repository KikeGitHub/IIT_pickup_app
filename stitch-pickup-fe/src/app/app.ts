import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ConnectivityService } from './core/services/connectivity.service';
import { OfflineQueueService } from './core/services/offline-queue.service';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { setPreferredPortal, syncPortalManifestAndTheme } from './core/auth/portal-preference';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly connectivity = inject(ConnectivityService);
  private readonly offlineQueue = inject(OfflineQueueService);
  private readonly auth = inject(AuthService);
  private readonly ws = inject(WebSocketService);

  ngOnInit(): void {
    // Dynamically sync manifest, title, and storage on portal navigation
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects || event.url;
        if (
          url.includes('/auth/maestros') ||
          url.includes('/monitor') ||
          url.includes('/teacher') ||
          url.includes('/admin')
        ) {
          setPreferredPortal('teacher');
          syncPortalManifestAndTheme('teacher');
        } else if (url.includes('/auth/login') || url.includes('/parent')) {
          setPreferredPortal('parent');
          syncPortalManifestAndTheme('parent');
        }
      });

    // When connectivity is restored → process the offline queue
    this.connectivity.online$.subscribe((isOnline) => {
      if (isOnline) {
        this.offlineQueue.processQueue();
      }
    });

    // If user is already authenticated → connect WebSocket
    if (this.auth.isAuthenticated()) {
      const token = this.auth.getToken();
      if (token) {
        this.ws.connect(token);
      }
    }
  }
}
