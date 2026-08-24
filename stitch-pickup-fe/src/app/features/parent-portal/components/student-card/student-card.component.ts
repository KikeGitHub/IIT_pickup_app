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
}
