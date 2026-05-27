import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { BirthdayContact, DuplicateCandidate } from '@tg-birthdays/shared-types';
import { BackendApiService } from '../core/backend-api.service';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 250;
const MONTH_NAMES = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
] as const;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="section-head">
        <div>
          <p class="kicker">Archivio</p>
          <h2>Contatti</h2>
        </div>
      </div>

      <div class="toolbar">
        <div class="filter-row" role="tablist" aria-label="Filtri origine">
          @for (source of filters; track source.value) {
            <button
              type="button"
              class="filter-chip"
              [class.active]="selectedFilter() === source.value"
              (click)="applyFilter(source.value)"
            >
              {{ source.label }}
            </button>
          }
        </div>

        <button type="button" class="primary-button" (click)="scanDuplicates()" [disabled]="duplicatesLoading()">
          {{ duplicatesLoading() ? 'Analisi...' : 'Trova doppi' }}
        </button>
      </div>

      <label class="search-field">
        <span class="sr-only">Cerca per nome o cognome</span>
        <input
          type="search"
          [value]="searchTerm()"
          (input)="onSearchInput(($any($event.target).value ?? '').toString())"
          placeholder="Cerca nome o cognome"
        />
      </label>

      @if (error()) {
        <p class="notice error">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="notice">Caricamento contatti...</p>
      } @else {
        <div class="list">
          @for (contact of contacts(); track contact.id) {
            <article class="row-card">
              <div class="row-main">
                <strong>{{ contact.displayName }}</strong>
                <span>{{ formatBirthDate(contact) }}</span>
              </div>
              <span class="source-pill" [class.google]="contact.source === 'google'">{{ contact.source }}</span>
            </article>
          } @empty {
            <p class="notice">Nessun contatto per questa ricerca.</p>
          }
        </div>
      }

      <div class="pagination">
        <p class="page-summary">
          @if (total() > 0) {
            {{ visibleRangeLabel() }} di {{ total() }}
          } @else {
            0 risultati
          }
        </p>

        <div class="page-actions">
          <button type="button" class="secondary-button" (click)="goToPreviousPage()" [disabled]="!canGoPrevious() || loading()">
            Indietro
          </button>
          <button type="button" class="secondary-button" (click)="goToNextPage()" [disabled]="!canGoNext() || loading()">
            Avanti
          </button>
        </div>
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

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.85rem;
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
    }

    .search-field {
      display: block;
      margin-bottom: 0.85rem;
    }

    .search-field input {
      width: 100%;
      border: 1px solid var(--app-border);
      border-radius: 0.95rem;
      background: var(--app-surface-strong);
      color: var(--app-text);
      padding: 0.85rem 0.95rem;
      font: inherit;
    }

    .search-field input::placeholder {
      color: var(--app-muted);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
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
    .notice,
    .page-summary {
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

    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 0.85rem;
    }

    .page-actions {
      display: flex;
      gap: 0.55rem;
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
export class ContactsPageComponent implements OnDestroy {
  private readonly api = inject(BackendApiService);
  private searchDebounceTimer: number | null = null;

  protected readonly contacts = signal<BirthdayContact[]>([]);
  protected readonly duplicates = signal<DuplicateCandidate[]>([]);
  protected readonly duplicatesLoading = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedFilter = signal<'all' | 'manual' | 'google'>('all');
  protected readonly searchTerm = signal('');
  protected readonly total = signal(0);
  protected readonly offset = signal(0);
  protected readonly filters = [
    { value: 'all' as const, label: 'Tutti' },
    { value: 'manual' as const, label: 'Manuali' },
    { value: 'google' as const, label: 'Google' },
  ];

  protected readonly canGoPrevious = computed(() => this.offset() > 0);
  protected readonly canGoNext = computed(() => this.offset() + this.contacts().length < this.total());
  protected readonly visibleRangeLabel = computed(() => {
    const total = this.total();
    if (total === 0) {
      return '0';
    }

    const start = this.offset() + 1;
    const end = this.offset() + this.contacts().length;
    return `${start}-${end}`;
  });

  constructor() {
    void this.loadContacts();
  }

  ngOnDestroy() {
    if (this.searchDebounceTimer !== null) {
      window.clearTimeout(this.searchDebounceTimer);
    }
  }

  protected onSearchInput(value: string) {
    this.searchTerm.set(value);
    this.offset.set(0);
    this.duplicates.set([]);

    if (this.searchDebounceTimer !== null) {
      window.clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = window.setTimeout(() => {
      void this.loadContacts();
    }, SEARCH_DEBOUNCE_MS);
  }

  protected applyFilter(filter: 'all' | 'manual' | 'google') {
    if (this.selectedFilter() === filter) {
      return;
    }

    this.selectedFilter.set(filter);
    this.offset.set(0);
    this.duplicates.set([]);
    void this.loadContacts();
  }

  protected goToPreviousPage() {
    if (!this.canGoPrevious()) {
      return;
    }

    this.offset.update((current) => Math.max(0, current - PAGE_SIZE));
    this.duplicates.set([]);
    void this.loadContacts();
  }

  protected goToNextPage() {
    if (!this.canGoNext()) {
      return;
    }

    this.offset.update((current) => current + PAGE_SIZE);
    this.duplicates.set([]);
    void this.loadContacts();
  }

  protected async loadContacts() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.api.getContacts({
        limit: PAGE_SIZE,
        offset: this.offset(),
        query: this.searchTerm().trim(),
        source: this.selectedFilter(),
      });
      this.contacts.set(response.contacts);
      this.total.set(response.total);
      this.offset.set(response.offset);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Errore caricamento contatti');
    } finally {
      this.loading.set(false);
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
      this.duplicates.set(response.duplicates);
      void this.loadContacts();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Errore merge duplicati');
    }
  }

  protected formatBirthDate(contact: BirthdayContact) {
    const monthName = MONTH_NAMES[contact.birthMonth - 1];
    const date = `${contact.birthDay} ${monthName ?? contact.birthMonth}`;
    return contact.birthYear ? `${date} ${contact.birthYear}` : date;
  }
}
