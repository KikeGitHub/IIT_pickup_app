import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FamilyMemberDto {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  photoUrl?: string;
  authorized: boolean;
}

export interface TeacherParentAccount {
  id: string;
  nombre: string;
  email: string;
  phone?: string;
  tempPassword: boolean;
}

export interface TeacherStudent {
  id: string;
  name: string;
  level: string;
  grade?: string;
  groupId?: string;
  groupName?: string;
  birthday?: string;
  gender?: 'M' | 'F' | string;
  curp?: string;
  avatarUrl?: string;
  active: boolean;
  familyMembers: FamilyMemberDto[];
  parentAccounts?: TeacherParentAccount[];
}

export interface TeacherGroup {
  id: string;
  level: string;
  name: string;
  students: TeacherStudent[];
}

export interface TeacherStudentUpdatePayload {
  name: string;
  grade?: string;
  birthday?: string;
  gender?: string;
  curp?: string;
  avatarUrl?: string;
  familyMembers?: FamilyMemberDto[];
}

export interface TeacherParentAccountInput {
  nombre?: string;
  email: string;
  phone?: string;
}

export interface TeacherStudentCreatePayload {
  name: string;
  groupId: string;
  grade?: string;
  birthday?: string;
  gender?: string;
  curp?: string;
  avatarUrl?: string;
  parentAccounts?: TeacherParentAccountInput[];
  familyMembers?: FamilyMemberDto[];
}

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly myGroups = signal<TeacherGroup[]>([]);
  readonly isLoading = signal<boolean>(false);

  loadMyGroups(): Observable<TeacherGroup[]> {
    this.isLoading.set(true);
    return this.http.get<TeacherGroup[]>(`${this.apiUrl}/teacher/my-groups`).pipe(
      tap((groups) => {
        this.myGroups.set(groups);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of([]);
      })
    );
  }

  createStudent(payload: TeacherStudentCreatePayload): Observable<TeacherStudent> {
    return this.http.post<TeacherStudent>(`${this.apiUrl}/teacher/students`, payload).pipe(
      tap((newStudent) => {
        this.myGroups.update((groups) =>
          groups.map((g) => {
            if (g.id === payload.groupId) {
              return {
                ...g,
                students: [...g.students, newStudent]
              };
            }
            return g;
          })
        );
      })
    );
  }

  updateStudent(studentId: string, payload: TeacherStudentUpdatePayload): Observable<TeacherStudent> {
    return this.http.put<TeacherStudent>(`${this.apiUrl}/teacher/students/${studentId}`, payload).pipe(
      tap((updated) => {
        // Update in reactive signal list
        this.myGroups.update((groups) =>
          groups.map((g) => ({
            ...g,
            students: g.students.map((s) => (s.id === studentId ? { ...s, ...updated } : s))
          }))
        );
      })
    );
  }

  toggleStudentActive(studentId: string): Observable<TeacherStudent> {
    return this.http.patch<TeacherStudent>(`${this.apiUrl}/teacher/students/${studentId}/toggle-active`, {}).pipe(
      tap((updated) => {
        this.myGroups.update((groups) =>
          groups.map((g) => ({
            ...g,
            students: g.students.map((s) => (s.id === studentId ? { ...s, active: updated.active } : s))
          }))
        );
      })
    );
  }

  resetParentPassword(parentId: string): Observable<TeacherParentAccount> {
    return this.http.post<TeacherParentAccount>(`${this.apiUrl}/teacher/parents/${parentId}/reset-temp-password`, {}).pipe(
      tap((updatedParent) => {
        this.myGroups.update((groups) =>
          groups.map((g) => ({
            ...g,
            students: g.students.map((s) => ({
              ...s,
              parentAccounts: s.parentAccounts?.map((p) =>
                p.id === parentId ? { ...p, tempPassword: true } : p
              )
            }))
          }))
        );
      })
    );
  }
}
