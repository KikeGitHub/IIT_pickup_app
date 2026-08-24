import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, ParentUser, StudentDetail } from '../../services/admin.service';

@Component({
  selector: 'app-parent-user-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parent-user-crud.component.html',
  styleUrl: './parent-user-crud.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentUserCrudComponent implements OnInit {
  readonly adminService = inject(AdminService);

  readonly showModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingParentId = signal<string | null>(null);

  searchQuery = '';

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
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.students && p.students.some((s) => s.name.toLowerCase().includes(q)))
      );
    }
    return list;
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
      this.adminService.updateParent(this.editingParentId()!, payload).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al actualizar el padre de familia.';
        }
      });
    } else {
      this.adminService.createParent(payload).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al registrar el padre de familia.';
        }
      });
    }
  }

  deleteParent(parent: ParentUser): void {
    if (confirm(`¿Estás seguro de eliminar a ${parent.nombre}?`)) {
      this.adminService.deleteParent(parent.id).subscribe({
        error: (err) => alert(err.error?.message || 'No se pudo eliminar el padre de familia.')
      });
    }
  }
}
