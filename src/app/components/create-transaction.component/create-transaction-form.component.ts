import { CommonModule } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, maxLength, required } from '@angular/forms/signals';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { TransactionService } from '../../services/transaction-service';
import {
  CATEGORY_NAMES,
  TRIP_CATEGORY_NAMES,
  categoryRequiresSubcategory,
  getSubcategoryOptions,
} from '../../services/expense-state.service';
import { AdjustmentService } from '../../services/adjustment-service';
import { PrivacyService } from '../../services/privacy.service';
import { AuthService } from '../../services/auth.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { PEOPLE, Person } from '../../models/splitz.model';
import { TransactionBasicFieldsComponent } from './transaction-basic-fields.component';
import { SplitFieldsComponent } from './split-fields.component';
import { TransactionCommentFieldsComponent } from './transaction-comment-fields.component';
import { SplitStateStore } from './split-state.store';
import { RecurringTemplatesComponent, TemplatePick } from './recurring-templates.component';
import { applyTemplate } from './recurring-templates.util';
import {
  shouldSaveTransactionForApproval,
  TransactionFormModel,
  defaultTransactionModel,
} from './create-transaction.models';
import {
  buildKioskPayload,
  buildTransactionPayload,
  customSplitValid as isCustomSplitValid,
} from './transaction-payload';

