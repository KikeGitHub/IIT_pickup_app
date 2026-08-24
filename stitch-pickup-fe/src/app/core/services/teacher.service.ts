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

export interface TeacherStudent {
  id: string;
  name: string;
  level: string;
  grade?: string;
  groupId?: string;
  groupName?: string;
  birthday?: string;
  avatarUrl?: string;
  active: boolean;
  familyMembers: FamilyMemberDto[];
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
  avatarUrl?: string;
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
}
