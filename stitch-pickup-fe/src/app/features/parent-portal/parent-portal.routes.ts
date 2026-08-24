import { Routes } from '@angular/router';

export const PARENT_PORTAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/parent-dashboard/parent-dashboard.component').then(
        (m) => m.ParentDashboardComponent
      ),
  },
];
