import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../models/auth-user.model';

/**
 * Role-based access guard.
 * Usage: canActivate: [roleGuard('ADMIN')]
 */
export const roleGuard = (...allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentUser = authService.currentUser();

    if (!currentUser) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (allowedRoles.includes(currentUser.role)) {
      return true;
    }

    // Redirect to the appropriate portal based on role
    switch (currentUser.role) {
      case 'PARENT':
        router.navigate(['/parent']);
        break;
      case 'TEACHER':
        router.navigate(['/monitor']);
        break;
      case 'ADMIN':
      case 'MONITOR':
        router.navigate(['/admin']);
        break;
      default:
        router.navigate(['/auth/login']);
    }

    return false;
  };
};
