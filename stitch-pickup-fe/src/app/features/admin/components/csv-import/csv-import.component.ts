import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, CsvImportResult } from '../../services/admin.service';

@Component({
  selector: 'app-csv-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './csv-import.component.html',
  styleUrl: './csv-import.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CsvImportComponent {
  readonly adminService = inject(AdminService);

  readonly selectedFile = signal<File | null>(null);
  readonly result = signal<CsvImportResult | null>(null);
  readonly isUploading = signal<boolean>(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile.set(input.files[0]);
    }
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.adminService.uploadCsv(file).subscribe(res => {
      this.result.set(res);
      this.isUploading.set(false);
    });
  }
}
