import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Student } from '../models/student.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/students`;

  readonly students = signal<Student[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly selectedStudentId = signal<string | null>(null);

  loadMyStudents(): Observable<Student[]> {
    this.isLoading.set(true);
    return this.http.get<Student[]>(`${this.apiUrl}/my-students`).pipe(
      tap((students) => {
        this.students.set(students);
        this.isLoading.set(false);
        if (students.length > 0 && !this.selectedStudentId()) {
          this.selectedStudentId.set(students[0].id);
        }
      }),
      catchError((err) => {
        this.isLoading.set(false);
        // Fallback demo students if offline or backend not reachable
        const mockStudents: Student[] = [
          {
            id: 'a1000000-0000-0000-0000-000000000001',
            name: 'Sofía Ramírez López',
            level: 'PRIMARIA',
            grade: '3er Grado',
            groupName: '3A',
            familyMembers: [
              { id: '1', name: 'Carlos Ramírez Soto', relationship: 'Padre', phone: '+52 722 123 4567', authorized: true },
              { id: '2', name: 'Patricia López', relationship: 'Madre', phone: '+52 722 234 5678', authorized: true }
            ]
          },
          {
            id: 'a1000000-0000-0000-0000-000000000005',
            name: 'Valentina Morales Ruiz',
            level: 'PRIMARIA',
            grade: '5to Grado',
            groupName: '5B',
            familyMembers: [
              { id: '3', name: 'Laura Morales Jiménez', relationship: 'Madre', phone: '+52 722 678 9012', authorized: true }
            ]
          }
        ];
        this.students.set(mockStudents);
        if (!this.selectedStudentId()) {
          this.selectedStudentId.set(mockStudents[0].id);
        }
        return of(mockStudents);
      })
    );
  }

  selectStudent(studentId: string): void {
    this.selectedStudentId.set(studentId);
  }

  updateStudentByParent(studentId: string, payload: any): Observable<Student> {
    return this.http.put<Student>(`${this.apiUrl}/${studentId}/parent-update`, payload).pipe(
      tap((updated) => {
        this.students.update((list) => list.map((s) => (s.id === studentId ? { ...s, ...updated } : s)));
      })
    );
  }
}
