import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { form, maxLength, required } from '@angular/forms/signals';
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
  imports: [CommonModule, AdjustmentFieldsComponent, SplitFieldsComponent],
  host: { class: 'block' },
  template: `
    <form (submit)="onSubmit($event)" class="space-y-4">
      <app-adjustment-fields
        [model]="adjustmentModel()"
        [addition]="isAddition()"
        [descriptionField]="adjustmentForm.description"
        [amountField]="adjustmentForm.amount"
        [startDateField]="adjustmentForm.startDate"
        [endDateField]="adjustmentForm.endDate"
        (tripChange)="setIsTrip($event)"
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
        class="w-full py-3 rounded-xl text-sm font-semibold text-white bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all cursor-pointer"
      >
        {{ submitting() ? 'Adding…' : 'Add One-Off' }}
      </button>
    </form>

    @if (successMessage()) {
      <div
        class="p-3 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs"
      >
        <span>{{ successMessage() }}</span>
      </div>
    }
    @if (errorMessage()) {
      <div class="p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-xs">
        {{ errorMessage() }}
      </div>
    }
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
  });

  setIsTrip(value: boolean): void {
    this.adjustmentModel.update((m) => ({
      ...m,
      isTrip: value,
      isSelectable: value ? m.isSelectable : false,
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

      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await this.queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });

      this.adjustmentModel.set(defaultAdjustmentModel());
      this.adjustmentForm().reset();
      this.resetSplitFields();
      this.successMessage.set('One-Off adjustment added successfully');
    } catch (err) {
      this.errorMessage.set('Unable to add adjustment. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
