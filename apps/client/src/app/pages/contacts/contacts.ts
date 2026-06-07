import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { BirthdayContact, DuplicateCandidate } from '@tg-birthdays/shared-types';
import { BackendApiService } from '../../core/backend-api.service';

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
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
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
