import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { form, maxLength, required } from '@angular/forms/signals';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { PEOPLE } from '../../models/splitz.model';
import { getCategoryMeta, getSubcategoryOptions } from '../../services/expense-state.service';
import {
  PendingTransaction,
  resolvePendingCategoryOptions,
  TransactionService,
} from '../../services/transaction-service';
import {
  defaultTransactionModel,
  TransactionFormModel,
} from '../create-transaction.component/create-transaction.models';
import {
  CreateSplitState,
  SplitFieldsComponent,
} from '../create-transaction.component/split-fields.component';
import { EditFormShellComponent } from '../edit-form/edit-form-shell.component';
import { TransactionEditFieldsComponent } from '../edit-transaction.component/transaction-edit-fields.component';
import {
  buildPendingAcceptPayload,
  formatPendingDate,
  isAwaitingKiosk,
  pendingSourceLabel,
  pendingStatusLabel,
  pendingToFormModel,
  pendingToSplitState,
} from './pending-review.model';

@Component({
  selector: 'app-pending-review',
  standalone: true,
  imports: [EditFormShellComponent, TransactionEditFieldsComponent, SplitFieldsComponent],
  host: { class: 'block' },
  template: `
    <app-edit-form-shell
      title="Review incoming"
      [formInvalid]="reviewForm().invalid()"
      [submitting]="submitting()"
      [deleting]="declining()"
      [privacyDisabled]="false"
      [errorMessage]="errorMessage()"
      submitLabel="Accept transaction"
      submittingLabel="Accepting…"
      [deleteLabel]="declineText().label"
      [deletingLabel]="declineText().busy"
      [deleteTitle]="declineText().title"
      [deleteMessage]="declineText().message"
      [deleteConfirmText]="declineText().label"
      [showDeleteConfirm]="showDeclineConfirm()"
      (back)="back.emit()"
      (submitted)="onAccept($event)"
      (deleteRequested)="showDeclineConfirm.set(true)"
      (deleteConfirmed)="onDecline()"
      (deleteCancelled)="showDeclineConfirm.set(false)"
    >
      <div class="flex items-center justify-between gap-2 text-[11px]">
        <span
          class="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold"
        >
          From {{ sourceLabel() }}
        </span>
        <span class="text-gray-500 truncate">{{ addedOn() }}</span>
      </div>
      @if (statusLabel(); as status) {
        <p
          class="rounded-xl border px-3 py-2 text-[11px]"
          [class.border-sky-500/30]="pending().requestStatus === 'awaiting-kiosk'"
          [class.text-sky-300]="pending().requestStatus === 'awaiting-kiosk'"
          [class.border-emerald-500/30]="pending().requestStatus === 'answered'"
          [class.text-emerald-300]="pending().requestStatus === 'answered'"
          [class.border-red-500/30]="pending().requestStatus === 'declined'"
          [class.text-red-300]="pending().requestStatus === 'declined'"
        >
          {{ status }}
          @if (pending().requestStatus === 'awaiting-kiosk') {
            <span class="block text-gray-500"
              >You can still fill it in and accept it yourself.</span
            >
          }
        </p>
      }

      <app-transaction-edit-fields
        [model]="model()"
        [categories]="categories()"
        [subcategories]="subcategories()"
        [dateField]="reviewForm.date"
        [descriptionField]="reviewForm.description"
        [categoryField]="reviewForm.category"
        [subCategoryField]="reviewForm.subCategoryId"
        [amountField]="reviewForm.amount"
        [commentField]="reviewForm.comment"
        [categoryLabel]="categoryLabel"
        [amountLabel]="split().goesSplitzes ? 'Total bill' : 'Amount'"
        (categoryChange)="setCategory($event)"
        (subcategoryChange)="setSubcategory($event)"
        (amountChange)="setAmount($event)"
      />

      <app-split-fields
        [amount]="model().amount"
        [people]="people"
        [state]="split()"
        [allowCustom]="true"
        (stateChange)="split.set($event)"
        (reset)="resetSplit()"
      />
    </app-edit-form-shell>
  `,
})
export class PendingReviewComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly queryClient = inject(QueryClient);

  readonly pending = input.required<PendingTransaction>();
  readonly back = output<void>();
  readonly accepted = output<void>();
  readonly declined = output<void>();

  readonly people = PEOPLE;
  readonly model = signal<TransactionFormModel>(defaultTransactionModel());
  readonly split = signal<CreateSplitState>({
    goesSplitzes: false,
    splitWith: [],
    paidById: 'me',
    customSplitMode: false,
    customSplitAmounts: {},
  });
  readonly submitting = signal(false);
  readonly declining = signal(false);
  readonly showDeclineConfirm = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly reviewForm = form(this.model, (path) => {
    required(path.date, { message: 'Date is required' });
    required(path.description, { message: 'Description is required' });
    maxLength(path.description, 60, { message: 'Description must be 60 characters or fewer' });
    maxLength(path.comment, 250, { message: 'Comment must be 250 characters or fewer' });
    required(path.category, { message: 'Category is required' });
  });

  readonly categories = computed(() =>
    resolvePendingCategoryOptions({
      category: this.model().category,
      adjustmentId: this.pending().adjustmentId,
    }),
  );
  readonly subcategories = computed(() => getSubcategoryOptions(this.model().category));
  readonly sourceLabel = computed(() => pendingSourceLabel(this.pending()));
  readonly statusLabel = computed(() => pendingStatusLabel(this.pending()));
  // A request still with the kiosk is cancelled rather than declined.
  readonly declineText = computed(() =>
    isAwaitingKiosk(this.pending())
      ? {
          label: 'Cancel request',
          busy: 'Cancelling…',
          title: 'Cancel request?',
          message: "This removes the request from the kiosk too. It can't be undone.",
        }
      : {
          label: 'Decline',
          busy: 'Declining…',
          title: 'Decline transaction?',
          message: "This removes the incoming transaction. It can't be undone.",
        },
  );
  readonly addedOn = computed(() => formatPendingDate(this.pending().date));

  readonly categoryLabel = (category: string): string =>
    `${getCategoryMeta(category).emoji} ${category}`;

  constructor() {
    effect(() => {
      const pending = this.pending();
      this.model.set(pendingToFormModel(pending));
      this.split.set(pendingToSplitState(pending));
      this.errorMessage.set(null);
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

  resetSplit(): void {
    this.split.update((state) => ({
      ...state,
      goesSplitzes: false,
      splitWith: [],
      paidById: 'me',
      customSplitMode: false,
      customSplitAmounts: {},
    }));
  }

  async onAccept(event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.submitting() || this.declining()) return;

    const model = this.model();
    if (model.amount <= 0) {
      this.errorMessage.set('Amount must be greater than 0');
      return;
    }

    const result = buildPendingAcceptPayload(model, this.split(), this.pending());
    if (!result.ok) {
      this.errorMessage.set(result.error);
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      await this.transactionService.acceptPendingTransaction(this.pending().id, result.payload);
      await Promise.all([
        this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] }),
        this.queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        this.queryClient.invalidateQueries({ queryKey: ['adjustments'] }),
        this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] }),
      ]);
      this.accepted.emit();
    } catch (error) {
      console.error('Unable to accept pending transaction:', error);
      this.errorMessage.set('Unable to accept. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  async onDecline(): Promise<void> {
    this.showDeclineConfirm.set(false);
    if (this.submitting() || this.declining()) return;

    this.declining.set(true);
    this.errorMessage.set(null);
    try {
      await this.transactionService.declinePendingTransaction(this.pending().id);
      await this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] });
      this.declined.emit();
    } catch (error) {
      console.error('Unable to decline pending transaction:', error);
      this.errorMessage.set('Unable to decline. Please try again.');
    } finally {
      this.declining.set(false);
    }
  }
}
