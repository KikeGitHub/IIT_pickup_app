import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, TeacherUser, SchoolGroup } from '../../services/admin.service';

@Component({
  selector: 'app-teacher-user-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-user-crud.component.html',
  styleUrl: './teacher-user-crud.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherUserCrudComponent implements OnInit {
  readonly adminService = inject(AdminService);

  readonly showModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingTeacherId = signal<string | null>(null);

  searchQuery = '';
  levelFilter: 'ALL' | 'KINDER' | 'PRIMARIA' | 'SECUNDARIA' = 'ALL';

  // Form Model
  teacherName = '';
  teacherEmail = '';
  teacherPassword = '';
  teacherRole: 'TEACHER' | 'ADMIN' = 'TEACHER';
  teacherLevel = 'PRIMARIA';
  teacherActive = true;
  selectedGroupIds: string[] = [];
  formError = '';

  ngOnInit(): void {
    this.adminService.loadTeachers().subscribe();
    this.adminService.loadGroups().subscribe();
  }

  get filteredTeachers(): TeacherUser[] {
    let list = this.adminService.teachers();
    if (this.levelFilter !== 'ALL') {
      list = list.filter((t) => t.level === this.levelFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.nombre.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q)
      );
    }
    return list;
  }

  get groupsByLevel(): { level: string; groups: SchoolGroup[] }[] {
    const all = this.adminService.groups();
    return [
      { level: 'KINDER', groups: all.filter((g) => g.level === 'KINDER') },
      { level: 'PRIMARIA', groups: all.filter((g) => g.level === 'PRIMARIA') },
      { level: 'SECUNDARIA', groups: all.filter((g) => g.level === 'SECUNDARIA') }
    ];
  }

  isGroupSelected(groupId: string): boolean {
    return this.selectedGroupIds.includes(groupId);
  }

  toggleGroupSelection(groupId: string): void {
    if (this.selectedGroupIds.includes(groupId)) {
      this.selectedGroupIds = this.selectedGroupIds.filter((id) => id !== groupId);
    } else {
      this.selectedGroupIds = [...this.selectedGroupIds, groupId];
    }
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingTeacherId.set(null);
    this.teacherName = '';
    this.teacherEmail = '';
    this.teacherPassword = '';
    this.teacherRole = 'TEACHER';
    this.teacherLevel = 'PRIMARIA';
    this.teacherActive = true;
    this.selectedGroupIds = [];
    this.formError = '';
    this.showModal.set(true);
  }

  openEditModal(teacher: TeacherUser): void {
    this.isEditing.set(true);
    this.editingTeacherId.set(teacher.id);
    this.teacherName = teacher.nombre;
    this.teacherEmail = teacher.email;
    this.teacherPassword = '';
    this.teacherRole = teacher.role;
    this.teacherLevel = teacher.level || 'PRIMARIA';
    this.teacherActive = teacher.active;
    this.selectedGroupIds = teacher.groups ? teacher.groups.map((g) => g.id) : [];
    this.formError = '';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveTeacher(): void {
    if (!this.teacherName.trim() || !this.teacherEmail.trim()) {
      this.formError = 'El nombre y el correo electrónico son obligatorios.';
      return;
    }

    const payload = {
      nombre: this.teacherName.trim(),
      email: this.teacherEmail.trim(),
      password: this.teacherPassword.trim() || undefined,
      role: this.teacherRole,
      level: this.teacherLevel,
      active: this.teacherActive,
      groupIds: this.selectedGroupIds
    };

    if (this.isEditing() && this.editingTeacherId()) {
      this.adminService.updateTeacher(this.editingTeacherId()!, payload).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al actualizar el maestro.';
        }
      });
    } else {
      this.adminService.createTeacher(payload).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al registrar el maestro.';
        }
      });
    }
  }

  deleteTeacher(teacher: TeacherUser): void {
    if (confirm(`¿Estás seguro de eliminar a ${teacher.nombre}?`)) {
      this.adminService.deleteTeacher(teacher.id).subscribe({
        error: (err) => alert(err.error?.message || 'No se pudo eliminar el maestro.')
      });
    }
  }
}
