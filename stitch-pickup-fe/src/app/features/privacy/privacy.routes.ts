import { Routes } from '@angular/router';

export const PRIVACY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/privacy-policy/privacy-policy.component').then(
        (m) => m.PrivacyPolicyComponent
      ),
  },
];

