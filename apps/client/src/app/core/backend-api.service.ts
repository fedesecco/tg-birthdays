import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BirthdayContact,
  DuplicateCandidate,
  GoogleSyncResult,
  ManualContactInput,
  MergeDuplicateRequest,
  SessionSummary,
} from '@tg-birthdays/shared-types';
import { firstValueFrom } from 'rxjs';
import { getApiBaseUrl } from './api-base-url';

type SyncResponse =
  | { connected: true; result: GoogleSyncResult }
  | { connected: false; authUrl: string };

@Injectable({ providedIn: 'root' })
export class BackendApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${getApiBaseUrl()}/api`;

  async getSession() {
    return firstValueFrom(
      this.http.get<{ session: SessionSummary }>(`${this.baseUrl}/session`, {
        headers: this.authHeaders(),
      })
    );
  }

  async getContacts() {
    return firstValueFrom(
      this.http.get<{ contacts: BirthdayContact[] }>(`${this.baseUrl}/contacts`, {
        headers: this.authHeaders(),
      })
    );
  }

  async addManualContact(input: ManualContactInput) {
    return firstValueFrom(
      this.http.post<{ contact: BirthdayContact }>(`${this.baseUrl}/contacts/manual`, input, {
        headers: this.authHeaders(),
      })
    );
  }

  async getDuplicates() {
    return firstValueFrom(
      this.http.get<{ duplicates: DuplicateCandidate[] }>(`${this.baseUrl}/contacts/duplicates`, {
        headers: this.authHeaders(),
      })
    );
  }

  async mergeDuplicates(pairs: MergeDuplicateRequest[]) {
    return firstValueFrom(
      this.http.post<{ contacts: BirthdayContact[]; duplicates: DuplicateCandidate[] }>(
        `${this.baseUrl}/contacts/duplicates/merge`,
        { pairs },
        {
          headers: this.authHeaders(),
        }
      )
    );
  }

  async getGoogleAuthUrl() {
    return firstValueFrom(
      this.http.get<{ authUrl: string; connected: boolean }>(`${this.baseUrl}/google/auth-url`, {
        headers: this.authHeaders(),
      })
    );
  }

  async syncGoogle() {
    return firstValueFrom(
      this.http.post<SyncResponse>(`${this.baseUrl}/google/sync`, {}, { headers: this.authHeaders() })
    );
  }

  async setReminders(enabled: boolean) {
    return firstValueFrom(
      this.http.patch<{ session: SessionSummary }>(
        `${this.baseUrl}/settings/reminders`,
        { enabled },
        { headers: this.authHeaders() }
      )
    );
  }

  private authHeaders() {
    let headers = new HttpHeaders();
    const initData = this.telegramInitData();
    if (initData) {
      headers = headers.set('X-Telegram-Init-Data', initData);
      return headers;
    }

    const devUserId =
      new URLSearchParams(window.location.search).get('userId') ??
      window.localStorage.getItem('tgb-dev-user-id') ??
      '38455217';

    return headers.set('X-Dev-User-Id', devUserId);
  }

  private telegramInitData() {
    const telegramWindow = window as Window & {
      Telegram?: {
        WebApp?: {
          initData?: string;
        };
      };
    };

    return telegramWindow.Telegram?.WebApp?.initData ?? '';
  }
}
