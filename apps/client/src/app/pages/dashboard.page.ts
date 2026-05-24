import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../core/session.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="panel intro">
      <p class="kicker">Mini app</p>
      <h2>Gestisci compleanni e promemoria senza uscire da Telegram.</h2>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <p class="kicker">Azioni</p>
          <h3>Vai subito al punto</h3>
        </div>
      </div>

      <div class="action-list">
        <a routerLink="/contacts" class="action-row">
          <div>
            <strong>Contatti</strong>
            <span>Lista contatti, origine e duplicati</span>
          </div>
          <small>Apri</small>
        </a>
        <a routerLink="/add" class="action-row">
          <div>
            <strong>Aggiungi compleanno</strong>
            <span>Inserimento manuale rapido</span>
          </div>
          <small>Nuovo</small>
        </a>
        <a routerLink="/sync" class="action-row">
          <div>
            <strong>Google sync</strong>
            <span>Importa compleanni dai contatti Google</span>
          </div>
          <small>Sync</small>
        </a>
        <a routerLink="/settings" class="action-row">
          <div>
            <strong>Promemoria</strong>
            <span>Attiva o sospendi il riepilogo giornaliero</span>
          </div>
          <small>Config</small>
        </a>
      </div>
    </section>

    @if (sessionStore.session(); as session) {
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="kicker">Stato</p>
            <h3>Panoramica account</h3>
          </div>
        </div>

        <div class="summary-list">
          <article class="summary-row">
            <span>Promemoria</span>
            <strong>{{ session.status === 'SUBSCRIBED' ? 'Attivi' : 'In pausa' }}</strong>
          </article>
          <article class="summary-row">
            <span>Google</span>
            <strong>{{ session.googleConnected ? 'Collegato' : 'Non collegato' }}</strong>
          </article>
          <article class="summary-row">
            <span>Email</span>
            <strong>{{ session.googleEmail || 'Nessuna' }}</strong>
          </article>
          <article class="summary-row">
            <span>Ultimo sync</span>
            <strong>{{ session.googleLastSyncedAt || 'Mai' }}</strong>
          </article>
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

    .intro {
      background: linear-gradient(180deg, rgba(51, 94, 144, 0.32), rgba(26, 36, 48, 0.96));
    }

    .section-head {
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
    h3,
    p {
      margin: 0;
    }

    h2 {
      font-size: 1.1rem;
      line-height: 1.35;
    }

    h3 {
      font-size: 1rem;
    }

    .action-list,
    .summary-list {
      display: grid;
      gap: 0.7rem;
    }

    .action-row,
    .summary-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      border: 1px solid var(--app-border);
      border-radius: 0.95rem;
      padding: 0.9rem;
      background: var(--app-surface-strong);
      text-decoration: none;
    }

    .action-row div,
    .summary-row {
      min-width: 0;
    }

    .action-row strong,
    .summary-row strong {
      display: block;
      color: var(--app-text);
      font-size: 0.95rem;
    }

    .action-row span,
    .summary-row span {
      display: block;
      color: var(--app-muted);
      font-size: 0.82rem;
      line-height: 1.35;
    }

    .action-row small {
      color: var(--app-accent);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .summary-row {
      align-items: flex-start;
      flex-direction: column;
    }
  `,
})
export class DashboardPageComponent {
  protected readonly sessionStore = inject(SessionStore);
}
