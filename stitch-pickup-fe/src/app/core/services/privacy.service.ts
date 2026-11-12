import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, shareReplay, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PrivacyPolicySection {
  id: string;
  title: string;
  body: string;
  highlights: string[];
}

export interface PrivacyPolicyDocument {
  version: string;
  effectiveDate: string;
  sha256Hash: string;
  title: string;
  responsibleName: string;
  responsibleAddress: string;
  arcoEmail: string;
  authorityName: string;
  simplifiedSummary: string;
  sections: PrivacyPolicySection[];
}

export interface PrivacyConsentRecord {
  id: string;
  policyVersion: string;
  policyHash: string;
  consentScope: string;
  accepted: boolean;
  acceptedAt: string;
}

export const FALLBACK_PRIVACY_POLICY: PrivacyPolicyDocument = {
  version: '2026.1',
  effectiveDate: '2026-11-11',
  sha256Hash: 'local-offline-fallback',
  title: 'Aviso de Privacidad Integral y Protección de Datos de Menores — IIT Pickup',
  responsibleName: 'Instituto Inglés de Toluca',
  responsibleAddress: 'Toluca de Lerdo, Estado de México (Domicilio institucional registrado ante la SEP)',
  arcoEmail: 'privacidad@institutoingles.edu.mx',
  authorityName: 'Secretaría Anticorrupción y Buen Gobierno',
  simplifiedSummary:
    'El Instituto Inglés de Toluca es responsable del tratamiento de tus datos personales y los del menor a tu cargo exclusivamente para coordinar la entrega escolar segura en IIT Pickup. La fotografía del menor es estrictamente opcional, no se utiliza biometría ni existen fines publicitarios.',
  sections: [
    {
      id: 'responsable',
      title: '1. Identidad y Domicilio del Responsable',
      body: 'Instituto Inglés de Toluca, con domicilio en Toluca de Lerdo, Estado de México, es el Responsable del uso, custodia y protección de los datos personales recabados en IIT Pickup conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP vigente).',
      highlights: [
        'Titular y Responsable del tratamiento: Instituto Inglés de Toluca.',
        'El desarrollador tecnológico actúa únicamente como Encargado de infraestructura sin derechos de uso comercial ni propiedad sobre los datos.',
      ],
    },
    {
      id: 'datos-menores',
      title: '2. Datos Personales Recabados y Protección Reforzada a Menores',
      body: 'Aplicando el principio de minimización de datos y el interés superior de la niñez, la plataforma trata únicamente la información estrictamente indispensable para validar la entrega segura del alumno.',
      highlights: [
        'Del padre, madre o tutor legal: nombre completo, usuario/correo de acceso y registro de alertas/recepción.',
        'Del alumno (menor de edad): nombre completo, nivel/grado/grupo escolar y, de forma 100% OPCIONAL, fotografía de identificación visual.',
        'SIN BIOMETRÍA NI RASTREO GPS: No se realiza reconocimiento facial automatizado ni rastreo de ubicación continua.',
      ],
    },
    {
      id: 'foto-opcional',
      title: '3. Fotografía Opcional del Alumno y Eliminación Inmediata',
      body: 'La carga de fotografía del menor es completamente voluntaria. El sistema de recogida funciona al 100% únicamente con el nombre y grupo del alumno.',
      highlights: [
        'Si decides subir una fotografía desde el portal de padres, se utiliza exclusivamente para verificación visual humana por el docente en puerta.',
        'Puedes eliminar o reemplazar la fotografía en cualquier momento desde tu portal; al hacerlo, el archivo se borra definitivamente.',
      ],
    },
    {
      id: 'finalidades',
      title: '4. Finalidades del Tratamiento (Cero Uso Comercial)',
      body: 'Tus datos y los del menor se tratan única y exclusivamente para finalidades primarias indispensables para la seguridad escolar.',
      highlights: [
        'Notificar en tiempo real la llegada del padre o tutor autorizado al plantel.',
        'Generar bitácoras históricas internas de entrega para control escolar.',
        'Finalidades secundarias: NINGUNA. Cero publicidad, cero perfilamiento y cero venta de datos.',
      ],
    },
    {
      id: 'arco',
      title: '5. Derechos ARCO, Revocación y Autoridad Garante',
      body: 'Como padre, madre o tutor legal, puedes ejercer en todo momento tus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) o revocar tu consentimiento.',
      highlights: [
        'Canal oficial ARCO: privacidad@institutoingles.edu.mx o directamente en Dirección del plantel.',
        'Autoridad garante en México: Secretaría Anticorrupción y Buen Gobierno.',
      ],
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class PrivacyService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiBaseUrl}/privacy`;

  readonly policyDoc = signal<PrivacyPolicyDocument>(FALLBACK_PRIVACY_POLICY);
  readonly currentVersion = signal<string>(FALLBACK_PRIVACY_POLICY.version);
  private cachedRequest$?: Observable<PrivacyPolicyDocument>;

  getCurrentPolicy(forceRefresh = false): Observable<PrivacyPolicyDocument> {
    if (!this.cachedRequest$ || forceRefresh) {
      this.cachedRequest$ = this.http.get<PrivacyPolicyDocument>(`${this.api}/current`).pipe(
        tap((doc) => {
          this.policyDoc.set(doc);
          this.currentVersion.set(doc.version);
        }),
        catchError(() => of(this.policyDoc())),
        shareReplay(1)
      );
    }
    return this.cachedRequest$;
  }

  acceptPolicy(policyVersion: string, scope = 'LOGIN_PRIVACY_POLICY'): Observable<PrivacyConsentRecord> {
    return this.http.post<PrivacyConsentRecord>(`${this.api}/accept`, {
      policyVersion,
      accepted: true,
      scope,
    });
  }

  getMyConsents(): Observable<PrivacyConsentRecord[]> {
    return this.http.get<PrivacyConsentRecord[]>(`${this.api}/my-consents`);
  }
}

