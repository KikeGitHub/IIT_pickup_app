import {
  Component,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { PwaInstallBannerComponent } from '../../../../shared/components/pwa-install-banner/pwa-install-banner.component';

type LoginState = 'idle' | 'loading' | 'error';

/**
 * LoginParentComponent — Portal de acceso para padres de familia.
 *
 * Design: Navy académico (#000e27), formulario glassmorphism sobre hero.
 * Flujo: Login → si tempPassword → /auth/change-password → /parent
 *
 * SOLID: S — solo maneja el flujo de login de padres.
 */
@Component({
  selector: 'app-login-parent',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PwaInstallBannerComponent],
  templateUrl: './login-parent.component.html',
  styleUrl: './login-parent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginParentComponent {
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // ── Reactive Form ──────────────────────────────────────────────────────────
  readonly loginForm = this.fb.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('iit_preferred_portal', 'parent');
    }
  }

  // ── State ──────────────────────────────────────────────────────────────────
  readonly state = signal<LoginState>('idle');
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly isLoading = computed(() => this.state() === 'loading');

  // ── Actions ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading()) return;

    const { email, password } = this.loginForm.getRawValue();
    this.state.set('loading');
    this.errorMessage.set(null);

    this.auth.loginParent(email!, password!).subscribe({
      next: () => {
        this.state.set('idle');

        if (this.auth.requiresPasswordChange()) {
          this.router.navigate(['/auth/change-password']);
        } else {
          this.router.navigate(['/parent']);
        }
      },
      error: (err) => {
        this.state.set('error');
        const msg =
          err?.error?.message ?? 'Credenciales incorrectas. Verifica tu usuario y contraseña.';
        this.errorMessage.set(msg);
        this.notification.error(msg);
      },
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  // ── Form Helpers ───────────────────────────────────────────────────────────

  isFieldInvalid(field: 'email' | 'password'): boolean {
    const control = this.loginForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  getFieldError(field: 'email' | 'password'): string | null {
    const control = this.loginForm.get(field);
    if (!control?.errors || !control?.touched) return null;

    if (control.errors['required']) return 'Este campo es obligatorio.';
    if (control.errors['minlength']) return 'La contraseña debe tener al menos 6 caracteres.';

    return null;
  }
}
