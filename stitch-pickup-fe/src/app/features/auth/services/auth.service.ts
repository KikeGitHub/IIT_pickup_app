import { Injectable } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Feature-level AuthService facade.
 * Re-exports the core AuthService for use within the auth feature.
 * This avoids direct coupling to the core service from components.
 *
 * SOLID: D — Dependency inversion through this facade.
 */
@Injectable({ providedIn: 'root' })
export class FeatureAuthService extends AuthService {}
