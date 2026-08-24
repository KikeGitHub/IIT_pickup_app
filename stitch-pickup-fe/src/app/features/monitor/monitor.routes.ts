import { Routes } from '@angular/router';

export const MONITOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/monitor-dashboard/monitor-dashboard.component').then(
        (m) => m.MonitorDashboardComponent
      ),
  },
];
