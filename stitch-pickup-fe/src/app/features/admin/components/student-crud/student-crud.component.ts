import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminService, StudentDetail, SchoolGroup, FamilyMember } from '../../services/admin.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { TableSkeletonComponent } from '../../../../shared/components/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-student-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, LoadingOverlayComponent, TableSkeletonComponent],
  templateUrl: './student-crud.component.html',
  styleUrl: './student-crud.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentCrudComponent implements OnInit {
  readonly adminService = inject(AdminService);

  readonly showModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingStudentId = signal<string | null>(null);

  // Pagination State
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(15);
  readonly pageSizeOptions = [15, 30, 100];

  searchQuery = '';
  levelFilter: 'ALL' | 'KINDER' | 'PRIMARIA' | 'SECUNDARIA' = 'ALL';
  selectedGroupId: string = 'ALL';

  // Form Model
  studentName = '';
  studentLevel: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA' = 'PRIMARIA';
  studentGrade = '3°';
  studentGroupId = '';
  studentBirthday = '';
  studentGender: 'M' | 'F' = 'M';
  studentCurp = '';
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

  get filterableGroups(): SchoolGroup[] {
    const all = this.adminService.groups();
    if (this.levelFilter === 'ALL') {
      return all;
    }
    return all.filter((g) => g.level === this.levelFilter);
  }

  get filteredStudents(): StudentDetail[] {
    let list = this.adminService.students();
    if (this.levelFilter !== 'ALL') {
      list = list.filter((s) => s.level === this.levelFilter);
    }
    if (this.selectedGroupId !== 'ALL') {
      list = list.filter(
        (s) => s.groupId === this.selectedGroupId || (s.groupName && s.groupName === this.selectedGroupId)
      );
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.groupName && s.groupName.toLowerCase().includes(q)) ||
          (s.curp && s.curp.toLowerCase().includes(q))
      );
    }
    return list;
  }

  get pagedStudents(): StudentDetail[] {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredStudents.slice(start, start + this.pageSize());
  }

  onSearchChange(): void {
    this.currentPage.set(1);
  }

  setLevelFilter(level: 'ALL' | 'KINDER' | 'PRIMARIA' | 'SECUNDARIA'): void {
    this.levelFilter = level;
    if (this.selectedGroupId !== 'ALL') {
      const existsInLevel = this.filterableGroups.some(g => g.id === this.selectedGroupId);
      if (!existsInLevel) {
        this.selectedGroupId = 'ALL';
      }
    }
    this.currentPage.set(1);
  }

  onGroupFilterChange(groupId: string): void {
    this.selectedGroupId = groupId;
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
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
    const groups = this.availableGroups;
    this.studentGroupId = groups.length > 0 ? groups[0].id : '';
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
    this.studentGender = 'M';
    this.studentCurp = '';
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
    this.studentGender = (student.gender as 'M' | 'F') || 'M';
    this.studentCurp = student.curp || '';
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

  onPhotoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.formError = 'La fotografía no debe superar 2MB.';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.studentAvatarUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  clearPhoto(): void {
    this.studentAvatarUrl = '';
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
      gender: this.studentGender,
      curp: this.studentCurp.trim().toUpperCase() || undefined,
      avatarUrl: this.studentAvatarUrl || undefined,
      active: this.studentActive,
      familyMembers: validTutors
    };

    if (this.isEditing() && this.editingStudentId()) {
      this.adminService.startTransaction('Guardando Alumno...', 'Actualizando información en el servidor.');
      this.adminService.updateStudent(this.editingStudentId()!, payload).pipe(
        finalize(() => this.adminService.endTransaction())
      ).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al actualizar el alumno.';
        }
      });
    } else {
      this.adminService.startTransaction('Registrando Alumno...', 'Guardando información en la base de datos.');
      this.adminService.createStudent(payload).pipe(
        finalize(() => this.adminService.endTransaction())
      ).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al registrar el alumno.';
        }
      });
    }
  }

  deleteStudent(student: StudentDetail): void {
    if (confirm(`¿Estás seguro de eliminar al alumno "${student.name}"?`)) {
      this.adminService.startTransaction('Eliminando Alumno...', `Removiendo a ${student.name} del sistema.`);
      this.adminService.deleteStudent(student.id).pipe(
        finalize(() => this.adminService.endTransaction())
      ).subscribe({
        error: (err) => alert(err.error?.message || 'No se pudo eliminar el alumno.')
      });
    }
  }
}
