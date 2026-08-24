import { Injectable, signal, computed } from '@angular/core';
import { HttpRequest } from '@angular/common/http';
import { openDB, IDBPDatabase } from 'idb';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface QueuedAlertRequest {
  id: string;          // UUID — same as clientId for deduplication
  url: string;
  method: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'stitch-pickup-offline';
const DB_VERSION = 1;
const STORE_NAME = 'alert-queue';

/**
 * OfflineQueueService — IndexedDB persistence + retry queue for alerts.
 *
 * Architecture (ADR-002):
 * 1. Alert is enqueued with a client_id UUID (deduplication key)
 * 2. When online, processQueue() is called and items are sent to the server
 * 3. On success, item is removed from the queue
 * 4. Server uses client_id to reject duplicates (idempotent endpoint)
 *
 * SOLID:
 * - S: Only handles queue persistence and processing
 * - O: Can swap storage backend without touching caller code
 * - D: Injected as interface (IOfflineQueueService)
 */
@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private db: IDBPDatabase | null = null;
  private readonly _queuedCount = new BehaviorSubject<number>(0);

  readonly queuedCount$ = this._queuedCount.asObservable();
  readonly queuedCount = signal(0);

  constructor(private readonly http: HttpClient) {
    this.initDb();
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  async enqueueRequest(req: HttpRequest<unknown>): Promise<string> {
    const db = await this.getDb();
    const clientId = crypto.randomUUID();

    const queued: QueuedAlertRequest = {
      id: clientId,
      url: req.url,
      method: req.method,
      body: (req.body as Record<string, unknown>) ?? {},
      headers: this.extractHeaders(req),
      timestamp: Date.now(),
      retryCount: 0,
    };

    // Inject clientId into the body for server-side deduplication
    queued.body = { ...queued.body, clientId };

    await db.add(STORE_NAME, queued);
    await this.updateCount();

    return clientId;
  }

  async processQueue(): Promise<void> {
    const db = await this.getDb();
    const items = await db.getAll(STORE_NAME);

    for (const item of items) {
      try {
        await this.sendItem(item);
        await db.delete(STORE_NAME, item.id);
      } catch (err) {
        // Increment retry count
        await db.put(STORE_NAME, { ...item, retryCount: item.retryCount + 1 });
        console.warn(`[OfflineQueue] Retry ${item.retryCount + 1} failed for ${item.id}`);
      }
    }

    await this.updateCount();
  }

  getQueuedCount(): Observable<number> {
    return this.queuedCount$;
  }

  async clearQueue(): Promise<void> {
    const db = await this.getDb();
    await db.clear(STORE_NAME);
    await this.updateCount();
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async initDb(): Promise<void> {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
    await this.updateCount();
  }

  private async getDb(): Promise<IDBPDatabase> {
    if (!this.db) {
      await this.initDb();
    }
    return this.db!;
  }

  private async updateCount(): Promise<void> {
    try {
      const db = await this.getDb();
      const count = await db.count(STORE_NAME);
      this._queuedCount.next(count);
      this.queuedCount.set(count);
    } catch { /* ignore */ }
  }

  private sendItem(item: QueuedAlertRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('sp_jwt');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      this.http
        .post(item.url, item.body, { headers })
        .subscribe({ next: resolve, error: reject });
    });
  }

  private extractHeaders(req: HttpRequest<unknown>): Record<string, string> {
    const headers: Record<string, string> = {};
    req.headers.keys().forEach((key) => {
      headers[key] = req.headers.get(key) ?? '';
    });
    return headers;
  }
}
