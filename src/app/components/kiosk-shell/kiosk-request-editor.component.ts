import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { form, maxLength, required } from '@angular/forms/signals';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { getCategoryMeta, getSubcategoryOptions } from '../../services/expense-state.service';
import { PushNotificationService } from '../../services/push-notification.service';
import {
  KIOSK_REQUEST_NOTE_MAX,
  PendingTransaction,
  resolvePendingCategoryOptions,
  TransactionService,
} from '../../services/transaction-service';
import {
  defaultTransactionModel,
  TransactionFormModel,
} from '../create-transaction.component/create-transaction.models';
import { buildKioskPayload } from '../create-transaction.component/transaction-payload';
import { EditFormShellComponent } from '../edit-form/edit-form-shell.component';
import { TransactionEditFieldsComponent } from '../edit-transaction.component/transaction-edit-fields.component';
import {
  formatPendingDate,
  pendingToFormModel,
} from '../splitzes-modal.component/pending-review.model';

/** Kiosk: fill in a request from the admin and send it back, or say why it can't be filled. */
@Component({
  selector: 'app-kiosk-request-editor',
  standalone: true,
  imports: [EditFormShellComponent, TransactionEditFieldsComponent],
  host: { class: 'block' },
  template: `
    <app-edit-form-shell
      title="Fill in request"
      [formInvalid]="requestForm().invalid()"
      [submitting]="submitting()"
      [deleting]="declining()"
      [privacyDisabled]="false"
      [errorMessage]="errorMessage()"
      submitLabel="Send back"
      submittingLabel="Sending…"
      deleteLabel="Can't fill this"
      deletingLabel="Sending…"
      deleteTitle=""
      deleteMessage=""
      [showDeleteConfirm]="false"
      (back)="back.emit()"
      (submitted)="onSend($event)"
      (deleteRequested)="showDecline.set(true)"
    >
      <div class="flex items-center justify-between gap-2 text-[11px]">
        <span
          class="px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 font-semibold"
        >
          Request
        </span>
        <span class="text-gray-500 truncate">{{ requestedFor() }}</span>
      </div>

      <app-transaction-edit-fields
        [model]="model()"
        [categories]="categories()"
        [subcategories]="subcategories()"
        [dateField]="requestForm.date"
        [descriptionField]="requestForm.description"
        [categoryField]="requestForm.category"
        [subCategoryField]="requestForm.subCategoryId"
        [amountField]="requestForm.amount"
        [commentField]="requestForm.comment"
        [categoryLabel]="categoryLabel"
        (categoryChange)="setCategory($event)"
        (subcategoryChange)="setSubcategory($event)"
        (amountChange)="setAmount($event)"
      />

      @if (showDecline()) {
        <div class="space-y-2 rounded-xl border border-red-800/50 bg-red-950/20 p-3">
          <label for="kiosk-decline-reason" class="text-xs font-medium text-red-200">
            Why can't you fill it in?
          </label>
          <textarea
            id="kiosk-decline-reason"
            rows="2"
            [maxLength]="noteMax"
            [value]="declineReason()"
            (input)="declineReason.set($any($event.target).value)"
            placeholder="e.g. Not mine, or I don't have the receipt"
            class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          ></textarea>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              (click)="showDecline.set(false)"
              class="py-2 rounded-xl text-xs font-semibold text-gray-300 border border-gray-700 bg-gray-800/70"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="onDecline()"
              [disabled]="!declineReason().trim() || declining()"
              class="py-2 rounded-xl text-xs font-semibold text-red-200 border border-red-800/60 bg-red-900/40 disabled:opacity-40"
            >
              {{ declining() ? 'Sending…' : 'Send reason' }}
            </button>
          </div>
        </div>
      }
    </app-edit-form-shell>
  `,
})
export class KioskRequestEditorComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly pushNotifications = inject(PushNotificationService);
  private readonly queryClient = inject(QueryClient);

  readonly request = input.required<PendingTransaction>();
  readonly back = output<void>();
  /** Emits a short confirmation once the request has left this device. */
  readonly done = output<string>();

  readonly noteMax = KIOSK_REQUEST_NOTE_MAX;
  readonly model = signal<TransactionFormModel>(defaultTransactionModel());
  readonly submitting = signal(false);
  readonly declining = signal(false);
  readonly showDecline = signal(false);
  readonly declineReason = signal('');
  readonly errorMessage = signal<string | null>(null);

  readonly requestForm = form(this.model, (path) => {
    required(path.date, { message: 'Date is required' });
    required(path.description, { message: 'Description is required' });
    maxLength(path.description, 60, { message: 'Description must be 60 characters or fewer' });
    maxLength(path.comment, 250, { message: 'Comment must be 250 characters or fewer' });
    required(path.category, { message: 'Category is required' });
  });

  readonly categories = computed(() =>
    resolvePendingCategoryOptions({ category: this.model().category }),
  );
  readonly subcategories = computed(() => getSubcategoryOptions(this.model().category));
  readonly requestedFor = computed(() => formatPendingDate(this.request().date));

  readonly categoryLabel = (category: string): string =>
    `${getCategoryMeta(category).emoji} ${category}`;

  constructor() {
    effect(() => {
      this.model.set(pendingToFormModel(this.request()));
      this.errorMessage.set(null);
      this.showDecline.set(false);
      this.declineReason.set('');
    });
  }

  setCategory(category: string): void {
    const match =
      this.categories().find((name) => name.toLowerCase() === category.trim().toLowerCase()) ??
      category;
    const options = getSubcategoryOptions(match);
    const current = this.model().subCategoryId;
    const nextId =
      current != null && options.some((option) => option.id === current)
        ? current
        : (options[0]?.id ?? null);

    this.model.update((value) => ({
      ...value,
      category: match,
      subCategoryId: nextId,
      subCategory: options.find((option) => option.id === nextId)?.name ?? '',
    }));
    this.errorMessage.set(null);
  }

  setSubcategory(subCategoryId: number | null): void {
    const option = this.subcategories().find((item) => item.id === subCategoryId) ?? null;
    this.model.update((value) => ({
      ...value,
      subCategoryId: option?.id ?? null,
      subCategory: option?.name ?? '',
    }));
  }

  setAmount(amount: number): void {
    this.model.update((value) => ({ ...value, amount }));
    this.errorMessage.set(null);
  }

  async onSend(event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.submitting() || this.declining()) return;

    if (this.model().amount <= 0) {
      this.errorMessage.set('Please enter the amount before sending it back.');
      return;
    }
    const result = buildKioskPayload(this.model(), { linked: false, adjustmentId: '' });
    if (!result.ok) {
      this.errorMessage.set(result.error);
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      await this.transactionService.answerKioskRequest(this.request().id, result.payload);
      // Not awaited: the answer is saved, and the notification shouldn't slow it down.
      void this.pushNotifications.notifyNewPending(result.payload);
      await this.queryClient.invalidateQueries({ queryKey: ['kioskRequests'] });
      this.done.emit('Sent back for approval');
    } catch (error) {
      console.error('Unable to send the request back:', error);
      this.errorMessage.set(errorText(error, 'Unable to send it back. Please try again.'));
    } finally {
      this.submitting.set(false);
    }
  }

  async onDecline(): Promise<void> {
    const reason = this.declineReason().trim();
    if (!reason || this.submitting() || this.declining()) return;

    this.declining.set(true);
    this.errorMessage.set(null);
    try {
      await this.transactionService.declineKioskRequest(this.request().id, reason);
      void this.pushNotifications.notifyRequestDeclined(this.request(), reason);
      await this.queryClient.invalidateQueries({ queryKey: ['kioskRequests'] });
      this.done.emit('Reason sent');
    } catch (error) {
      console.error('Unable to decline the request:', error);
      this.errorMessage.set(errorText(error, 'Unable to send the reason. Please try again.'));
    } finally {
      this.declining.set(false);
    }
  }
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.includes('cancelled') ? error.message : fallback;
}
