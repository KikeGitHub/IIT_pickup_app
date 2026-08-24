import {
  Component,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

/** Custom validator: new password must be different from current */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group(
    {
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  readonly state = signal<'idle' | 'loading' | 'success'>('idle');
  readonly isLoading = computed(() => this.state() === 'loading');
  readonly currentUser = this.auth.currentUser;

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.state.set('loading');

    this.auth.changePassword(currentPassword!, newPassword!).subscribe({
      next: () => {
        this.state.set('success');
        this.notification.success('¡Contraseña actualizada! Bienvenido al sistema.');

        // Route based on role
        const role = this.auth.currentUser()?.role;
        setTimeout(() => {
          if (role === 'PARENT') this.router.navigate(['/parent']);
          else if (role === 'ADMIN') this.router.navigate(['/admin']);
          else this.router.navigate(['/monitor']);
        }, 1500);
      },
      error: (err) => {
        this.state.set('idle');
        const msg = err?.error?.message ?? 'No se pudo cambiar la contraseña. Inténtalo de nuevo.';
        this.notification.error(msg);
      },
    });
  }

  get hasMismatch(): boolean {
    return !!(this.form.errors?.['passwordMismatch'] &&
      this.form.get('confirmPassword')?.touched);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }
}
