import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GoogleSyncResult } from '@tg-birthdays/shared-types';
import { appVersion } from '../../core/app-version';
import { BackendApiService } from '../../core/backend-api.service';
import { SessionStore } from '../../core/session.store';

const GOOGLE_SYNC_COOLDOWN_MS = 60 * 60 * 1000;
const GOOGLE_AUTH_MESSAGE_SOURCE = 'tg-birthdays-google-auth';

type GoogleAuthPopupMessage =
  | {
      source: typeof GOOGLE_AUTH_MESSAGE_SOURCE;
      type: 'synced';
      result: GoogleSyncResult;
    }
  | {
      source: typeof GOOGLE_AUTH_MESSAGE_SOURCE;
      type: 'cooldown';
      message: string;
    };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPageComponent {
  private readonly api = inject(BackendApiService);
  protected readonly sessionStore = inject(SessionStore);
  protected readonly appVersion = appVersion;

  protected readonly reminderLoading = signal(false);
  protected readonly reminderError = signal<string | null>(null);
  protected readonly googleLoading = signal(false);
  protected readonly googleError = signal<string | null>(null);
  protected readonly googleMessage = signal<string | null>(null);
  protected readonly googleReconnectRequired = signal(false);

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

    if (!session.googleConnected && this.googleReconnectRequired()) {
      return 'Ricollega Google';
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
        this.googleReconnectRequired.set(false);
        const completion = await this.openGoogleAuth(response.authUrl);
        if (!completion) {
          return;
        }

        this.googleMessage.set(
          completion.type === 'synced' ? this.buildSyncSummary(completion.result) : completion.message
        );
        await this.sessionStore.refresh();
        return;
      }

      const response = await this.api.syncGoogle();
      if (!response.connected) {
        if (response.message) {
          this.googleMessage.set(response.message);
        }
        this.googleReconnectRequired.set(true);
        await this.sessionStore.refresh();
        this.openGoogleAuth(response.authUrl);
        return;
      }

      this.googleReconnectRequired.set(false);
      this.googleMessage.set(this.buildSyncSummary(response.result));
      await this.sessionStore.refresh();
    } catch (error) {
      this.googleError.set(this.readApiError(error, 'Sync Google fallita'));
    } finally {
      this.googleLoading.set(false);
    }
  }

  protected async disconnectGoogle() {
    this.googleLoading.set(true);
    this.googleError.set(null);
    this.googleMessage.set(null);

    try {
      const response = await this.api.disconnectGoogle();
      this.googleReconnectRequired.set(false);
      this.sessionStore.updateSession(response.session);
      this.googleMessage.set('Account Google disconnesso.');
    } catch (error) {
      this.googleError.set(this.readApiError(error, 'Disconnessione Google fallita'));
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

  private openGoogleAuth(authUrl: string): Promise<GoogleAuthPopupMessage | null> {
    return new Promise((resolve) => {
      const popup = window.open(authUrl, '_blank', 'noopener,noreferrer');
      if (!popup) {
        window.location.href = authUrl;
        resolve(null);
        return;
      }

      const cleanup = () => {
        window.removeEventListener('message', onMessage);
        window.clearInterval(closePoll);
      };

      const onMessage = (event: MessageEvent) => {
        const data = event.data;
        if (!this.isGoogleAuthPopupMessage(data)) {
          return;
        }

        cleanup();
        resolve(data);
      };

      const closePoll = window.setInterval(() => {
        if (!popup.closed) {
          return;
        }

        cleanup();
        resolve(null);
      }, 300);

      window.addEventListener('message', onMessage);
    });
  }

  private isGoogleAuthPopupMessage(value: unknown): value is GoogleAuthPopupMessage {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const payload = value as Record<string, unknown>;
    const source = payload['source'];
    const type = payload['type'];
    if (source !== GOOGLE_AUTH_MESSAGE_SOURCE || (type !== 'synced' && type !== 'cooldown')) {
      return false;
    }

    return type === 'cooldown' ? typeof payload['message'] === 'string' : payload['result'] != null;
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
