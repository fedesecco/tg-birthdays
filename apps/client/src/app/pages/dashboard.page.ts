import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GoogleSyncResult } from '@tg-birthdays/shared-types';
import { BackendApiService } from '../core/backend-api.service';
import { SessionStore } from '../core/session.store';

const GOOGLE_SYNC_COOLDOWN_MS = 60 * 60 * 1000;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sessionStore.session(); as session) {
      <section class="panel">
        <div class="card-head">
          <div>
            <p class="kicker">Preferenze</p>
            <h2>Promemoria</h2>
          </div>
          <span class="status-pill" [class.paused]="session.status === 'PAUSED'">
            {{ session.status === 'SUBSCRIBED' ? 'Attivi' : 'In pausa' }}
          </span>
        </div>

        <p class="description">
          {{
            session.status === 'SUBSCRIBED'
              ? 'Riceverai il riepilogo giornaliero dei compleanni.'
              : 'Il bot non inviera il riepilogo giornaliero finche non riattivi i promemoria.'
          }}
        </p>

        <button type="button" class="primary-button" (click)="toggleReminders()" [disabled]="reminderLoading()">
          {{
            reminderLoading()
              ? 'Aggiornamento...'
              : session.status === 'SUBSCRIBED'
                ? 'Disabilita promemoria'
                : 'Abilita promemoria'
          }}
        </button>

        @if (reminderError()) {
          <p class="notice error">{{ reminderError() }}</p>
        }
      </section>

      <section class="panel">
        <div class="card-head">
          <div>
            <p class="kicker">Google Contacts</p>
            <h2>Sincronizzazione</h2>
          </div>
          <span class="status-pill" [class.paused]="!session.googleConnected">
            {{ session.googleConnected ? 'Collegato' : 'Scollegato' }}
          </span>
        </div>

        <div class="detail-list">
          <article class="detail-row">
            <span>Account</span>
            <strong>{{ session.googleEmail || 'Nessun account collegato' }}</strong>
          </article>
          <article class="detail-row">
            <span>Ultimo sync</span>
            <strong>{{ formatSyncDate(session.googleLastSyncedAt) }}</strong>
          </article>
        </div>

        @if (syncCooldownLabel(); as cooldownLabel) {
          <p class="notice">{{ cooldownLabel }}</p>
        } @else {
          <p class="description">
            {{
              session.googleConnected
                ? 'Importa e aggiorna i compleanni dai contatti Google.'
                : 'Collega il tuo account Google per importare i compleanni.'
            }}
          </p>
        }

        <button
          type="button"
          class="primary-button"
          (click)="handleGoogleAction()"
          [disabled]="googleButtonDisabled()"
        >
          {{ googleButtonLabel() }}
        </button>

        @if (googleMessage()) {
          <p class="notice success">{{ googleMessage() }}</p>
        }

        @if (googleError()) {
          <p class="notice error">{{ googleError() }}</p>
        }
      </section>
    } @else {
      <section class="panel">
        <p class="kicker">Home</p>
        <h2>Caricamento in corso</h2>
        <p class="description">Sto recuperando stato promemoria e collegamento Google.</p>
      </section>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.9rem;
    }

    .panel {
      display: grid;
      gap: 0.9rem;
      border: 1px solid var(--app-border);
      border-radius: 1.15rem;
      padding: 1rem;
      background: var(--app-surface);
    }

    .card-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
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

    h2 {
      font-size: 1rem;
    }

    .description,
    .notice,
    .detail-row span {
      color: var(--app-muted);
      font-size: 0.82rem;
      line-height: 1.4;
    }

    .detail-list {
      display: grid;
      gap: 0.65rem;
    }

    .detail-row {
      display: grid;
      gap: 0.18rem;
      border: 1px solid var(--app-border);
      border-radius: 0.95rem;
      padding: 0.85rem 0.9rem;
      background: var(--app-surface-strong);
    }

    .detail-row strong {
      color: var(--app-text);
      font-size: 0.93rem;
    }

    .status-pill {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 0.3rem 0.55rem;
      background: rgba(74, 222, 128, 0.16);
      color: #8ef0a8;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .status-pill.paused {
      background: rgba(248, 113, 113, 0.16);
      color: #ffb0b0;
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

    .primary-button:disabled {
      opacity: 0.55;
    }

    .notice {
      border-radius: 0.95rem;
      padding: 0.9rem;
      background: var(--app-surface-strong);
    }

    .notice.success {
      background: rgba(74, 222, 128, 0.12);
      color: #b9f6c9;
    }

    .notice.error {
      background: rgba(120, 30, 40, 0.42);
      color: #ffd9dc;
    }
  `,
})
export class DashboardPageComponent {
  private readonly api = inject(BackendApiService);
  protected readonly sessionStore = inject(SessionStore);

  protected readonly reminderLoading = signal(false);
  protected readonly reminderError = signal<string | null>(null);
  protected readonly googleLoading = signal(false);
  protected readonly googleError = signal<string | null>(null);
  protected readonly googleMessage = signal<string | null>(null);

  protected readonly nextSyncAt = computed(() => {
    const lastSyncedAt = this.sessionStore.session()?.googleLastSyncedAt;
    if (!lastSyncedAt) {
      return null;
    }

    const parsed = Date.parse(lastSyncedAt);
    if (Number.isNaN(parsed)) {
      return null;
    }

    const nextSyncAt = new Date(parsed + GOOGLE_SYNC_COOLDOWN_MS);
    return nextSyncAt.getTime() > Date.now() ? nextSyncAt : null;
  });

  protected readonly syncCooldownLabel = computed(() => {
    const nextSyncAt = this.nextSyncAt();
    return nextSyncAt ? `Per limitare il carico, il prossimo sync sara disponibile alle ${this.formatDateTime(nextSyncAt)}.` : null;
  });

  protected readonly googleButtonDisabled = computed(() => {
    const session = this.sessionStore.session();
    if (!session) {
      return true;
    }

    return this.googleLoading() || (session.googleConnected && this.nextSyncAt() !== null);
  });

  protected readonly googleButtonLabel = computed(() => {
    const session = this.sessionStore.session();
    if (!session) {
      return 'Caricamento...';
    }

    if (this.googleLoading()) {
      return session.googleConnected ? 'Sync in corso...' : 'Apertura login...';
    }

    return session.googleConnected ? 'Sync Google' : 'Login Google';
  });

  protected async toggleReminders() {
    const session = this.sessionStore.session();
    if (!session) {
      return;
    }

    this.reminderLoading.set(true);
    this.reminderError.set(null);

    try {
      const response = await this.api.setReminders(session.status !== 'SUBSCRIBED');
      this.sessionStore.updateSession(response.session);
    } catch (error) {
      this.reminderError.set(this.readApiError(error, 'Errore aggiornamento promemoria'));
    } finally {
      this.reminderLoading.set(false);
    }
  }

  protected async handleGoogleAction() {
    const session = this.sessionStore.session();
    if (!session) {
      return;
    }

    this.googleLoading.set(true);
    this.googleError.set(null);
    this.googleMessage.set(null);

    try {
      if (!session.googleConnected) {
        const response = await this.api.getGoogleAuthUrl();
        this.openGoogleAuth(response.authUrl);
        return;
      }

      const response = await this.api.syncGoogle();
      if (!response.connected) {
        this.openGoogleAuth(response.authUrl);
        return;
      }

      this.googleMessage.set(this.buildSyncSummary(response.result));
      await this.sessionStore.refresh();
    } catch (error) {
      this.googleError.set(this.readApiError(error, 'Sync Google fallita'));
    } finally {
      this.googleLoading.set(false);
    }
  }

  protected formatSyncDate(value: string | null) {
    if (!value) {
      return 'Mai';
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Mai' : this.formatDateTime(parsed);
  }

  private buildSyncSummary(result: GoogleSyncResult) {
    return `Sync completata: ${result.insertedCount} nuovi, ${result.updatedCount} aggiornati, ${result.removedCount} rimossi.`;
  }

  private formatDateTime(value: Date) {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(value);
  }

  private openGoogleAuth(authUrl: string) {
    const opened = window.open(authUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = authUrl;
    }
  }

  private readApiError(error: unknown, fallback: string) {
    if (error instanceof HttpErrorResponse) {
      const responseMessage =
        typeof error.error?.message === 'string'
          ? error.error.message
          : typeof error.error === 'string'
            ? error.error
            : null;

      return responseMessage || error.message || fallback;
    }

    return error instanceof Error ? error.message : fallback;
  }
}
