import { Component, effect, inject, signal, input, output } from '@angular/core';
import { AdjustmentService } from '../../services/adjustment-service';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { Adjustment } from '../../models/adjustments.model';
import { form, maxLength, required } from '@angular/forms/signals';
import { PrivacyService } from '../../services/privacy.service';
import { EditFormShellComponent } from '../edit-form/edit-form-shell.component';
import { AdjustmentEditFieldsComponent } from './adjustment-edit-fields.component';
import { AdjustmentEditOptionsComponent } from './adjustment-edit-options.component';

interface AdjustmentFormModel {
  description: string;
  amount: number;
  startDate: string;
  endDate: string;
  isAddition: boolean;
  isTrip?: boolean;
  isSelectable?: boolean;
}

function formatDateForInput(dateVal: Date | string): string {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal).substring(0, 10); // Fallback for invalid date
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-edit-adjustment',
  standalone: true,
  imports: [EditFormShellComponent, AdjustmentEditFieldsComponent, AdjustmentEditOptionsComponent],
  host: { class: 'block' },
  template: `
    <app-edit-form-shell
      title="Edit Adjustment"
      backClass="text-xs font-medium text-gray-400 hover:text-gray-200 flex items-center gap-1 transition-colors cursor-pointer"
      [formInvalid]="adjustmentForm().invalid()"
      [submitting]="submitting()"
      [deleting]="deleting()"
      [privacyDisabled]="privacyService.isPrivacyMode()"
      [errorMessage]="errorMessage()"
      deleteLabel="Delete Adjustment"
      deleteTitle="Delete Adjustment?"
      deleteMessage="Are you sure you want to delete this adjustment?"
      [showDeleteConfirm]="showDeleteConfirm()"
      (back)="back.emit()"
      (submitted)="onSubmit($event)"
      (deleteRequested)="requestDelete()"
      (deleteConfirmed)="onDelete()"
      (deleteCancelled)="showDeleteConfirm.set(false)"
    >
      <app-adjustment-edit-fields
        [amount]="adjustmentModel().amount"
        [privacyMode]="privacyService.isPrivacyMode()"
        [descriptionField]="adjustmentForm.description"
        [amountField]="adjustmentForm.amount"
        [startDateField]="adjustmentForm.startDate"
        [endDateField]="adjustmentForm.endDate"
        (amountChange)="onAmountChange($event)"
      />

      <app-adjustment-edit-options
        [isAddition]="adjustmentModel().isAddition"
        [isTrip]="adjustmentModel().isTrip ?? false"
        [isSelectable]="adjustmentModel().isSelectable ?? false"
        (typeChange)="toggleType($event)"
        (tripChange)="toggleTrip($event)"
        (selectableChange)="toggleSelectable($event)"
      />
    </app-edit-form-shell>
  `,
})
export class EditAdjustmentComponent {
  private adjustmentService = inject(AdjustmentService);
  readonly privacyService = inject(PrivacyService);
  private queryClient = inject(QueryClient);

  readonly showDeleteConfirm = signal(false);

  readonly adjustment = input.required<Adjustment>();

  readonly back = output<void>();
  readonly updated = output<void>();
  readonly deleted = output<void>();

  readonly adjustmentModel = signal<AdjustmentFormModel>({
    description: '',
    amount: 0,
    startDate: '',
    endDate: '',
    isAddition: true,
    isTrip: false,
    isSelectable: false,
  });

  constructor() {
    effect(() => {
      const adj = this.adjustment();
      if (adj) {
        this.adjustmentModel.set({
          description: adj.title,
          amount: adj.amount,
          startDate: formatDateForInput(adj.startDate),
          endDate: formatDateForInput(adj.endDate),
          isAddition: adj.adjType,
          isTrip: adj.isTrip ?? false,
          isSelectable: adj.isSelectable ?? false,
        });
      }
    });
  }

  readonly adjustmentForm = form(this.adjustmentModel, (schemaPath) => {
    required(schemaPath.description, { message: 'Description is required' });
    maxLength(schemaPath.description, 60, { message: 'Description must be 60 characters or less' });
    required(schemaPath.startDate, { message: 'Start date is required' });
    required(schemaPath.endDate, { message: 'End date is required' });
  });

  readonly submitting = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  toggleType(isAddition: boolean): void {
    this.adjustmentModel.update((m) => ({ ...m, isAddition }));
  }

  toggleTrip(isTrip: boolean): void {
    this.adjustmentModel.update((m) => ({
      ...m,
      isTrip,
      isSelectable: isTrip ? m.isSelectable : false,
    }));
  }

  toggleSelectable(isSelectable: boolean): void {
    this.adjustmentModel.update((m) => ({ ...m, isSelectable }));
  }

  requestDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  onAmountChange(amount: number): void {
    this.adjustmentModel.update((value) => ({ ...value, amount }));
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.adjustmentForm().invalid() || this.submitting()) {
      return;
    }

    const value = this.adjustmentModel();
    if (value.amount <= 0) {
      this.errorMessage.set('Amount must be greater than 0');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.adjustmentService.updateAdjustment(this.adjustment().id, {
        description: value.description.trim(),
        amount: value.amount,
        startDate: value.startDate,
        endDate: value.endDate,
        isAddition: value.isAddition,
        isTrip: value.isTrip,
        isSelectable: value.isSelectable,
      });

      await this.queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      this.updated.emit();
    } catch (err) {
      this.errorMessage.set('Failed to update adjustment.');
    } finally {
      this.submitting.set(false);
    }
  }

  async onDelete(): Promise<void> {
    if (this.deleting()) {
      return;
    }

    this.showDeleteConfirm.set(false);

    this.deleting.set(true);
    this.errorMessage.set(null);

    try {
      await this.adjustmentService.deleteAdjustment(this.adjustment().id);
      await this.queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      this.deleted.emit();
    } catch (err) {
      this.errorMessage.set('Failed to delete adjustment.');
    } finally {
      this.deleting.set(false);
    }
  }
}
