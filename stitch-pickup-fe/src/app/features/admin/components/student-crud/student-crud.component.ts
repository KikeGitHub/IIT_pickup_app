import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, StudentDetail, SchoolGroup, FamilyMember } from '../../services/admin.service';

@Component({
  selector: 'app-student-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-crud.component.html',
  styleUrl: './student-crud.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentCrudComponent implements OnInit {
  readonly adminService = inject(AdminService);

  readonly showModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingStudentId = signal<string | null>(null);

  searchQuery = '';
  levelFilter: 'ALL' | 'KINDER' | 'PRIMARIA' | 'SECUNDARIA' = 'ALL';

  // Form Model
  studentName = '';
  studentLevel: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA' = 'PRIMARIA';
  studentGrade = '3°';
  studentGroupId = '';
  studentBirthday = '';
  studentAvatarUrl = '';
  studentActive = true;

  // Up to 3 authorized pickup tutors
  tutors: FamilyMember[] = [
    { name: '', relationship: 'Mamá', phone: '', photoUrl: '', authorized: true },
    { name: '', relationship: 'Papá', phone: '', photoUrl: '', authorized: true },
    { name: '', relationship: 'Tutor / Familiar', phone: '', photoUrl: '', authorized: true }
  ];

  formError = '';

  ngOnInit(): void {
    this.adminService.loadStudents().subscribe();
    this.adminService.loadGroups().subscribe();
    this.adminService.loadTeachers().subscribe();
  }

  get filteredStudents(): StudentDetail[] {
    let list = this.adminService.students();
    if (this.levelFilter !== 'ALL') {
      list = list.filter((s) => s.level === this.levelFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.groupName && s.groupName.toLowerCase().includes(q))
      );
    }
    return list;
  }

  get availableGroups(): SchoolGroup[] {
    return this.adminService.groups().filter((g) => g.level === this.studentLevel);
  }

  get selectedGroupTeachers(): string[] {
    if (!this.studentGroupId) return [];
    const teachers = this.adminService.teachers();
    return teachers
      .filter((t) => t.groups && t.groups.some((g) => g.id === this.studentGroupId))
      .map((t) => t.nombre);
  }

  onLevelChange(): void {
    // Reset group when level changes
    const matchingGroups = this.availableGroups;
    this.studentGroupId = matchingGroups.length > 0 ? matchingGroups[0].id : '';
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingStudentId.set(null);
    this.studentName = '';
    this.studentLevel = 'PRIMARIA';
    this.studentGrade = '3°';
    const groups = this.availableGroups;
    this.studentGroupId = groups.length > 0 ? groups[0].id : '';
    this.studentBirthday = '';
    this.studentAvatarUrl = '';
    this.studentActive = true;
    this.tutors = [
      { name: '', relationship: 'Mamá', phone: '', photoUrl: '', authorized: true },
      { name: '', relationship: 'Papá', phone: '', photoUrl: '', authorized: true },
      { name: '', relationship: 'Tutor / Familiar', phone: '', photoUrl: '', authorized: true }
    ];
    this.formError = '';
    this.showModal.set(true);
  }

  openEditModal(student: StudentDetail): void {
    this.isEditing.set(true);
    this.editingStudentId.set(student.id);
    this.studentName = student.name;
    this.studentLevel = student.level;
    this.studentGrade = student.grade || '';
    this.studentGroupId = student.groupId || '';
    this.studentBirthday = student.birthday || '';
    this.studentAvatarUrl = student.avatarUrl || '';
    this.studentActive = student.active;

    // Load tutors or populate defaults up to 3
    const existing = student.familyMembers || [];
    this.tutors = [
      existing[0] ? { ...existing[0] } : { name: '', relationship: 'Mamá', phone: '', photoUrl: '', authorized: true },
      existing[1] ? { ...existing[1] } : { name: '', relationship: 'Papá', phone: '', photoUrl: '', authorized: true },
      existing[2] ? { ...existing[2] } : { name: '', relationship: 'Tutor / Familiar', phone: '', photoUrl: '', authorized: true }
    ];

    this.formError = '';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveStudent(): void {
    if (!this.studentName.trim()) {
      this.formError = 'El nombre del alumno es obligatorio.';
      return;
    }

    // Filter valid filled tutors
    const validTutors = this.tutors.filter((t) => t.name.trim().length > 0);

    const payload = {
      name: this.studentName.trim(),
      level: this.studentLevel,
      grade: this.studentGrade,
      groupId: this.studentGroupId || undefined,
      birthday: this.studentBirthday || undefined,
      avatarUrl: this.studentAvatarUrl || undefined,
      active: this.studentActive,
      familyMembers: validTutors
    };

    if (this.isEditing() && this.editingStudentId()) {
      this.adminService.updateStudent(this.editingStudentId()!, payload).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al actualizar el alumno.';
        }
      });
    } else {
      this.adminService.createStudent(payload).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al registrar el alumno.';
        }
      });
    }
  }

  deleteStudent(student: StudentDetail): void {
    if (confirm(`¿Estás seguro de eliminar al alumno "${student.name}"?`)) {
      this.adminService.deleteStudent(student.id).subscribe({
        error: (err) => alert(err.error?.message || 'No se pudo eliminar el alumno.')
      });
    }
  }
}