@Component({
  selector: 'app-create-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    TransactionBasicFieldsComponent,
    SplitFieldsComponent,
    TransactionCommentFieldsComponent,
    RecurringTemplatesComponent,
  ],
  host: { class: 'block' },
  template: `
    <form (submit)="onSubmit($event)" class="space-y-4 scroll-mb-32">
      <app-transaction-basic-fields
        [model]="transactionModel()"
        [categories]="activeCategories()"
        [linked]="linkWithAdjustment()"
        [showTripLink]="!sendToKiosk()"
        [trips]="selectableTrips()"
        [selectedTripId]="selectedAdjustmentId()"
        [dateField]="transactionForm.date"
        [descriptionField]="transactionForm.description"
        [categoryField]="transactionForm.category"
        [subCategoryField]="transactionForm.subCategoryId"
        [amountField]="transactionForm.amount"
        [amountHint]="amountHint()"
        (linkChange)="toggleLinkWithAdjustment($event)"
        (tripChange)="selectedAdjustmentId.set($event)"
        (categoryChange)="setCategory($event); clearTemplate()"
        (subcategoryChange)="setSubcategory($event)"
        (amountChange)="transactionModel.update((model) => ({ ...model, amount: $event }))"
        (amountHintUse)="transactionModel.update((model) => ({ ...model, amount: $event }))"
      >
        @if (showRecurring()) {
          <button
            descriptionAction
            type="button"
            (click)="recurringOpen.set(!recurringOpen())"
            [attr.aria-expanded]="recurringOpen()"
            aria-label="Recurring transactions"
            title="Recurring transactions"
            class="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer"
            [class.bg-indigo-500/20]="recurringOpen()"
            [class.border-indigo-400/50]="recurringOpen()"
            [class.text-indigo-200]="recurringOpen()"
            [class.border-gray-700/60]="!recurringOpen()"
            [class.text-gray-400]="!recurringOpen()"
          >
            🔁 Recurring
          </button>
        }
        @if (showRecurring() && recurringOpen()) {
          <app-recurring-templates
            descriptionExtras
            [targetDate]="transactionModel().date"
            [activeId]="activeTemplateId()"
            [disabled]="privacyService.isPrivacyMode()"
            (picked)="onTemplatePicked($event)"
            (batchDone)="showSuccessMessage($event)"
          />
        }
      </app-transaction-basic-fields>
      @if (!isKioskMode() && !sendToKiosk()) {
        <app-split-fields
          [amount]="transactionModel().amount"
          [people]="allPeople"
          [state]="splitStore.state()"
          [allowCustom]="true"
          [scrollOnSplitInteraction]="true"
          (stateChange)="splitStore.apply($event)"
          (reset)="resetSplitFields()"
        />
      }
      <app-transaction-comment-fields
        [enabled]="hasComment()"
        [commentField]="transactionForm.comment"
        (commentToggle)="setHasComment($event)"
      />
      @if (!isKioskMode()) {
        <label
          class="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors"
          [class.border-indigo-500/40]="sendToKiosk()"
          [class.bg-indigo-500/10]="sendToKiosk()"
          [class.border-gray-800]="!sendToKiosk()"
          [class.bg-gray-950/60]="!sendToKiosk()"
        >
          <span class="space-y-0.5">
            <span class="block text-xs font-semibold text-gray-200">Send to kiosk</span>
            <span class="block text-[11px] text-gray-500">
              They fill in the amount and send it back. Amount is optional.
            </span>
          </span>
          <input
            type="checkbox"
            class="h-4 w-4 shrink-0 accent-indigo-500 cursor-pointer"
            [checked]="sendToKiosk()"
            (change)="setSendToKiosk($any($event.target).checked)"
          />
        </label>
      }
      <button
        type="submit"
        [disabled]="
          transactionForm().invalid() ||
          submitting() ||
          privacyService.isPrivacyMode() ||
          (!sendToKiosk() &&
            splitStore.goesSplitzes() &&
            splitStore.customSplitMode() &&
            !customSplitOk())
        "
        class="w-full py-3 rounded-xl text-sm font-semibold text-white bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all cursor-pointer"
      >
        {{ submitLabel() }}
      </button>
    </form>

    @if (successMessage()) {
      <div
        class="mt-2 p-3 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs text-center"
      >
        <span>{{ successMessage() }}</span>
      </div>
    }
    @if (errorMessage()) {
      <div
        class="mt-2 p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-xs text-center"
      >
        {{ errorMessage() }}
      </div>
    }
  `,
})
export class CreateTransactionFormComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private transactionService = inject(TransactionService);
  private adjustmentService = inject(AdjustmentService);
  private queryClient = inject(QueryClient);
  private authService = inject(AuthService);
  private pushNotifications = inject(PushNotificationService);
  readonly privacyService = inject(PrivacyService);
  readonly splitStore = inject(SplitStateStore);
  readonly isKioskMode = this.authService.isKiosk;

  readonly regularCategories = CATEGORY_NAMES;
  readonly tripCategories = TRIP_CATEGORY_NAMES;
  readonly allPeople: Person[] = PEOPLE;

  readonly linkWithAdjustment = signal<boolean>(false);
  readonly selectedAdjustmentId = signal<string>('');
  readonly hasComment = signal<boolean>(false);
  readonly activeTemplateId = signal<string | null>(null);
  readonly recurringOpen = signal(false);
  // Admin only: save as a request for the kiosk to fill in, instead of a transaction.
  readonly sendToKiosk = signal(false);
  // Hidden in privacy mode: templates fill in real amounts and last month's bills.
  readonly showRecurring = computed(
    () =>
      !this.linkWithAdjustment() &&
      !this.isKioskMode() &&
      !this.sendToKiosk() &&
      !this.privacyService.isPrivacyMode(),
  );
  readonly submitLabel = computed(() => {
    if (this.sendToKiosk()) return this.submitting() ? 'Sending…' : 'Send to kiosk';
    return this.submitting() ? 'Adding…' : 'Add Transaction';
  });
  readonly amountHint = signal<number | null>(null);

  private readonly basicFields = viewChild.required(TransactionBasicFieldsComponent);

  readonly transactionModel = signal<TransactionFormModel>(defaultTransactionModel());

  readonly submitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  private successMessageTimer?: ReturnType<typeof setTimeout>;

  private adjustmentsQuery = this.adjustmentService.getAdjustmentsQuery();

  readonly transactionForm = form(this.transactionModel, (schemaPath) => {
    required(schemaPath.date, { message: 'Date is required' });
    required(schemaPath.description, { message: 'Description is required' });
    maxLength(schemaPath.description, 60, {
      message: 'Description must be 60 characters or fewer',
    });
    maxLength(schemaPath.comment, 250, {
      message: 'Comment must be 250 characters or fewer',
    });
    required(schemaPath.category, { message: 'Category is required' });
  });

  readonly selectableTrips = computed(() =>
    (this.adjustmentsQuery.data() ?? []).filter((a) => a.isTrip && a.isSelectable),
  );

  readonly activeCategories = computed(() =>
    this.linkWithAdjustment() ? this.tripCategories : this.regularCategories,
  );

  readonly availableSubcategories = computed(() => {
    const category = this.transactionModel().category;
    return category ? getSubcategoryOptions(category) : [];
  });

  readonly customSplitOk = computed(() =>
    isCustomSplitValid(this.transactionModel().amount, this.splitStore.state()),
  );

  constructor() {
    effect(() => {
      if (this.authService.isKiosk()) {
        this.linkWithAdjustment.set(false);
        this.selectedAdjustmentId.set('');
        this.hasComment.set(false);
      }
    });
  }

  private syncSubcategorySelection(category: string): void {
    const hasSubcategories = categoryRequiresSubcategory(category);
    if (!hasSubcategories) {
      this.transactionModel.update((model) => ({
        ...model,
        category,
        subCategoryId: null,
        subCategory: '',
      }));
      return;
    }

    const current = this.transactionModel();
    if (
      current.subCategoryId == null ||
      !this.availableSubcategories().some((opt) => opt.id === current.subCategoryId)
    ) {
      const firstOption = this.availableSubcategories()[0];
      this.transactionModel.update((model) => ({
        ...model,
        category,
        subCategoryId: firstOption?.id ?? null,
        subCategory: firstOption?.name ?? '',
      }));
      return;
    }

    this.transactionModel.update((model) => ({
      ...model,
      category,
      subCategory:
        this.availableSubcategories().find((opt) => opt.id === model.subCategoryId)?.name ?? '',
    }));
  }

  setCategory(category: string): void {
    this.transactionModel.update((model) => ({ ...model, category }));
    this.syncSubcategorySelection(category);
  }

  setSubcategory(subCategoryId: number | null): void {
    const option = this.availableSubcategories().find((item) => item.id === subCategoryId) ?? null;
    this.transactionModel.update((model) => ({
      ...model,
      subCategoryId: option?.id ?? null,
      subCategory: option?.name ?? '',
    }));
  }

  onTemplatePicked({ template, lastAmount }: TemplatePick): void {
    this.transactionModel.update((model) => applyTemplate(model, template));
    this.transactionForm().reset();
    this.activeTemplateId.set(template.id);
    this.amountHint.set(lastAmount);
    this.errorMessage.set(null);

    const focusTarget = !template.description
      ? 'description'
      : template.amount == null
        ? 'amount'
        : null;
    if (focusTarget) {
      requestAnimationFrame(() => this.basicFields().focusField(focusTarget));
    }
  }

  clearTemplate(): void {
    this.activeTemplateId.set(null);
    this.amountHint.set(null);
  }

  toggleLinkWithAdjustment(value: boolean): void {
    this.clearTemplate();
    this.linkWithAdjustment.set(value);
    this.transactionModel.update((m) => ({ ...m, category: '' }));
    if (!value) {
      this.selectedAdjustmentId.set('');
    }
  }

  setSendToKiosk(value: boolean): void {
    this.sendToKiosk.set(value);
    if (!value) return;

    // The kiosk can't fill in trips or splits, so drop them.
    if (this.linkWithAdjustment()) this.toggleLinkWithAdjustment(false);
    this.recurringOpen.set(false);
    this.splitStore.reset();
  }

  setHasComment(value: boolean): void {
    this.hasComment.set(value);
    if (!value) {
      this.transactionModel.update((model) => ({ ...model, comment: '' }));
      return;
    }

    this.scrollFormToBottom();
  }

  private scrollFormToBottom(): void {
    if (typeof window === 'undefined') return;

    requestAnimationFrame(() => {
      if (!window.matchMedia('(max-width: 767px)').matches) return;

      const form = this.host.nativeElement.querySelector('form');
      form?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'end',
      });
    });
  }

  resetSplitFields(): void {
    this.splitStore.reset();
    this.hasComment.set(false);
    this.clearTemplate();
  }

  showSuccessMessage(message: string): void {
    if (this.successMessageTimer) {
      clearTimeout(this.successMessageTimer);
    }

    this.successMessage.set(message);
    this.successMessageTimer = setTimeout(() => {
      this.successMessage.set(null);
      this.successMessageTimer = undefined;
    }, 1500);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.transactionForm().invalid() || this.submitting()) {
      return;
    }
    if (this.linkWithAdjustment() && !this.selectedAdjustmentId()) {
      this.errorMessage.set('Please select a trip to link with.');
      return;
    }
    if (this.isKioskMode()) {
      this.submitKioskTransaction();
      return;
    }
    if (this.sendToKiosk()) {
      this.submitKioskRequest();
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const result = buildTransactionPayload(this.transactionModel(), this.splitStore.state(), {
        linked: this.linkWithAdjustment(),
        adjustmentId: this.selectedAdjustmentId(),
      });
      if (!result.ok) {
        this.errorMessage.set(result.error);
        this.submitting.set(false);
        return;
      }

      const saveForApproval = shouldSaveTransactionForApproval(
        result.payload.date,
        result.payload.adjustmentId,
      );

      if (saveForApproval) {
        await this.transactionService.createPendingTransaction(result.payload, 'admin');
        await this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] });

        this.transactionModel.set(defaultTransactionModel());
        this.transactionForm().reset();
        this.resetSplitFields();
        this.showSuccessMessage('Transaction saved for approval');
        return;
      }

      await this.transactionService.createTransaction(result.payload);

      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await this.queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });

      this.transactionModel.set(defaultTransactionModel());
      this.transactionForm().reset();
      this.resetSplitFields();
      this.showSuccessMessage('🎉Transaction added🎉');
    } catch (err) {
      this.errorMessage.set('😢Unable to add transaction😢 Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  private async submitKioskRequest(): Promise<void> {
    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const result = buildTransactionPayload(this.transactionModel(), this.splitStore.state(), {
        linked: false,
        adjustmentId: '',
      });
      if (!result.ok) {
        this.errorMessage.set(result.error);
        return;
      }

      await this.transactionService.createKioskRequest(result.payload);
      // Not awaited: the request is saved, and the notification shouldn't slow down or fail it.
      void this.pushNotifications.notifyKioskRequest(result.payload);
      await this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] });

      this.transactionModel.set(defaultTransactionModel());
      this.transactionForm().reset();
      this.resetSplitFields();
      this.sendToKiosk.set(false);
      this.showSuccessMessage('Request sent to kiosk');
    } catch (err) {
      console.error('Sending the request to the kiosk failed:', err);
      this.errorMessage.set('Unable to send the request. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  private async submitKioskTransaction(): Promise<void> {
    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const result = buildKioskPayload(this.transactionModel(), {
        linked: this.linkWithAdjustment(),
        adjustmentId: this.selectedAdjustmentId(),
      });
      if (!result.ok) {
        this.errorMessage.set(result.error);
        this.submitting.set(false);
        return;
      }

      await this.transactionService.createPendingTransaction(result.payload);
      // Not awaited: the save is done, and the notification shouldn't slow down or fail it.
      void this.pushNotifications.notifyNewPending(result.payload);

      await this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] });

      this.transactionModel.set(defaultTransactionModel());
      this.transactionForm().reset();
      this.resetSplitFields();
      this.showSuccessMessage('Transaction sent for approval');
    } catch (err) {
      console.error('😢Kiosk approval submission failed😢:', err);
      const message =
        err instanceof Error ? err.message : 'Unable to submit kiosk transaction for approval.';
      this.errorMessage.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
