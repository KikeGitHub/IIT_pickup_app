import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login-parent/login-parent.component').then(
        (m) => m.LoginParentComponent
      ),
  },
  {
    path: 'maestros',
    loadComponent: () =>
      import('./components/login-teacher/login-teacher.component').then(
        (m) => m.LoginTeacherComponent
      ),
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./components/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent
      ),
  },
];
