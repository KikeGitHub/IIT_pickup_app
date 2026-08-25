import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminService, CsvImportResult } from '../../services/admin.service';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';

export type ImportType = 'STUDENTS' | 'TEACHERS' | 'PARENTS';

@Component({
  selector: 'app-csv-import',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingOverlayComponent],
  templateUrl: './csv-import.component.html',
  styleUrl: './csv-import.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CsvImportComponent {
  readonly adminService = inject(AdminService);

  readonly selectedType = signal<ImportType>('STUDENTS');
  readonly selectedFile = signal<File | null>(null);
  readonly isUploading = signal<boolean>(false);
  readonly result = signal<CsvImportResult | null>(null);
  readonly errorMessage = signal<string | null>(null);

  setType(type: ImportType): void {
    this.selectedType.set(type);
    this.selectedFile.set(null);
    this.result.set(null);
    this.errorMessage.set(null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
      this.result.set(null);
      this.errorMessage.set(null);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.selectedFile.set(event.dataTransfer.files[0]);
      this.result.set(null);
      this.errorMessage.set(null);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  downloadTemplate(): void {
    const type = this.selectedType();
    let csvContent = '';
    let fileName = '';

    if (type === 'STUDENTS') {
      fileName = 'plantilla_alumnos_iit.csv';
      csvContent = 'Nombre,Nivel,Grado,Grupo,NombreTutor,TelefonoTutor,Parentesco\n' +
        'Sofía Ramírez López,PRIMARIA,3°,3A,Carlos Ramírez Soto,7221234567,Papá\n' +
        'Mateo González Vidal,PRIMARIA,3°,3A,Ana Vidal Ramos,7229876543,Mamá\n' +
        'Isabella Torres Mora,KINDER,2°,KB,Roberto Torres Gil,7225551234,Papá\n' +
        'Diego Morales Soto,SECUNDARIA,1°,1A,Laura Soto Díaz,7224449876,Mamá\n';
    } else if (type === 'TEACHERS') {
      fileName = 'plantilla_maestros_iit.csv';
      csvContent = 'Nombre,Email,Nivel,Grupos\n' +
        'María Fernanda Solís,maestro1@iit.edu.mx,PRIMARIA,3A;5B\n' +
        'Juan Carlos Morales,profesor.morales@iit.edu.mx,KINDER,KA;KB\n' +
        'Lucía Mendoza Reyes,profesora.mendoza@iit.edu.mx,SECUNDARIA,1A;2A\n';
    } else if (type === 'PARENTS') {
      fileName = 'plantilla_padres_iit.csv';
      csvContent = 'Nombre,Email,Telefono,NombresAlumnos\n' +
        'Carlos Ramírez Soto,padre1@iit.edu.mx,7221234567,Sofía Ramírez López\n' +
        'Roberto González Vidal,padre2@iit.edu.mx,7229876543,Mateo González Vidal\n' +
        'Ana Torres Mora,padre3@iit.edu.mx,7225551234,Isabella Torres Mora\n';
    }

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  processUpload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Por favor selecciona un archivo CSV.');
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set(null);
    this.adminService.startTransaction('Importando Archivo CSV...', 'Validando y cargando registros en la base de datos.');

    const type = this.selectedType();
    let uploadObservable;

    if (type === 'STUDENTS') {
      uploadObservable = this.adminService.uploadStudentsCsv(file);
    } else if (type === 'TEACHERS') {
      uploadObservable = this.adminService.uploadTeachersCsv(file);
    } else {
      uploadObservable = this.adminService.uploadParentsCsv(file);
    }

    uploadObservable.pipe(
      finalize(() => {
        this.isUploading.set(false);
        this.adminService.endTransaction();
      })
    ).subscribe({
      next: (res) => {
        this.result.set(res);
        // Reload respective datasets
        this.adminService.loadStudents().subscribe();
        this.adminService.loadTeachers().subscribe();
        this.adminService.loadParents().subscribe();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al procesar el archivo. Verifica el formato e intenta nuevamente.');
      }
    });
  }
}
