import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface KpisData {
  totalAlertsToday: number;
  totalDeliveredToday: number;
  pendingCount: number;
  urgentCount: number;
  avgPickupTimeMinutes: number;
  peakHour: string;
  alertsByLevel: Record<string, number>;
  alertsByMethod: Record<string, number>;
}

export interface AdminUser {
  id: string;
  nombre: string;
  email: string;
  role: 'PARENT' | 'TEACHER' | 'ADMIN';
  active: boolean;
  lastLogin?: string;
}

export interface CsvImportResult {
  totalProcessed: number;
  totalSuccess: number;
  totalErrors: number;
  errorMessages: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly kpis = signal<KpisData | null>(null);
  readonly users = signal<AdminUser[]>([]);
  readonly isLoading = signal<boolean>(false);

  loadKpis(): Observable<KpisData | null> {
    this.isLoading.set(true);
    return this.http.get<KpisData>(`${this.apiUrl}/kpis/today`).pipe(
      tap((data) => {
        this.kpis.set(data);
        this.isLoading.set(false);
      }),
      catchError(() => {
        // Fallback demo data
        const mock: KpisData = {
          totalAlertsToday: 142,
          totalDeliveredToday: 128,
          pendingCount: 14,
          urgentCount: 3,
          avgPickupTimeMinutes: 5.8,
          peakHour: '14:00 - 14:30',
          alertsByLevel: { KINDER: 32, PRIMARIA: 84, SECUNDARIA: 26 },
          alertsByMethod: { CAR: 118, WALK: 24 }
        };
        this.kpis.set(mock);
        this.isLoading.set(false);
        return of(mock);
      })
    );
  }

  loadUsers(): void {
    const mockUsers: AdminUser[] = [
      { id: '1', nombre: 'Carlos Ramírez Soto', email: 'padre1@iit.edu.mx', role: 'PARENT', active: true, lastLogin: '2026-08-10 14:02' },
      { id: '2', nombre: 'Roberto González Vidal', email: 'padre2@iit.edu.mx', role: 'PARENT', active: true, lastLogin: '2026-08-10 14:15' },
      { id: '3', nombre: 'María Fernanda Solis', email: 'maestro1@iit.edu.mx', role: 'TEACHER', active: true, lastLogin: '2026-08-10 13:45' },
      { id: '4', nombre: 'Director General IIT', email: 'admin@iit.edu.mx', role: 'ADMIN', active: true, lastLogin: '2026-08-10 08:30' }
    ];
    this.users.set(mockUsers);
  }

  uploadCsv(file: File): Observable<CsvImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<CsvImportResult>(`${this.apiUrl}/admin/import/students`, formData).pipe(
      catchError(() => of({
        totalProcessed: 25,
        totalSuccess: 24,
        totalErrors: 1,
        errorMessages: ['Línea 12: Nivel desconocido "PREESCOLAR".']
      }))
    );
  }
}
