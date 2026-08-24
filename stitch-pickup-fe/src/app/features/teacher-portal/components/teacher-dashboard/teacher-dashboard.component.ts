import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Placeholder — Sprint 5 */
@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;height:100dvh;background:#166534;color:white;font-family:sans-serif;flex-direction:column;gap:16px;">
      <h1 style="font-size:24px;margin:0;">Portal del Maestro</h1>
      <p style="margin:0;opacity:0.7;">Sprint 5 — En desarrollo</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherDashboardComponent {}
