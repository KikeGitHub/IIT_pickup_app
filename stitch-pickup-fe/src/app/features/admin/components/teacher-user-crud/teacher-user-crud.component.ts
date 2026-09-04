import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminService, TeacherUser, SchoolGroup } from '../../services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { TableSkeletonComponent } from '../../../../shared/components/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-teacher-user-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, LoadingOverlayComponent, TableSkeletonComponent],
  templateUrl: './teacher-user-crud.component.html',
  styleUrl: './teacher-user-crud.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherUserCrudComponent implements OnInit {
  readonly adminService = inject(AdminService);
  private readonly notification = inject(NotificationService);

  readonly showModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingTeacherId = signal<string | null>(null);

  // Password Modal State
  readonly showPasswordModal = signal<boolean>(false);
  readonly selectedTeacherForPassword = signal<TeacherUser | null>(null);
  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  passwordError = '';
  isSavingPassword = signal<boolean>(false);

  // Pagination State
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(15);
  readonly pageSizeOptions = [15, 30, 100];

  // Sorting State
  readonly sortField = signal<'name' | 'level' | 'role' | 'status' | 'groups'>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  searchQuery = '';
  levelFilter: 'ALL' | 'KINDER' | 'PRIMARIA' | 'SECUNDARIA' = 'ALL';
  roleFilter: 'ALL' | 'TEACHER' | 'ADMIN' | 'MONITOR' = 'ALL';
  selectedGroupId = 'ALL';

  toggleSort(field: 'name' | 'level' | 'role' | 'status' | 'groups'): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  get filterableGroups(): SchoolGroup[] {
    const all = this.adminService.groups();
    if (this.levelFilter === 'ALL') return all;
    return all.filter(g => g.level === this.levelFilter);
  }

  setRoleFilter(role: 'ALL' | 'TEACHER' | 'ADMIN' | 'MONITOR'): void {
    this.roleFilter = role;
    this.currentPage.set(1);
  }

  onGroupFilterChange(groupId: string): void {
    this.selectedGroupId = groupId;
    this.currentPage.set(1);
  }

  // Form Model
  teacherName = '';
  teacherEmail = '';
  teacherPassword = '';
  teacherRole: 'TEACHER' | 'ADMIN' | 'MONITOR' = 'TEACHER';
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
    if (this.roleFilter !== 'ALL') {
      list = list.filter((t) => t.role === this.roleFilter);
    }
    if (this.selectedGroupId !== 'ALL') {
      list = list.filter(
        (t) => t.groups && t.groups.some(g => g.id === this.selectedGroupId || g.name === this.selectedGroupId)
      );
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.nombre.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q)
      );
    }

    const field = this.sortField();
    const dir = this.sortDirection();
    return [...list].sort((a, b) => {
      let valA = '';
      let valB = '';
      if (field === 'name') {
        valA = a.nombre || '';
        valB = b.nombre || '';
      } else if (field === 'level') {
        valA = a.level || '';
        valB = b.level || '';
      } else if (field === 'role') {
        valA = a.role || '';
        valB = b.role || '';
      } else if (field === 'groups') {
        const countA = a.groups ? a.groups.length : 0;
        const countB = b.groups ? b.groups.length : 0;
        return dir === 'asc' ? countA - countB : countB - countA;
      } else if (field === 'status') {
        const numA = a.active ? 1 : 0;
        const numB = b.active ? 1 : 0;
        return dir === 'asc' ? numB - numA : numA - numB;
      }
      const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base' });
      return dir === 'asc' ? cmp : -cmp;
    });
  }

  get pagedTeachers(): TeacherUser[] {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredTeachers.slice(start, start + this.pageSize());
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

  onPageChange(page: number): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
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
      this.adminService.startTransaction('Guardando Maestro...', 'Actualizando información en el servidor.');
      this.adminService.updateTeacher(this.editingTeacherId()!, payload).pipe(
        finalize(() => this.adminService.endTransaction())
      ).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al actualizar el maestro.';
        }
      });
    } else {
      this.adminService.startTransaction('Registrando Maestro...', 'Guardando cuenta docente en la base de datos.');
      this.adminService.createTeacher(payload).pipe(
        finalize(() => this.adminService.endTransaction())
      ).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al registrar el maestro.';
        }
      });
    }
  }

  deleteTeacher(teacher: TeacherUser): void {
    if (confirm(`¿Estás seguro de eliminar a ${teacher.nombre}?`)) {
      this.adminService.startTransaction('Eliminando Maestro...', `Removiendo cuenta de ${teacher.nombre}.`);
      this.adminService.deleteTeacher(teacher.id).pipe(
        finalize(() => this.adminService.endTransaction())
      ).subscribe({
        error: (err) => alert(err.error?.message || 'No se pudo eliminar el maestro.')
      });
    }
  }

  // ─── Password Change Handlers ─────────────────────────────────────────────
  openPasswordModal(teacher: TeacherUser): void {
    this.selectedTeacherForPassword.set(teacher);
    this.newPassword = '';
    this.confirmPassword = '';
    this.showNewPassword = false;
    this.passwordError = '';
    this.isSavingPassword.set(false);
    this.showPasswordModal.set(true);
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
    this.selectedTeacherForPassword.set(null);
  }

  toggleShowNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  saveNewPassword(): void {
    const teacher = this.selectedTeacherForPassword();
    if (!teacher) return;

    if (!this.newPassword || this.newPassword.trim().length < 6) {
      this.passwordError = 'La contraseña debe contener al menos 6 caracteres.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden.';
      return;
    }

    this.isSavingPassword.set(true);
    this.passwordError = '';

    this.adminService.changeTeacherPassword(teacher.id, this.newPassword.trim()).subscribe({
      next: () => {
        this.isSavingPassword.set(false);
        this.closePasswordModal();
        this.notification.success(`🔑 Contraseña actualizada exitosamente para ${teacher.nombre}.`);
      },
      error: (err) => {
        this.isSavingPassword.set(false);
        this.passwordError = err.error?.message || 'Error al cambiar la contraseña.';
      }
    });
  }
}
