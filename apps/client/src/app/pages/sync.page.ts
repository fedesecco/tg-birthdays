import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GoogleSyncResult } from '@tg-birthdays/shared-types';
import { BackendApiService } from '../core/backend-api.service';
import { SessionStore } from '../core/session.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="section-head">
        <div>
          <p class="kicker">Google Contacts</p>
          <h2>Sincronizzazione compleanni</h2>
        </div>
        <button type="button" class="primary-button" (click)="runSync()" [disabled]="loading()">
          {{ loading() ? 'Sync in corso...' : 'Sincronizza ora' }}
        </button>
      </div>

      @if (error()) {
        <p class="notice error">{{ error() }}</p>
      }

      @if (authUrl()) {
        <div class="notice auth-box">
          <strong>Account Google non collegato</strong>
          <p>Autorizza l'accesso e poi torna qui per eseguire il sync.</p>
          <a [href]="authUrl()!" target="_blank" rel="noreferrer">Apri autorizzazione Google</a>
        </div>
      }

      @if (result(); as syncResult) {
        <div class="stats-grid">
          <article><strong>{{ syncResult.totalWithBirthday }}</strong><span>Con compleanno</span></article>
          <article><strong>{{ syncResult.insertedCount }}</strong><span>Nuovi</span></article>
          <article><strong>{{ syncResult.updatedCount }}</strong><span>Aggiornati</span></article>
          <article><strong>{{ syncResult.skippedCount }}</strong><span>Gia importati</span></article>
          <article><strong>{{ syncResult.missingBirthdayCount }}</strong><span>Senza data</span></article>
          <article><strong>{{ syncResult.removedCount }}</strong><span>Rimossi</span></article>
        </div>

        <div class="result-list">
          @for (row of syncResult.rows; track row.displayName + row.status + row.birthDay + row.birthMonth) {
            <article class="result-row">
              <div class="result-main">
                <strong>{{ row.displayName }}</strong>
                <span>{{ formatBirthDate(row.birthDay, row.birthMonth, row.birthYear) }}</span>
              </div>
              <span class="state-pill">{{ row.status }}</span>
            </article>
          }
        </div>
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

    .section-head {
      display: grid;
      gap: 0.8rem;
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

    .primary-button {
      justify-self: start;
      border: 0;
      border-radius: 999px;
      padding: 0.78rem 1rem;
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

    .auth-box {
      display: grid;
      gap: 0.35rem;
    }

    .auth-box strong {
      color: var(--app-text);
    }

    .auth-box a {
      color: var(--app-accent);
      font-weight: 700;
      text-decoration: none;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.65rem;
    }

    .stats-grid article {
      display: grid;
      gap: 0.2rem;
      border: 1px solid var(--app-border);
      border-radius: 0.95rem;
      padding: 0.85rem;
      background: var(--app-surface-strong);
    }

    .stats-grid strong {
      font-size: 1.05rem;
    }

    .stats-grid span {
      color: var(--app-muted);
      font-size: 0.78rem;
    }

    .result-list {
      display: grid;
      gap: 0.65rem;
    }

    .result-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      border: 1px solid var(--app-border);
      border-radius: 0.95rem;
      padding: 0.9rem;
      background: var(--app-surface-strong);
    }

    .result-main {
      min-width: 0;
      display: grid;
      gap: 0.25rem;
    }

    .result-main strong {
      font-size: 0.95rem;
    }

    .result-main span {
      color: var(--app-muted);
      font-size: 0.82rem;
    }

    .state-pill {
      flex: 0 0 auto;
      border-radius: 999px;
      padding: 0.3rem 0.55rem;
      background: var(--app-accent-soft);
      color: #cfe0ff;
      font-size: 0.74rem;
      font-weight: 700;
      text-align: center;
    }
  `,
})
export class SyncPageComponent {
  private readonly api = inject(BackendApiService);
  private readonly sessionStore = inject(SessionStore);

  protected readonly authUrl = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly result = signal<GoogleSyncResult | null>(null);

  protected async runSync() {
    this.loading.set(true);
    this.error.set(null);
    this.authUrl.set(null);

    try {
      const response = await this.api.syncGoogle();
      if (!response.connected) {
        this.authUrl.set(response.authUrl);
        return;
      }

      this.result.set(response.result);
      await this.sessionStore.refresh();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Sync Google fallita');
    } finally {
      this.loading.set(false);
    }
  }

  protected formatBirthDate(day: number | null, month: number | null, year: number | null) {
    if (!day || !month) {
      return '-';
    }

    const date = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
    return year ? `${date}/${year}` : date;
  }
}
