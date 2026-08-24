import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConnectivityService } from './core/services/connectivity.service';
import { OfflineQueueService } from './core/services/offline-queue.service';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly connectivity = inject(ConnectivityService);
  private readonly offlineQueue = inject(OfflineQueueService);
  private readonly auth = inject(AuthService);
  private readonly ws = inject(WebSocketService);

  ngOnInit(): void {
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
