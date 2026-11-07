import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { form, maxLength, required, validate } from '@angular/forms/signals';
import { DATE_ORDER, dateOrderMessage } from '../../utils/date-order';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AdjustmentService } from '../../services/adjustment-service';
import { PrivacyService } from '../../services/privacy.service';
import { PEOPLE, Person } from '../../models/splitz.model';
import { AdjustmentFieldsComponent } from './adjustment-fields.component';
import { SplitFieldsComponent } from './split-fields.component';
import { SplitStateStore } from './split-state.store';
import { AdjustmentFormModel, defaultAdjustmentModel } from './create-transaction.models';
import { buildAdjustmentPayload } from './transaction-payload';

@Component({
  selector: 'app-create-adjustment-form',
  standalone: true,
  imports: [AdjustmentFieldsComponent, SplitFieldsComponent],
  host: { class: 'block' },
  template: `
    <form (submit)="onSubmit($event)" class="flex flex-col gap-5">
      <app-adjustment-fields
        [model]="adjustmentModel()"
        [addition]="isAddition()"
        [descriptionField]="adjustmentForm.description"
        [amountField]="adjustmentForm.amount"
        [startDateField]="adjustmentForm.startDate"
        [endDateField]="adjustmentForm.endDate"
        (selectableChange)="setIsSelectable($event)"
        (additionChange)="isAddition.set($event)"
        (amountChange)="adjustmentModel.update((model) => ({ ...model, amount: $event }))"
      />
      @if (!adjustmentModel().isTrip) {
        <app-split-fields
          [amount]="adjustmentModel().amount"
          [people]="allPeople"
          [state]="splitStore.state()"
          (stateChange)="splitStore.apply($event)"
          (reset)="resetSplitFields()"
        />
      }
      <button
        type="submit"
        [disabled]="adjustmentForm().invalid() || submitting() || privacyService.isPrivacyMode()"
        class="min-h-12 w-full rounded-xl bg-ember text-[15px] font-semibold text-ground transition-[background-color,transform] duration-150 hover:bg-ember-ink active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
      >
        {{ submitting() ? 'Adding…' : adjustmentModel().isTrip ? 'Add trip' : 'Add one-off' }}
      </button>
    </form>

    <div class="mt-4 flex flex-col gap-3" aria-live="polite">
      @if (successMessage()) {
        <p class="border-t border-ink/10 pt-3 text-[13px] font-semibold text-avocado-ink">
          {{ successMessage() }}
        </p>
      }
      @if (errorMessage()) {
        <p
          role="alert"
          class="rounded-xl border border-cherry/30 bg-cherry-deep/60 px-3.5 py-3 text-[13px] text-cherry"
        >
          {{ errorMessage() }}
        </p>
      }
    </div>
  `,
})
export class CreateAdjustmentFormComponent {
  private adjustmentService = inject(AdjustmentService);
  private queryClient = inject(QueryClient);
  readonly privacyService = inject(PrivacyService);
  readonly splitStore = inject(SplitStateStore);

  readonly allPeople: Person[] = PEOPLE;

  readonly isAddition = signal<boolean>(true);
  readonly adjustmentModel = signal<AdjustmentFormModel>(defaultAdjustmentModel());

  readonly submitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly adjustmentForm = form(this.adjustmentModel, (schemaPath) => {
    required(schemaPath.description, { message: 'Description is required' });
    maxLength(schemaPath.description, 60, {
      message: 'Description must be 60 characters or fewer',
    });
    required(schemaPath.startDate, { message: 'Start date is required' });
    required(schemaPath.endDate, { message: 'End date is required' });
    validate(schemaPath.endDate, ({ value, valueOf }) => {
      const start = valueOf(schemaPath.startDate);
      const end = value();
      return start && end && end < start
        ? { kind: DATE_ORDER, message: dateOrderMessage(!!this.adjustmentModel().isTrip) }
        : null;
    });
  });

  /** Set by the Add tab's top switch (One-off or Trip). */
  readonly isTrip = input(false);

  private readonly syncTrip = effect(() => {
    const trip = this.isTrip();
    untracked(() => this.setIsTrip(trip));
  });

  /** Moving the first day past the last one carries the last day along with it. */
  private readonly startDate = computed(() => this.adjustmentModel().startDate);
  private readonly keepEndAfterStart = effect(() => {
    const start = this.startDate();
    untracked(() => {
      const model = this.adjustmentModel();
      if (start && model.endDate && model.endDate < start) {
        this.adjustmentModel.set({ ...model, endDate: start });
      }
    });
  });

  setIsTrip(value: boolean): void {
    this.adjustmentModel.update((m) => ({
      ...m,
      isTrip: value,
      // A new trip takes expenses straight away; it can be closed once it's over.
      isSelectable: value,
      amount: value ? 0.0 : m.amount,
    }));
    if (value) {
      this.isAddition.set(false);
    }
  }

  setIsSelectable(value: boolean): void {
    this.adjustmentModel.update((m) => ({ ...m, isSelectable: value }));
  }

  resetSplitFields(): void {
    this.splitStore.reset();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.adjustmentForm().invalid() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const result = buildAdjustmentPayload(
        this.adjustmentModel(),
        this.splitStore.state(),
        this.isAddition(),
      );
      if (!result.ok) {
        this.errorMessage.set(result.error);
        this.submitting.set(false);
        return;
      }

      await this.adjustmentService.createAdjustment(result.payload);
      const added = result.payload.isTrip
        ? `Trip added: ${result.payload.description}`
        : `One-off added: ${result.payload.description}`;

      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await this.queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });

      // Stay on the same kind of entry: the Trip tab keeps showing trip fields.
      this.adjustmentModel.set({ ...defaultAdjustmentModel(), isTrip: this.isTrip(), isSelectable: this.isTrip() });
      this.adjustmentForm().reset();
      this.resetSplitFields();
      this.successMessage.set(added);
    } catch (err) {
      this.errorMessage.set("Couldn't add it. Check your connection and try again.");
    } finally {
      this.submitting.set(false);
    }
  }
}
