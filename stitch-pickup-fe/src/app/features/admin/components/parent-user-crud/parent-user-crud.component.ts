import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminService, ParentUser, StudentDetail } from '../../services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { TableSkeletonComponent } from '../../../../shared/components/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-parent-user-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, LoadingOverlayComponent, TableSkeletonComponent],
  templateUrl: './parent-user-crud.component.html',
  styleUrl: './parent-user-crud.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentUserCrudComponent implements OnInit {
  readonly adminService = inject(AdminService);
  private readonly notification = inject(NotificationService);

  readonly showModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingParentId = signal<string | null>(null);

  // Password Modal State
  readonly showPasswordModal = signal<boolean>(false);
  readonly selectedParentForPassword = signal<ParentUser | null>(null);
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
  readonly sortField = signal<'name' | 'email' | 'phone' | 'students' | 'status' | 'lastLogin'>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  searchQuery = '';
  statusFilter = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  hasStudentsFilter = signal<'ALL' | 'WITH' | 'WITHOUT'>('ALL');

  toggleSort(field: 'name' | 'email' | 'phone' | 'students' | 'status' | 'lastLogin'): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  setStatusFilter(status: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
  }

  setHasStudentsFilter(filter: 'ALL' | 'WITH' | 'WITHOUT'): void {
    this.hasStudentsFilter.set(filter);
    this.currentPage.set(1);
  }

  // Form Model
  parentName = '';
  parentEmail = '';
  parentPassword = '';
  parentPhone = '';
  parentActive = true;
  selectedStudentIds: string[] = [];
  studentSearchFilter = '';
  formError = '';

  ngOnInit(): void {
    this.adminService.loadParents().subscribe();
    this.adminService.loadStudents().subscribe();
  }

  get filteredParents(): ParentUser[] {
    let list = this.adminService.parents();

    if (this.statusFilter() === 'ACTIVE') {
      list = list.filter(p => p.active);
    } else if (this.statusFilter() === 'INACTIVE') {
      list = list.filter(p => !p.active);
    }

    if (this.hasStudentsFilter() === 'WITH') {
      list = list.filter(p => p.students && p.students.length > 0);
    } else if (this.hasStudentsFilter() === 'WITHOUT') {
      list = list.filter(p => !p.students || p.students.length === 0);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.phone && p.phone.toLowerCase().includes(q)) ||
          (p.students && p.students.some((s) => s.name.toLowerCase().includes(q)))
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
      } else if (field === 'email') {
        valA = a.email || '';
        valB = b.email || '';
      } else if (field === 'phone') {
        valA = a.phone || '';
        valB = b.phone || '';
      } else if (field === 'students') {
        const countA = a.students ? a.students.length : 0;
        const countB = b.students ? b.students.length : 0;
        return dir === 'asc' ? countA - countB : countB - countA;
      } else if (field === 'status') {
        const numA = a.active ? 1 : 0;
        const numB = b.active ? 1 : 0;
        return dir === 'asc' ? numB - numA : numA - numB;
      } else if (field === 'lastLogin') {
        valA = a.lastLogin || '';
        valB = b.lastLogin || '';
      }
      const cmp = valA.localeCompare(valB, 'es', { sensitivity: 'base' });
      return dir === 'asc' ? cmp : -cmp;
    });
  }

  get pagedParents(): ParentUser[] {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredParents.slice(start, start + this.pageSize());
  }

  onSearchChange(): void {
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

  get availableStudents(): StudentDetail[] {
    const all = this.adminService.students();
    if (!this.studentSearchFilter.trim()) return all;
    const q = this.studentSearchFilter.toLowerCase();
    return all.filter((s) => s.name.toLowerCase().includes(q) || (s.groupName && s.groupName.toLowerCase().includes(q)));
  }

  isStudentSelected(studentId: string): boolean {
    return this.selectedStudentIds.includes(studentId);
  }

  toggleStudentSelection(studentId: string): void {
    if (this.selectedStudentIds.includes(studentId)) {
      this.selectedStudentIds = this.selectedStudentIds.filter((id) => id !== studentId);
    } else {
      this.selectedStudentIds = [...this.selectedStudentIds, studentId];
    }
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingParentId.set(null);
    this.parentName = '';
    this.parentEmail = '';
    this.parentPassword = '';
    this.parentPhone = '';
    this.parentActive = true;
    this.selectedStudentIds = [];
    this.studentSearchFilter = '';
    this.formError = '';
    this.showModal.set(true);
  }

  openEditModal(parent: ParentUser): void {
    this.isEditing.set(true);
    this.editingParentId.set(parent.id);
    this.parentName = parent.nombre;
    this.parentEmail = parent.email;
    this.parentPassword = '';
    this.parentPhone = parent.phone || '';
    this.parentActive = parent.active;
    this.selectedStudentIds = parent.students ? parent.students.map((s) => s.id) : [];
    this.studentSearchFilter = '';
    this.formError = '';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveParent(): void {
    if (!this.parentName.trim() || !this.parentEmail.trim()) {
      this.formError = 'El nombre y el correo electrónico son obligatorios.';
      return;
    }

    const payload = {
      nombre: this.parentName.trim(),
      email: this.parentEmail.trim(),
      password: this.parentPassword.trim() || undefined,
      phone: this.parentPhone.trim() || undefined,
      active: this.parentActive,
      studentIds: this.selectedStudentIds
    };

    if (this.isEditing() && this.editingParentId()) {
      this.adminService.startTransaction('Guardando Padre de Familia...', 'Actualizando información en el servidor.');
      this.adminService.updateParent(this.editingParentId()!, payload).pipe(
        finalize(() => this.adminService.endTransaction())
      ).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al actualizar el padre de familia.';
        }
      });
    } else {
      this.adminService.startTransaction('Registrando Padre de Familia...', 'Guardando cuenta en la base de datos.');
      this.adminService.createParent(payload).pipe(
        finalize(() => this.adminService.endTransaction())
      ).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al registrar el padre de familia.';
        }
      });
    }
  }

  deleteParent(parent: ParentUser): void {
    if (confirm(`¿Estás seguro de eliminar a ${parent.nombre}?`)) {
      this.adminService.startTransaction('Eliminando Padre de Familia...', `Removiendo cuenta de ${parent.nombre}.`);
      this.adminService.deleteParent(parent.id).pipe(
        finalize(() => this.adminService.endTransaction())
      ).subscribe({
        error: (err) => alert(err.error?.message || 'No se pudo eliminar el padre de familia.')
      });
    }
  }

  // ─── Password Change Handlers ─────────────────────────────────────────────
  openPasswordModal(parent: ParentUser): void {
    this.selectedParentForPassword.set(parent);
    this.newPassword = '';
    this.confirmPassword = '';
    this.showNewPassword = false;
    this.passwordError = '';
    this.isSavingPassword.set(false);
    this.showPasswordModal.set(true);
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
    this.selectedParentForPassword.set(null);
  }

  toggleShowNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  saveNewPassword(): void {
    const parent = this.selectedParentForPassword();
    if (!parent) return;

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

    this.adminService.changeParentPassword(parent.id, this.newPassword.trim()).subscribe({
      next: () => {
        this.isSavingPassword.set(false);
        this.closePasswordModal();
        this.notification.success(`🔑 Contraseña actualizada exitosamente para ${parent.nombre}.`);
      },
      error: (err) => {
        this.isSavingPassword.set(false);
        this.passwordError = err.error?.message || 'Error al cambiar la contraseña.';
      }
    });
  }
}
