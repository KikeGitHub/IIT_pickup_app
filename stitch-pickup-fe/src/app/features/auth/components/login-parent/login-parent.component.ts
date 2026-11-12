import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PrivacyService } from '../../../../core/services/privacy.service';

import { PwaInstallBannerComponent } from '../../../../shared/components/pwa-install-banner/pwa-install-banner.component';
import { PrivacyPolicyComponent } from '../../../privacy/components/privacy-policy/privacy-policy.component';

type LoginState = 'idle' | 'loading' | 'error';

/**
 * LoginParentComponent — Portal de acceso para padres de familia.
 *
 * Design: Navy académico (#000e27), formulario glassmorphism sobre hero.
 * Flujo: Login + Consentimiento Aviso de Privacidad → si tempPassword → /auth/change-password → /parent
 *
 * SOLID: S — solo maneja el flujo de login de padres.
 */
import { environment } from '../../../../../environments/environment';
import { setPreferredPortal, syncPortalManifestAndTheme } from '../../../../core/auth/portal-preference';

@Component({
  selector: 'app-login-parent',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PwaInstallBannerComponent, PrivacyPolicyComponent],
  templateUrl: './login-parent.component.html',
  styleUrl: './login-parent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginParentComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly privacyService = inject(PrivacyService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly appVersion = environment.appVersion;

  // ── Reactive Form ──────────────────────────────────────────────────────────
  readonly loginForm = this.fb.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    acceptedPrivacy: [false, [Validators.requiredTrue]],
  });

  constructor() {
    setPreferredPortal('parent');
    syncPortalManifestAndTheme('parent');
  }

  // ── State ──────────────────────────────────────────────────────────────────
  readonly state = signal<LoginState>('idle');
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPrivacyModal = signal(false);
  readonly policyVersion = this.privacyService.currentVersion;

  readonly isLoading = computed(() => this.state() === 'loading');

  ngOnInit(): void {
    this.privacyService.getCurrentPolicy().subscribe();
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.isLoading()) return;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      if (this.loginForm.get('acceptedPrivacy')?.invalid) {
        this.errorMessage.set('Debes aceptar el Aviso de Privacidad para poder iniciar sesión.');
      }
      return;
    }

    const { email, password, acceptedPrivacy } = this.loginForm.getRawValue();
    this.state.set('loading');
    this.errorMessage.set(null);

    this.auth
      .loginParent(email!, password!, Boolean(acceptedPrivacy), this.policyVersion())
      .subscribe({
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
          if (err?.status === 428) {
            this.privacyService.getCurrentPolicy(true).subscribe();
            this.loginForm.patchValue({ acceptedPrivacy: false });
            this.loginForm.get('acceptedPrivacy')?.markAsTouched();
          }
          const msg =
            err?.error?.detail ??
            err?.error?.message ??
            'Credenciales incorrectas. Verifica tu usuario y contraseña.';
          this.errorMessage.set(msg);
          this.notification.error(msg);
        },
      });
  }

  openPrivacyModal(): void {
    this.showPrivacyModal.set(true);
  }

  closePrivacyModal(): void {
    this.showPrivacyModal.set(false);
  }

  acceptPrivacyFromModal(): void {
    this.loginForm.patchValue({ acceptedPrivacy: true });
    this.loginForm.get('acceptedPrivacy')?.markAsTouched();
    this.errorMessage.set(null);
    this.showPrivacyModal.set(false);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  // ── Form Helpers ───────────────────────────────────────────────────────────

  isFieldInvalid(field: 'email' | 'password' | 'acceptedPrivacy'): boolean {
    const control = this.loginForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  getFieldError(field: 'email' | 'password' | 'acceptedPrivacy'): string | null {
    const control = this.loginForm.get(field);
    if (!control?.errors || !control?.touched) return null;

    if (field === 'acceptedPrivacy' && control.errors['required']) {
      return 'Debes aceptar el Aviso de Privacidad y protección de datos del menor.';
    }
    if (control.errors['required']) return 'Este campo es obligatorio.';
    if (control.errors['minlength']) return 'La contraseña debe tener al menos 6 caracteres.';

    return null;
  }
}
