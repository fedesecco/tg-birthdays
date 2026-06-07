import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BirthdayContact, UpcomingBirthdayItem } from '@tg-birthdays/shared-types';
import { BackendApiService } from '../core/backend-api.service';

const UPCOMING_WINDOW_DAYS = 30;
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
          <h2>Compleanni in arrivo</h2>
        </div>
      </div>

      @if (error()) {
        <p class="notice error">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="notice">Caricamento compleanni in arrivo...</p>
      } @else {
        <div class="list">
          @for (item of upcomingBirthdays(); track item.contact.id) {
            <article class="row-card">
              <div class="row-main">
                <strong>{{ item.contact.displayName }}</strong>
                <span>{{ relativeLabel(item.daysUntilBirthday) }} - {{ formatBirthDate(item.contact) }}</span>
              </div>

              <span class="countdown-pill" [style.--countdown-hue]="countdownHue(item.daysUntilBirthday)">
                {{ item.daysUntilBirthday }}G
              </span>
            </article>
          } @empty {
            <p class="notice">Nessun compleanno nei prossimi 30 giorni.</p>
          }
        </div>
      }
    </section>
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
      background:
        radial-gradient(circle at top right, rgba(105, 167, 255, 0.12), transparent 34%),
        var(--app-surface);
    }

    .section-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }

    h2,
    p {
      margin: 0;
    }

    .row-main span,
    .notice {
      color: var(--app-muted);
      font-size: 0.82rem;
      line-height: 1.35;
    }

    .summary-pill {
      flex: 0 0 auto;
      border: 1px solid rgba(132, 182, 255, 0.24);
      border-radius: 999px;
      padding: 0.32rem 0.62rem;
      background: rgba(52, 98, 156, 0.28);
      color: var(--app-text);
      font-size: 0.75rem;
      font-weight: 700;
    }

    .list {
      display: grid;
      gap: 0.65rem;
    }

    .row-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      border: 1px solid var(--app-border);
      border-radius: 0.95rem;
      padding: 0.9rem;
      background: var(--app-surface-strong);
    }

    .row-main {
      min-width: 0;
      display: grid;
      gap: 0.25rem;
    }

    .row-main strong {
      font-size: 0.95rem;
    }

    .countdown-pill {
      --countdown-hue: 0;
      flex: 0 0 auto;
      border: 1px solid hsla(var(--countdown-hue), 86%, 62%, 0.3);
      border-radius: 999px;
      padding: 0.32rem 0.58rem;
      background: hsla(var(--countdown-hue), 84%, 54%, 0.16);
      color: hsl(var(--countdown-hue), 86%, 72%);
      font-size: 0.76rem;
      font-weight: 700;
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
  `,
})
export class UpcomingPageComponent {
  private readonly api = inject(BackendApiService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly upcomingBirthdays = signal<UpcomingBirthdayItem[]>([]);
  protected readonly upcomingCount = computed(() => this.upcomingBirthdays().length);

  constructor() {
    void this.loadUpcomingBirthdays();
  }

  protected relativeLabel(daysUntilBirthday: number) {
    if (daysUntilBirthday === 0) {
      return 'Oggi compie gli anni';
    }

    if (daysUntilBirthday === 1) {
      return 'Compie gli anni domani';
    }

    return `Compie gli anni tra ${daysUntilBirthday} giorni`;
  }

  protected formatBirthDate(contact: BirthdayContact) {
    const monthName = MONTH_NAMES[contact.birthMonth - 1];
    const date = `${contact.birthDay} ${monthName ?? contact.birthMonth}`;
    return contact.birthYear ? `${date} ${contact.birthYear}` : date;
  }

  protected countdownHue(daysUntilBirthday: number) {
    return Math.round((Math.max(0, Math.min(UPCOMING_WINDOW_DAYS, daysUntilBirthday)) / UPCOMING_WINDOW_DAYS) * 120);
  }

  private async loadUpcomingBirthdays() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.api.getUpcomingBirthdays(UPCOMING_WINDOW_DAYS);
      this.upcomingBirthdays.set(response.birthdays);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Errore caricamento compleanni in arrivo');
    } finally {
      this.loading.set(false);
    }
  }
}
