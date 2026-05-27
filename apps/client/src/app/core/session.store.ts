import { Injectable, computed, inject, signal } from '@angular/core';
import { SessionSummary } from '@tg-birthdays/shared-types';
import { BackendApiService } from './backend-api.service';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly api = inject(BackendApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly session = signal<SessionSummary | null>(null);
  readonly remindersEnabled = computed(() => this.session()?.status === 'SUBSCRIBED');

  async refresh() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.api.getSession();
      this.session.set(response.session);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Errore durante il caricamento sessione');
    } finally {
      this.loading.set(false);
    }
  }

  updateSession(session: SessionSummary) {
    this.session.set(session);
  }

  setError(message: string) {
    this.error.set(message);
  }
}
