import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BirthdayContact, DuplicateCandidate } from '@tg-birthdays/shared-types';
import { BackendApiService } from '../core/backend-api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="section-head">
        <div>
          <p class="kicker">Archivio</p>
          <h2>Contatti</h2>
        </div>
        <div class="actions">
          <button type="button" class="secondary-button" (click)="loadContacts()">Aggiorna</button>
          <button type="button" class="primary-button" (click)="scanDuplicates()" [disabled]="duplicatesLoading()">
            {{ duplicatesLoading() ? 'Analisi...' : 'Trova doppi' }}
          </button>
        </div>
      </div>

      <div class="filter-row" role="tablist" aria-label="Filtri origine">
        @for (source of filters; track source.value) {
          <button
            type="button"
            class="filter-chip"
            [class.active]="selectedFilter() === source.value"
            (click)="selectedFilter.set(source.value)"
          >
            {{ source.label }}
          </button>
        }
      </div>

      @if (error()) {
        <p class="notice error">{{ error() }}</p>
      }

      <div class="list">
        @for (contact of filteredContacts(); track contact.id) {
          <article class="row-card">
            <div class="row-main">
              <strong>{{ contact.displayName }}</strong>
              <span>{{ formatBirthDate(contact) }}</span>
            </div>
            <span class="source-pill" [class.google]="contact.source === 'google'">{{ contact.source }}</span>
          </article>
        } @empty {
          <p class="notice">Nessun contatto per questo filtro.</p>
        }
      </div>
    </section>

    @if (duplicates().length > 0) {
      <section class="panel">
        <div class="section-head compact">
          <div>
            <p class="kicker">Pulizia</p>
            <h2>Duplicati suggeriti</h2>
          </div>
          <button type="button" class="primary-button" (click)="mergeAllDuplicates()">Unisci tutti</button>
        </div>

        <div class="list">
          @for (candidate of duplicates(); track candidate.primary.id + '-' + candidate.duplicate.id) {
            <article class="duplicate-card">
              <strong>{{ candidate.confidence === 'exact' ? 'Duplicato certo' : 'Duplicato forte' }}</strong>
              <p>{{ candidate.reason }}</p>
              <div class="pair">
                <div>
                  <span class="pair-label">Tieni</span>
                  <b>{{ candidate.primary.displayName }}</b>
                  <small>{{ formatBirthDate(candidate.primary) }} - {{ candidate.primary.source }}</small>
                </div>
                <div>
                  <span class="pair-label">Rimuovi</span>
                  <b>{{ candidate.duplicate.displayName }}</b>
                  <small>{{ formatBirthDate(candidate.duplicate) }} - {{ candidate.duplicate.source }}</small>
                </div>
              </div>
            </article>
          }
        </div>
      </section>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.9rem;
    }

    .panel {
      border: 1px solid var(--app-border);
      border-radius: 1.15rem;
      padding: 1rem;
      background: var(--app-surface);
    }

    .section-head {
      display: grid;
      gap: 0.85rem;
      margin-bottom: 0.85rem;
    }

    .section-head.compact {
      margin-bottom: 1rem;
    }

    .actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
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

    .primary-button,
    .secondary-button,
    .filter-chip {
      border-radius: 999px;
      padding: 0.72rem 0.9rem;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .primary-button {
      border: 0;
      background: var(--app-accent);
      color: #08111b;
    }

    .secondary-button,
    .filter-chip {
      border: 1px solid var(--app-border);
      background: var(--app-surface-strong);
      color: var(--app-text);
    }

    .filter-row {
      display: flex;
      gap: 0.55rem;
      flex-wrap: wrap;
      margin-bottom: 0.85rem;
    }

    .filter-chip.active {
      background: var(--app-accent-soft);
      border-color: rgba(132, 182, 255, 0.32);
      color: var(--app-text);
    }

    .list {
      display: grid;
      gap: 0.65rem;
    }

    .row-card,
    .duplicate-card {
      border: 1px solid var(--app-border);
      border-radius: 0.95rem;
      background: var(--app-surface-strong);
      padding: 0.9rem;
    }

    .row-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .row-main {
      min-width: 0;
      display: grid;
      gap: 0.25rem;
    }

    .row-main strong {
      font-size: 0.95rem;
    }

    .row-main span,
    .duplicate-card p,
    .duplicate-card small,
    .notice {
      color: var(--app-muted);
      font-size: 0.82rem;
      line-height: 1.35;
    }

    .source-pill {
      flex: 0 0 auto;
      border-radius: 999px;
      padding: 0.3rem 0.55rem;
      background: rgba(137, 87, 229, 0.18);
      color: #cfb7ff;
      font-size: 0.74rem;
      font-weight: 700;
      text-transform: capitalize;
    }

    .source-pill.google {
      background: rgba(74, 222, 128, 0.16);
      color: #9af2b1;
    }

    .notice {
      border-radius: 0.95rem;
      padding: 0.9rem;
      background: var(--app-surface-soft);
    }

    .notice.error {
      background: rgba(120, 30, 40, 0.42);
      color: #ffd9dc;
    }

    .duplicate-card {
      display: grid;
      gap: 0.55rem;
    }

    .pair {
      display: grid;
      gap: 0.7rem;
    }

    .pair div {
      display: grid;
      gap: 0.18rem;
    }

    .pair-label {
      color: var(--app-muted);
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
  `,
})
export class ContactsPageComponent {
  private readonly api = inject(BackendApiService);

  protected readonly contacts = signal<BirthdayContact[]>([]);
  protected readonly duplicates = signal<DuplicateCandidate[]>([]);
  protected readonly duplicatesLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedFilter = signal<'all' | 'manual' | 'google'>('all');
  protected readonly filters = [
    { value: 'all' as const, label: 'Tutti' },
    { value: 'manual' as const, label: 'Manuali' },
    { value: 'google' as const, label: 'Google' },
  ];

  protected readonly filteredContacts = computed(() => {
    const selected = this.selectedFilter();
    if (selected === 'all') {
      return this.contacts();
    }

    return this.contacts().filter((contact) => contact.source === selected);
  });

  constructor() {
    void this.loadContacts();
  }

  protected async loadContacts() {
    this.error.set(null);
    try {
      const response = await this.api.getContacts();
      this.contacts.set(response.contacts);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Errore caricamento contatti');
    }
  }

  protected async scanDuplicates() {
    this.duplicatesLoading.set(true);
    this.error.set(null);
    try {
      const response = await this.api.getDuplicates();
      this.duplicates.set(response.duplicates);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Errore analisi duplicati');
    } finally {
      this.duplicatesLoading.set(false);
    }
  }

  protected async mergeAllDuplicates() {
    this.error.set(null);
    try {
      const response = await this.api.mergeDuplicates(
        this.duplicates().map((candidate) => ({
          primaryContactId: candidate.primary.id,
          duplicateContactId: candidate.duplicate.id,
        }))
      );
      this.contacts.set(response.contacts);
      this.duplicates.set(response.duplicates);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Errore merge duplicati');
    }
  }

  protected formatBirthDate(contact: BirthdayContact) {
    const date = `${String(contact.birthDay).padStart(2, '0')}/${String(contact.birthMonth).padStart(2, '0')}`;
    return contact.birthYear ? `${date}/${contact.birthYear}` : date;
  }
}
