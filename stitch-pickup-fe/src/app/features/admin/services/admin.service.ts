import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  SchoolGroup,
  StudentDetail,
  TeacherUser,
  ParentUser,
  KpisData,
  CsvImportResult,
  FamilyMember
} from '../models/admin.models';

export type {
  SchoolGroup,
  StudentDetail,
  TeacherUser,
  ParentUser,
  KpisData,
  CsvImportResult,
  FamilyMember
};

export interface AdminUser {
  id: string;
  nombre: string;
  email: string;
  role: 'PARENT' | 'TEACHER' | 'ADMIN';
  active: boolean;
  lastLogin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ─── Reactive Signals ──────────────────────────────────────────────────────
  readonly kpis = signal<KpisData | null>(null);
  readonly selectedPeriod = signal<'day' | 'week' | 'month'>('day');
  readonly groups = signal<SchoolGroup[]>([]);
  readonly students = signal<StudentDetail[]>([]);
  readonly teachers = signal<TeacherUser[]>([]);
  readonly parents = signal<ParentUser[]>([]);
  readonly users = signal<AdminUser[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isTransacting = signal<boolean>(false);
  readonly transactionTitle = signal<string>('Procesando...');
  readonly transactionMessage = signal<string>('Por favor espera un momento.');

  startTransaction(title: string = 'Procesando...', message: string = 'Por favor espera un momento.'): void {
    this.transactionTitle.set(title);
    this.transactionMessage.set(message);
    this.isTransacting.set(true);
  }

  endTransaction(): void {
    this.isTransacting.set(false);
  }

  // ─── KPIs & Metrics ────────────────────────────────────────────────────────
  loadKpis(period: 'day' | 'week' | 'month' = 'day'): Observable<KpisData | null> {
    this.isLoading.set(true);
    this.selectedPeriod.set(period);

    return this.http.get<KpisData>(`${this.apiUrl}/kpis?period=${period}`).pipe(
      tap((data) => {
        this.kpis.set(data);
        this.isLoading.set(false);
      }),
      catchError(() => {
        const mock: KpisData = {
          totalAlertsToday: period === 'day' ? 142 : period === 'week' ? 890 : 3450,
          totalDeliveredToday: period === 'day' ? 128 : period === 'week' ? 840 : 3320,
          pendingCount: period === 'day' ? 14 : 50,
          urgentCount: period === 'day' ? 3 : 15,
          avgPickupTimeMinutes: 5.8,
          peakHour: '14:00 - 14:30',
          alertsByLevel: { KINDER: 32, PRIMARIA: 84, SECUNDARIA: 26 },
          alertsByMethod: { CAR: 118, WALK: 24 },
          teacherMetrics: [
            { teacherName: 'María Fernanda Solís', totalDelivered: 45, avgTimeMinutes: 4.2 },
            { teacherName: 'Juan Carlos Morales', totalDelivered: 38, avgTimeMinutes: 5.1 },
            { teacherName: 'Lucía Mendoza Reyes', totalDelivered: 32, avgTimeMinutes: 6.0 },
            { teacherName: 'Roberto Garza Vega', totalDelivered: 13, avgTimeMinutes: 7.3 }
          ]
        };
        this.kpis.set(mock);
        this.isLoading.set(false);
        return of(mock);
      })
    );
  }

  // ─── School Groups CRUD ────────────────────────────────────────────────────
  loadGroups(): Observable<SchoolGroup[]> {
    this.isLoading.set(true);
    return this.http.get<SchoolGroup[]>(`${this.apiUrl}/admin/groups`).pipe(
      tap((data) => {
        this.groups.set(data);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.groups());
      })
    );
  }

  createGroup(group: { name: string; level: string }): Observable<SchoolGroup> {
    return this.http.post<SchoolGroup>(`${this.apiUrl}/admin/groups`, group).pipe(
      tap((created) => {
        this.groups.update((list) => [...list, created]);
      })
    );
  }

  updateGroup(id: string, group: { name: string; level: string }): Observable<SchoolGroup> {
    return this.http.put<SchoolGroup>(`${this.apiUrl}/admin/groups/${id}`, group).pipe(
      tap((updated) => {
        this.groups.update((list) => list.map((g) => (g.id === id ? updated : g)));
      })
    );
  }

  deleteGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/groups/${id}`).pipe(
      tap(() => {
        this.groups.update((list) => list.filter((g) => g.id !== id));
      })
    );
  }

  // ─── Students CRUD ─────────────────────────────────────────────────────────
  loadStudents(): Observable<StudentDetail[]> {
    this.isLoading.set(true);
    return this.http.get<StudentDetail[]>(`${this.apiUrl}/admin/students`).pipe(
      tap((data) => {
        this.students.set(data);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.students());
      })
    );
  }

  createStudent(student: any): Observable<StudentDetail> {
    return this.http.post<StudentDetail>(`${this.apiUrl}/admin/students`, student).pipe(
      tap((created) => {
        this.students.update((list) => [created, ...list]);
      })
    );
  }

  updateStudent(id: string, student: any): Observable<StudentDetail> {
    return this.http.put<StudentDetail>(`${this.apiUrl}/admin/students/${id}`, student).pipe(
      tap((updated) => {
        this.students.update((list) => list.map((s) => (s.id === id ? updated : s)));
      })
    );
  }

  deleteStudent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/students/${id}`).pipe(
      tap(() => {
        this.students.update((list) => list.filter((s) => s.id !== id));
      })
    );
  }

  // ─── Teachers CRUD ─────────────────────────────────────────────────────────
  loadTeachers(): Observable<TeacherUser[]> {
    this.isLoading.set(true);
    return this.http.get<TeacherUser[]>(`${this.apiUrl}/admin/teachers`).pipe(
      tap((data) => {
        this.teachers.set(data);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.teachers());
      })
    );
  }

  createTeacher(teacher: any): Observable<TeacherUser> {
    return this.http.post<TeacherUser>(`${this.apiUrl}/admin/teachers`, teacher).pipe(
      tap((created) => {
        this.teachers.update((list) => [created, ...list]);
      })
    );
  }

  updateTeacher(id: string, teacher: any): Observable<TeacherUser> {
    return this.http.put<TeacherUser>(`${this.apiUrl}/admin/teachers/${id}`, teacher).pipe(
      tap((updated) => {
        this.teachers.update((list) => list.map((t) => (t.id === id ? updated : t)));
      })
    );
  }

  deleteTeacher(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/teachers/${id}`).pipe(
      tap(() => {
        this.teachers.update((list) => list.filter((t) => t.id !== id));
      })
    );
  }

  // ─── Parents CRUD ──────────────────────────────────────────────────────────
  loadParents(): Observable<ParentUser[]> {
    this.isLoading.set(true);
    return this.http.get<ParentUser[]>(`${this.apiUrl}/admin/parents`).pipe(
      tap((data) => {
        this.parents.set(data);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.parents());
      })
    );
  }

  createParent(parent: any): Observable<ParentUser> {
    return this.http.post<ParentUser>(`${this.apiUrl}/admin/parents`, parent).pipe(
      tap((created) => {
        this.parents.update((list) => [created, ...list]);
      })
    );
  }

  updateParent(id: string, parent: any): Observable<ParentUser> {
    return this.http.put<ParentUser>(`${this.apiUrl}/admin/parents/${id}`, parent).pipe(
      tap((updated) => {
        this.parents.update((list) => list.map((p) => (p.id === id ? updated : p)));
      })
    );
  }

  deleteParent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/parents/${id}`).pipe(
      tap(() => {
        this.parents.update((list) => list.filter((p) => p.id !== id));
      })
    );
  }

  // ─── Users Legacy Overview ────────────────────────────────────────────────
  loadUsers(): void {
    const mockUsers: AdminUser[] = [
      { id: '1', nombre: 'Carlos Ramírez Soto', email: 'padre1@iit.edu.mx', role: 'PARENT', active: true, lastLogin: '2026-08-10 14:02' },
      { id: '2', nombre: 'Roberto González Vidal', email: 'padre2@iit.edu.mx', role: 'PARENT', active: true, lastLogin: '2026-08-10 14:15' },
      { id: '3', nombre: 'María Fernanda Solis', email: 'maestro1@iit.edu.mx', role: 'TEACHER', active: true, lastLogin: '2026-08-10 13:45' },
      { id: '4', nombre: 'Director General IIT', email: 'admin@iit.edu.mx', role: 'ADMIN', active: true, lastLogin: '2026-08-10 08:30' }
    ];
    this.users.set(mockUsers);
  }

  // ─── Bulk CSV Imports ──────────────────────────────────────────────────────
  uploadStudentsCsv(file: File): Observable<CsvImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CsvImportResult>(`${this.apiUrl}/admin/import/students`, formData);
  }

  uploadTeachersCsv(file: File): Observable<CsvImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CsvImportResult>(`${this.apiUrl}/admin/import/teachers`, formData);
  }

  uploadParentsCsv(file: File): Observable<CsvImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CsvImportResult>(`${this.apiUrl}/admin/import/parents`, formData);
  }
}
