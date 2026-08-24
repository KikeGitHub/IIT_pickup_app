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

type LoginState = 'idle' | 'loading' | 'error';

/**
 * LoginTeacherComponent — Portal de acceso para maestros y personal escolar.
 *
 * Design: Verde académico (#166534) — variante del tema maestros.
 * Flujo: Login → si tempPassword → /auth/change-password → /monitor o /admin
 *
 * SOLID: S — solo maneja el flujo de login de maestros.
 */
@Component({
  selector: 'app-login-teacher',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-teacher.component.html',
  styleUrl: './login-teacher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginTeacherComponent {
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly state = signal<LoginState>('idle');
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = computed(() => this.state() === 'loading');

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading()) return;

    const { email, password } = this.loginForm.getRawValue();
    this.state.set('loading');
    this.errorMessage.set(null);

    this.auth.loginTeacher(email!, password!).subscribe({
      next: () => {
        this.state.set('idle');
        const user = this.auth.currentUser();

        if (this.auth.requiresPasswordChange()) {
          this.router.navigate(['/auth/change-password']);
          return;
        }

        // Route based on role
        if (user?.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/monitor']);
        }
      },
      error: (err) => {
        this.state.set('error');
        const msg = err?.error?.message ?? 'Credenciales incorrectas.';
        this.errorMessage.set(msg);
        this.notification.error(msg);
      },
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  isFieldInvalid(field: 'email' | 'password'): boolean {
    const control = this.loginForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  getFieldError(field: 'email' | 'password'): string | null {
    const control = this.loginForm.get(field);
    if (!control?.errors || !control?.touched) return null;
    if (control.errors['required']) return 'Este campo es obligatorio.';
    if (control.errors['email']) return 'Ingresa un email válido.';
    if (control.errors['minlength']) return 'La contraseña debe tener al menos 6 caracteres.';
    return null;
  }
}
