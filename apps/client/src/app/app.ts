import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionStore } from './core/session.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'tgb-root',
  template: `
    <div class="shell">
      <header class="topbar">
        <div class="identity">
          <p class="eyebrow">Birthday bot</p>
          @if (sessionStore.session(); as session) {
            <p class="meta">
              @if (session.name) {
                <span class="user-name">{{ session.name }}</span>
              }
            </p>
          } @else {
            <p class="meta">Caricamento sessione...</p>
          }
        </div>

        <button class="icon-button" type="button" (click)="sessionStore.refresh()" aria-label="Aggiorna sessione">
          Ricarica
        </button>
      </header>

      @if (sessionStore.error()) {
        <section class="banner error">{{ sessionStore.error() }}</section>
      }

      <main class="content">
        <nav class="nav-strip" aria-label="Sezioni">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/contacts" routerLinkActive="active">Contatti</a>
          <a routerLink="/add" routerLinkActive="active">Aggiungi</a>
        </nav>

        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      color: var(--app-text);
    }

    .shell {
      min-height: 100vh;
      max-width: 30rem;
      margin: 0 auto;
      padding: 0.85rem 0.75rem 1rem;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.2rem 0 0.85rem;
      background: linear-gradient(180deg, rgba(15, 23, 32, 0.96), rgba(15, 23, 32, 0.88) 80%, rgba(15, 23, 32, 0));
      backdrop-filter: blur(14px);
    }

    .identity {
      min-width: 0;
    }

    .eyebrow {
      margin: 0 0 0.25rem;
      color: var(--app-muted);
      font-size: 0.73rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: var(--app-text);
      font-size: 1.45rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      align-items: center;
      margin: 0.45rem 0 0;
      color: var(--app-muted);
      font-size: 0.88rem;
    }

    .user-name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .icon-button {
      flex: 0 0 auto;
      border: 1px solid var(--app-border);
      border-radius: 999px;
      padding: 0.72rem 0.95rem;
      background: rgba(29, 39, 51, 0.9);
      color: var(--app-text);
      font: inherit;
      font-size: 0.83rem;
      font-weight: 700;
    }

    .content {
      display: grid;
      gap: 0.9rem;
    }

    .nav-strip {
      display: flex;
      gap: 0.55rem;
      overflow-x: auto;
      padding-bottom: 0.15rem;
      scrollbar-width: none;
    }

    .nav-strip::-webkit-scrollbar {
      display: none;
    }

    .nav-strip a {
      flex: 0 0 auto;
      border: 1px solid var(--app-border);
      border-radius: 999px;
      padding: 0.68rem 0.9rem;
      background: var(--app-surface);
      color: var(--app-muted);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 700;
    }

    .nav-strip a.active {
      border-color: rgba(132, 182, 255, 0.32);
      background: rgba(52, 98, 156, 0.36);
      color: var(--app-text);
    }

    .banner {
      border-radius: 1rem;
      padding: 0.9rem 1rem;
    }

    .banner.error {
      background: rgba(120, 30, 40, 0.42);
      color: #ffd9dc;
    }
  `,
})
export class App {
  protected readonly sessionStore = inject(SessionStore);

  constructor() {
    const telegramWindow = window as Window & {
      Telegram?: {
        WebApp?: {
          initData?: string;
          ready?: () => void;
          expand?: () => void;
        };
      };
    };

    telegramWindow.Telegram?.WebApp?.ready?.();
    telegramWindow.Telegram?.WebApp?.expand?.();
    void this.initializeSession(telegramWindow);
  }

  private async initializeSession(telegramWindow: Window & {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }) {
    const initData = await this.waitForTelegramInitData(telegramWindow);
    if (telegramWindow.Telegram?.WebApp && !initData) {
      this.sessionStore.setError('Apri di nuovo la mini app da Telegram. I dati di autenticazione non sono arrivati.');
      return;
    }

    await this.sessionStore.refresh();
  }

  private waitForTelegramInitData(
    telegramWindow: Window & {
      Telegram?: {
        WebApp?: {
          initData?: string;
        };
      };
    }
  ) {
    return new Promise<string>((resolve) => {
      const existing = telegramWindow.Telegram?.WebApp?.initData ?? '';
      if (existing) {
        resolve(existing);
        return;
      }

      const startedAt = Date.now();
      const interval = window.setInterval(() => {
        const current = telegramWindow.Telegram?.WebApp?.initData ?? '';
        if (current) {
          window.clearInterval(interval);
          resolve(current);
          return;
        }

        if (Date.now() - startedAt >= 1500) {
          window.clearInterval(interval);
          resolve('');
        }
      }, 50);
    });
  }
}
