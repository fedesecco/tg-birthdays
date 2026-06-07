import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BirthdayContact, UpcomingBirthdayItem } from '@tg-birthdays/shared-types';
import { BackendApiService } from '../../core/backend-api.service';

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
  templateUrl: './upcoming.html',
  styleUrl: './upcoming.scss',
})
export class UpcomingPageComponent {
  private readonly api = inject(BackendApiService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly upcomingBirthdays = signal<UpcomingBirthdayItem[]>([]);

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
