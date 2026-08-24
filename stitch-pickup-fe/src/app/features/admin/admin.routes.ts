import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/admin-shell/admin-shell.component').then(
        (m) => m.AdminShellComponent
      ),
  },
];
