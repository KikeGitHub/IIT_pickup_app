import { Component, inject, signal, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- 1. Floating / In-line Install Banner -->
    @if ((pwaService.canInstall() || (pwaService.isIOS() && !pwaService.isInstalled())) && !isDismissed()) {
      <aside class="pwa-banner" [class.pwa-banner--compact]="compact">
        <div class="pwa-banner-content">
          <div class="pwa-icon-wrap">
            <span class="pwa-emoji">📲</span>
          </div>
          <div class="pwa-text-wrap">
            <strong class="pwa-title">{{ title || 'Instala la App IIT Pickup' }}</strong>
            <p class="pwa-desc">{{ message || 'Acceso directo desde tu celular, más rápido y con notificaciones al instante.' }}</p>
          </div>
        </div>

        <div class="pwa-actions">
          <button type="button" class="btn-install" (click)="onInstall()">
            <span>📲 Instalar App</span>
          </button>
          <button type="button" class="btn-dismiss" (click)="dismiss()" title="Cerrar">&times;</button>
        </div>
      </aside>
    }

    <!-- 2. Modal Step-by-Step for iOS Safari -->
    @if (pwaService.showIOSGuide()) {
      <div class="ios-modal-backdrop" (click)="pwaService.toggleIOSGuide(false)">
        <div class="ios-modal-card" (click)="$event.stopPropagation()">
          <header class="ios-modal-header">
            <h3>📲 Instalar en iPhone / iPad</h3>
            <button type="button" class="btn-close" (click)="pwaService.toggleIOSGuide(false)">&times;</button>
          </header>

          <div class="ios-modal-body">
            <p class="ios-intro">Para instalar <strong>IIT Pickup</strong> en tu pantalla de inicio de Apple:</p>

            <div class="ios-step">
              <span class="step-num">1</span>
              <p>Toca el botón <strong>Compartir</strong> en la barra de Safari (icono <span class="ios-icon">⎋</span> o <span class="ios-icon">⬆</span>).</p>
            </div>

            <div class="ios-step">
              <span class="step-num">2</span>
              <p>Desliza hacia abajo y selecciona <strong>"Agregar a la pantalla de inicio"</strong> (<span class="ios-icon">➕</span>).</p>
            </div>

            <div class="ios-step">
              <span class="step-num">3</span>
              <p>Toca <strong>"Agregar"</strong> en la esquina superior derecha y ¡listo!</p>
            </div>
          </div>

          <footer class="ios-modal-footer">
            <button type="button" class="btn-done" (click)="pwaService.toggleIOSGuide(false)">
              Entendido
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .pwa-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 16px;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      color: white;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.15);
      margin: 10px 0;
      animation: slideDown 0.3s ease-out;

      &--compact {
        padding: 8px 12px;
        font-size: 12px;
      }
    }

    .pwa-banner-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pwa-icon-wrap {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 20px;
    }

    .pwa-text-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .pwa-title {
        font-size: 13px;
        font-weight: 700;
        color: white;
      }

      .pwa-desc {
        margin: 0;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .pwa-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .btn-install {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      background: #2563eb;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;

      &:hover {
        background: #1d4ed8;
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4);
      }
    }

    .btn-dismiss {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 20px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;

      &:hover { color: white; }
    }

    // Modal iOS
    .ios-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 16px;
    }

    .ios-modal-card {
      background: white;
      color: #0f172a;
      width: 100%;
      max-width: 440px;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
      overflow: hidden;
      animation: modalPop 0.2s ease-out;
    }

    .ios-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      color: white;
      h3 { margin: 0; font-size: 16px; font-weight: bold; color: white; }
      .btn-close { background: none; border: none; font-size: 22px; color: rgba(255,255,255,0.7); cursor: pointer; &:hover { color: white; } }
    }

    .ios-modal-body {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .ios-intro { margin: 0; font-size: 13px; color: #475569; }

      .ios-step {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 10px 12px;
        border-radius: 10px;

        .step-num {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          font-size: 12px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        p { margin: 0; font-size: 13px; color: #1e293b; }
        .ios-icon { font-size: 14px; font-weight: bold; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
      }
    }

    .ios-modal-footer {
      padding: 12px 18px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;

      .btn-done {
        padding: 8px 18px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        &:hover { background: #1d4ed8; }
      }
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes modalPop {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    @media (max-width: 600px) {
      .pwa-banner {
        flex-direction: column;
        align-items: stretch;
      }
      .pwa-actions {
        justify-content: flex-end;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PwaInstallBannerComponent {
  readonly pwaService = inject(PwaService);

  @Input() title: string = '';
  @Input() message: string = '';
  @Input() compact: boolean = false;

  readonly isDismissed = signal<boolean>(false);

  onInstall(): void {
    this.pwaService.installApp();
  }

  dismiss(): void {
    this.isDismissed.set(true);
  }
}
