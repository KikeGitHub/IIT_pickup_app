import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Student } from '../../../../core/models/student.model';

@Component({
  selector: 'app-student-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-card.component.html',
  styleUrl: './student-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentCardComponent {
  @Input({ required: true }) students: Student[] = [];
  @Input({ required: true }) selectedStudentId: string | null = null;
  @Output() selectStudent = new EventEmitter<string>();
  @Output() editStudent = new EventEmitter<Student>();

  readonly showMembersModal = signal(false);

  get selectedStudent(): Student | undefined {
    return this.students.find(s => s.id === this.selectedStudentId) || this.students[0];
  }

  onSelect(studentId: string): void {
    this.selectStudent.emit(studentId);
  }

  onEdit(): void {
    if (this.selectedStudent) {
      this.editStudent.emit(this.selectedStudent);
    }
  }

  toggleMembersModal(): void {
    this.showMembersModal.update(v => !v);
  }

  getDisplayName(fullName: string): string {
    if (!fullName) return '';
    let raw = fullName;
    if (fullName.includes(',')) {
      const parts = fullName.split(',');
      raw = parts[1].trim() || parts[0].trim();
    } else {
      const parts = fullName.trim().split(/\s+/);
      raw = parts.length > 2 ? parts.slice(2).join(' ') : parts[0];
    }
    return raw
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  getDisplayInitial(fullName: string): string {
    const name = this.getDisplayName(fullName);
    return name.charAt(0).toUpperCase() || 'A';
  }
}
