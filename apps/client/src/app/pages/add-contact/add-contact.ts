import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BackendApiService } from '../../core/backend-api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './add-contact.html',
  styleUrl: './add-contact.scss',
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
