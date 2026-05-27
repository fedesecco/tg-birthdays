import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BackendApiService } from '../core/backend-api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel">
      <div class="section-head">
        <div>
          <p class="kicker">Inserimento rapido</p>
          <h2>Aggiungi un compleanno</h2>
        </div>
      </div>

      <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
        <label>
          <span>Nome e cognome</span>
          <input type="text" formControlName="displayName" placeholder="Mario Rossi" />
        </label>

        <div class="date-grid">
          <label>
            <span>Giorno</span>
            <input type="number" formControlName="birthDay" min="1" max="31" />
          </label>

          <label>
            <span>Mese</span>
            <input type="number" formControlName="birthMonth" min="1" max="12" />
          </label>

          <label>
            <span>Anno</span>
            <input type="number" formControlName="birthYear" min="1900" max="9999" placeholder="Opzionale" />
          </label>
        </div>

        <button class="primary-button" type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Salvataggio...' : 'Aggiungi contatto' }}
        </button>
      </form>

      @if (success()) {
        <p class="notice success">{{ success() }}</p>
      }

      @if (error()) {
        <p class="notice error">{{ error() }}</p>
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

    .form-grid,
    .date-grid {
      display: grid;
      gap: 0.8rem;
    }

    label {
      display: grid;
      gap: 0.35rem;
    }

    label span {
      color: var(--app-muted);
      font-size: 0.8rem;
      font-weight: 700;
    }

    input {
      width: 100%;
      border: 1px solid var(--app-border);
      border-radius: 0.95rem;
      padding: 0.88rem 0.95rem;
      background: var(--app-surface-strong);
      color: var(--app-text);
    }

    .primary-button {
      justify-self: start;
      border: 0;
      border-radius: 999px;
      padding: 0.8rem 1rem;
      background: var(--app-accent);
      color: #08111b;
      font-size: 0.86rem;
      font-weight: 700;
    }

    .notice {
      border-radius: 0.95rem;
      padding: 0.9rem;
      color: var(--app-text);
    }

    .notice.success {
      background: rgba(74, 222, 128, 0.16);
      color: #b3f7c4;
    }

    .notice.error {
      background: rgba(120, 30, 40, 0.42);
      color: #ffd9dc;
    }
  `,
})
export class AddContactPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(BackendApiService);

  protected readonly loading = signal(false);
  protected readonly success = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(50)]],
    birthDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    birthMonth: [1, [Validators.required, Validators.min(1), Validators.max(12)]],
    birthYear: [null as number | null],
  });

  protected async submit() {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.success.set(null);
    this.error.set(null);

    try {
      const value = this.form.getRawValue();
      const response = await this.api.addManualContact({
        displayName: value.displayName,
        birthDay: value.birthDay,
        birthMonth: value.birthMonth,
        birthYear: value.birthYear,
      });
      this.success.set(`Aggiunto ${response.contact.displayName}`);
      this.form.reset({ displayName: '', birthDay: 1, birthMonth: 1, birthYear: null });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Inserimento fallito');
    } finally {
      this.loading.set(false);
    }
  }
}
