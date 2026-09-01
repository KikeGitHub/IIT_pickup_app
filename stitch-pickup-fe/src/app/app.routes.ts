import { inject } from '@angular/core';
import { Routes, Router, CanActivateFn } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { authGuard } from './core/auth/guards/auth.guard';
import { roleGuard } from './core/auth/guards/role.guard';

const rootRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    const role = auth.userRole();
    if (role === 'TEACHER') {
      return router.createUrlTree(['/monitor']);
    } else if (role === 'ADMIN') {
      return router.createUrlTree(['/admin']);
    } else if (role === 'PARENT') {
      return router.createUrlTree(['/parent']);
    }
  }

  const preferred = typeof window !== 'undefined' ? localStorage.getItem('iit_preferred_portal') : null;
  if (preferred === 'teacher') {
    return router.createUrlTree(['/auth/maestros']);
  }
  return router.createUrlTree(['/auth/login']);
};

export const routes: Routes = [
  // ── Default smart redirect (supports standalone PWA and role persistence) ───
  {
    path: '',
    canActivate: [rootRedirectGuard],
    children: [],
    pathMatch: 'full',
  },

  // ── Auth module (public) ─────────────────────────────────────────────────
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ── Parent Portal (PARENT role only) ─────────────────────────────────────
  {
    path: 'parent',
    canActivate: [authGuard, roleGuard('PARENT')],
    loadChildren: () =>
      import('./features/parent-portal/parent-portal.routes').then(
        (m) => m.PARENT_PORTAL_ROUTES
      ),
  },

  // ── Monitor Dashboard (TEACHER + ADMIN) ──────────────────────────────────
  {
    path: 'monitor',
    canActivate: [authGuard, roleGuard('TEACHER', 'ADMIN')],
    loadChildren: () =>
      import('./features/monitor/monitor.routes').then((m) => m.MONITOR_ROUTES),
  },

  // ── Admin Panel (ADMIN only) ──────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },

  // ── Teacher Portal (TEACHER only) ────────────────────────────────────────
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard('TEACHER')],
    loadChildren: () =>
      import('./features/teacher-portal/teacher-portal.routes').then(
        (m) => m.TEACHER_PORTAL_ROUTES
      ),
  },

  // ── Wildcard ──────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
