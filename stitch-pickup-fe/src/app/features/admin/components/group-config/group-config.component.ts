import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminService, SchoolGroup } from '../../services/admin.service';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-group-config',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingOverlayComponent],
  templateUrl: './group-config.component.html',
  styleUrl: './group-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupConfigComponent implements OnInit {
  readonly adminService = inject(AdminService);

  readonly showModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingGroupId = signal<string | null>(null);

  // Form model
  groupName = '';
  groupLevel: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA' = 'PRIMARIA';
  formError = '';

  ngOnInit(): void {
    this.adminService.loadGroups().subscribe();
  }

  get kinderGroups(): SchoolGroup[] {
    return this.adminService.groups().filter((g) => g.level === 'KINDER');
  }

  get primariaGroups(): SchoolGroup[] {
    return this.adminService.groups().filter((g) => g.level === 'PRIMARIA');
  }

  get secundariaGroups(): SchoolGroup[] {
    return this.adminService.groups().filter((g) => g.level === 'SECUNDARIA');
  }

  openCreateModal(level: 'KINDER' | 'PRIMARIA' | 'SECUNDARIA' = 'PRIMARIA'): void {
    this.isEditing.set(false);
    this.editingGroupId.set(null);
    this.groupName = '';
    this.groupLevel = level;
    this.formError = '';
    this.showModal.set(true);
  }

  openEditModal(group: SchoolGroup): void {
    this.isEditing.set(true);
    this.editingGroupId.set(group.id);
    this.groupName = group.name;
    this.groupLevel = group.level;
    this.formError = '';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveGroup(): void {
    if (!this.groupName.trim()) {
      this.formError = 'Por favor ingresa un nombre para el grupo (ej: 1A, 2B, KB).';
      return;
    }

    const payload = {
      name: this.groupName.trim(),
      level: this.groupLevel
    };

    if (this.isEditing() && this.editingGroupId()) {
      this.adminService.startTransaction('Guardando Grupo Escolar...', 'Actualizando configuración en el servidor.');
      this.adminService.updateGroup(this.editingGroupId()!, payload).pipe(
        finalize(() => this.adminService.endTransaction())
      ).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al actualizar el grupo.';
        }
      });
    } else {
      this.adminService.startTransaction('Creando Grupo Escolar...', 'Registrando nuevo salón en la base de datos.');
      this.adminService.createGroup(payload).pipe(
        finalize(() => this.adminService.endTransaction())
      ).subscribe({
        next: () => this.closeModal(),
        error: (err) => {
          this.formError = err.error?.message || 'Error al crear el grupo.';
        }
      });
    }
  }

  deleteGroup(group: SchoolGroup): void {
    if (confirm(`¿Estás seguro de eliminar el grupo "${group.level} - ${group.name}"?`)) {
      this.adminService.startTransaction('Eliminando Grupo Escolar...', `Removiendo grupo ${group.name}.`);
      this.adminService.deleteGroup(group.id).pipe(
        finalize(() => this.adminService.endTransaction())
      ).subscribe({
        error: (err) => {
          alert(err.error?.message || 'No se pudo eliminar el grupo.');
        }
      });
    }
  }
}
