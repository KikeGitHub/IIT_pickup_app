import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  PrivacyService,
  PrivacyPolicyDocument,
  PrivacyConsentRecord,
  FALLBACK_PRIVACY_POLICY,
} from '../../../../core/services/privacy.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyComponent implements OnInit {
  private readonly privacyService = inject(PrivacyService);
  private readonly authService = inject(AuthService);

  /** Cuando se muestra como modal embebido en Login o Portal */
  @Input() embedded = false;
  /** Muestra botón explícito para aceptar y cerrar desde modal */
  @Input() showAcceptButton = false;
  @Output() closed = new EventEmitter<void>();
  @Output() acceptedFromModal = new EventEmitter<string>();

  readonly policy = signal<PrivacyPolicyDocument>(FALLBACK_PRIVACY_POLICY);
  readonly isLoading = signal<boolean>(true);
  readonly myConsents = signal<PrivacyConsentRecord[]>([]);
  readonly isParentAuthenticated = signal<boolean>(false);

  ngOnInit(): void {
    this.privacyService.getCurrentPolicy().subscribe({
      next: (doc) => {
        this.policy.set(doc);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });

    if (this.authService.isAuthenticated() && this.authService.userRole() === 'PARENT') {
      this.isParentAuthenticated.set(true);
      this.privacyService.getMyConsents().subscribe({
        next: (records) => this.myConsents.set(records),
        error: () => {},
      });
    }
  }

  printPolicy(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  onAcceptAndClose(): void {
    this.acceptedFromModal.emit(this.policy().version);
  }
}
