import { Routes } from '@angular/router';

export const TEACHER_PORTAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/teacher-dashboard/teacher-dashboard.component').then(
        (m) => m.TeacherDashboardComponent
      ),
  },
];
