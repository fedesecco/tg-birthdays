import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BackendApiService } from '../core/backend-api.service';
import { SessionStore } from '../core/session.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="section-head">
        <div>
          <p class="kicker">Preferenze</p>
          <h2>Promemoria</h2>
        </div>
      </div>

      @if (sessionStore.session(); as session) {
        <div class="settings-list">
          <article class="setting-row">
            <span>Stato attuale</span>
            <strong>{{ session.status === 'SUBSCRIBED' ? 'Promemoria attivi' : 'Promemoria in pausa' }}</strong>
            <small>
              {{
                session.status === 'SUBSCRIBED'
                  ? 'Riceverai il riepilogo giornaliero.'
                  : 'Il backend non inviera il riepilogo giornaliero.'
              }}
            </small>
          </article>

          <article class="setting-row">
            <span>Google</span>
            <strong>{{ session.googleConnected ? 'Collegato' : 'Non collegato' }}</strong>
            <small>{{ session.googleEmail || 'Nessuna email collegata' }}</small>
          </article>
        </div>

        <button type="button" class="primary-button" (click)="toggleReminders()" [disabled]="loading()">
          {{
            loading()
              ? 'Aggiornamento...'
              : session.status === 'SUBSCRIBED'
                ? 'Disattiva promemoria'
                : 'Riattiva promemoria'
          }}
        </button>
      }

      @if (error()) {
        <p class="notice error">{{ error() }}</p>
      }
    </section>
  `,
  styles: `
    .panel {
      display: grid;
      gap: 0.9rem;
      border: 1px solid var(--app-border);
      border-radius: 1.15rem;
      padding: 1rem;
      background: var(--app-surface);
    }

    .kicker {
      margin: 0 0 0.3rem;
      color: var(--app-muted);
      font-size: 0.73rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    h2,
    p {
      margin: 0;
    }

    .settings-list {
      display: grid;
      gap: 0.7rem;
    }

    .setting-row {
      display: grid;
      gap: 0.22rem;
      border: 1px solid var(--app-border);
      border-radius: 0.95rem;
      padding: 0.9rem;
      background: var(--app-surface-strong);
    }

    .setting-row span,
    .setting-row small {
      color: var(--app-muted);
      font-size: 0.82rem;
      line-height: 1.35;
    }

    .setting-row strong {
      font-size: 0.95rem;
    }

    .primary-button {
      justify-self: start;
      border: 0;
      border-radius: 999px;
      padding: 0.8rem 1rem;
      background: var(--app-accent);
      color: #08111b;
      font-size: 0.86rem;
      font-weight: 700;
    }

    .notice {
      border-radius: 0.95rem;
      padding: 0.9rem;
      background: var(--app-surface-strong);
      color: var(--app-muted);
    }

    .notice.error {
      background: rgba(120, 30, 40, 0.42);
      color: #ffd9dc;
    }
  `,
})
export class SettingsPageComponent {
  private readonly api = inject(BackendApiService);
  protected readonly sessionStore = inject(SessionStore);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async toggleReminders() {
    const session = this.sessionStore.session();
    if (!session) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.api.setReminders(session.status !== 'SUBSCRIBED');
      this.sessionStore.updateSession(response.session);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Errore aggiornamento impostazioni');
    } finally {
      this.loading.set(false);
    }
  }
}
