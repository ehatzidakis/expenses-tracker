import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, maxLength, required } from '@angular/forms/signals';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { TransactionService } from '../../services/transaction-service';
import {
  CATEGORY_NAMES,
  ExpenseStateService,
  TRIP_CATEGORY_NAMES,
  categoryRequiresSubcategory,
  getSubcategoryOptions,
} from '../../services/expense-state.service';
import { AdjustmentService } from '../../services/adjustment-service';
import { PrivacyService } from '../../services/privacy.service';
import { AuthService } from '../../services/auth.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { PEOPLE, Person } from '../../models/splitz.model';
import { BudgetSettingsService } from '../../services/budget-settings.service';
import { categoryLabel, monthNameOf, monthTiming } from '../../utils/period-pace';
import { FIELD, FIELD_LABEL, SEGMENT_BASE, SEGMENT_FRAME, SEGMENT_OFF, SEGMENT_ON } from '../../utils/pill-styles';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { StripeComponent } from '../stripe/stripe';
import { CategoryRoom } from '../category-picker/category-picker';
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
    DecimalPipe,
    SensitiveDirective,
    StripeComponent,
    TransactionBasicFieldsComponent,
    SplitFieldsComponent,
    TransactionCommentFieldsComponent,
    RecurringTemplatesComponent,
  ],
  host: { class: 'block' },
  template: `
    <form (submit)="onSubmit($event)" class="flex scroll-mb-32 flex-col gap-5">
      <app-transaction-basic-fields
        [model]="transactionModel()"
        [categories]="activeCategories()"
        [room]="room()"
        [dateField]="transactionForm.date"
        [descriptionField]="transactionForm.description"
        [categoryField]="transactionForm.category"
        [subCategoryField]="transactionForm.subCategoryId"
        [amountField]="transactionForm.amount"
        [amountHint]="amountHint()"
        (categoryChange)="setCategory($event); clearTemplate()"
        (subcategoryChange)="setSubcategory($event)"
        (amountChange)="onAmountChange($event)"
        (amountHintUse)="transactionModel.update((model) => ({ ...model, amount: $event }))"
      >
        @if (showRecurring()) {
          <app-recurring-templates
            recurringRow
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

      @if (!isKioskMode()) {
        <div class="border-y border-ink/10">
          <button
            type="button"
            class="flex min-h-12 w-full items-center justify-between gap-3 text-left cursor-pointer"
            [attr.aria-expanded]="moreOpen()"
            aria-controls="tx-more"
            (click)="moreOpen.set(!moreOpen())"
          >
            <span class="text-[14px] font-medium text-ink-2">More options</span>
            <span class="flex min-w-0 items-center gap-1.5 text-[12px] text-ink-3">
              <span class="truncate">{{ moreSummary() }}</span>
              <svg
                class="size-3.5 shrink-0 transition-transform duration-200"
                [class.rotate-180]="moreOpen()"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                />
              </svg>
            </span>
          </button>

          @if (moreOpen()) {
            <div id="tx-more" class="flex flex-col gap-4 pb-4">
              @if (!sendToKiosk()) {
                <div class="flex flex-col gap-1.5">
                  <span id="tx-trip-label" [class]="fieldLabel">Trip</span>
                  <div role="group" aria-labelledby="tx-trip-label" [class]="segmentFrame + ' grid-cols-2'">
                    <button
                      type="button"
                      [class]="segment(!linkWithAdjustment())"
                      [attr.aria-pressed]="!linkWithAdjustment()"
                      (click)="toggleLinkWithAdjustment(false)"
                    >
                      No trip
                    </button>
                    <button
                      type="button"
                      [class]="segment(linkWithAdjustment())"
                      [attr.aria-pressed]="linkWithAdjustment()"
                      (click)="toggleLinkWithAdjustment(true)"
                    >
                      Add to a trip
                    </button>
                  </div>
                  @if (linkWithAdjustment()) {
                    @if (selectableTrips().length === 0) {
                      <p class="text-[13px] text-ink-3">No open trips. Open one from the One-off tab.</p>
                    } @else {
                      <label for="tx-trip" class="sr-only">Which trip</label>
                      <select
                        id="tx-trip"
                        [value]="selectedAdjustmentId()"
                        (change)="selectedAdjustmentId.set($any($event.target).value)"
                        [class]="field"
                      >
                        <option value="">Pick a trip</option>
                        @for (trip of selectableTrips(); track trip.id) {
                          <option [value]="trip.id">{{ trip.title }}</option>
                        }
                      </select>
                    }
                  }
                </div>
              }

              <app-transaction-comment-fields
                [enabled]="hasComment()"
                [commentField]="transactionForm.comment"
                (commentToggle)="setHasComment($event)"
              />

              <div class="flex flex-col gap-1.5">
                <span id="tx-kiosk-label" [class]="fieldLabel">Send to kiosk</span>
                <div role="group" aria-labelledby="tx-kiosk-label" [class]="segmentFrame + ' grid-cols-2'">
                  <button
                    type="button"
                    [class]="segment(!sendToKiosk())"
                    [attr.aria-pressed]="!sendToKiosk()"
                    (click)="setSendToKiosk(false)"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    [class]="segment(sendToKiosk())"
                    [attr.aria-pressed]="sendToKiosk()"
                    (click)="setSendToKiosk(true)"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
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
        class="min-h-12 w-full rounded-xl bg-ember text-[15px] font-semibold text-ground transition-[background-color,transform] duration-150 hover:bg-ember-ink active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
      >
        {{ submitLabel() }}
      </button>
    </form>

    <div class="mt-4 flex flex-col gap-3" aria-live="polite">
      @if (impact(); as saved) {
        <div class="flex flex-col gap-1.5 border-t border-ink/10 pt-3">
          <!-- Two lines on purpose: what was saved, then where its category stands. -->
          <p class="text-[13px] text-ink-2">
            <span class="font-semibold text-avocado-ink">Saved</span> · {{ saved.label }}
          </p>
          <p class="text-[13px] text-ink-2" appSensitive="xs">
            €{{ saved.spent | number: '1.2-2' }}
            @if (saved.budget !== null) {
              of €{{ saved.budget | number: '1.2-2' }}
            }
            {{ saved.when }}
            @if (saved.budget !== null) {
              @if (saved.spent > saved.budget + 0.005) {
                <span class="whitespace-nowrap font-semibold text-cherry"
                  >· €{{ saved.spent - saved.budget | number: '1.2-2' }} over</span
                >
              } @else {
                <span class="whitespace-nowrap text-avocado"
                  >· €{{ saved.budget - saved.spent | number: '1.2-2' }} left</span
                >
              }
            }
          </p>
          @if (saved.budget) {
            <app-stripe [ratio]="saved.spent / saved.budget" [pace]="saved.pace" [animate]="true" />
          }
        </div>
      } @else if (successMessage()) {
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
  private readonly budgetSettings = inject(BudgetSettingsService);
  /** Admin only: the kiosk never loads the owner's month records or budgets. */
  private readonly expenseState = this.authService.isKiosk() ? null : inject(ExpenseStateService);

  protected readonly field = FIELD;
  protected readonly fieldLabel = FIELD_LABEL;
  protected readonly segmentFrame = SEGMENT_FRAME;

  readonly regularCategories = CATEGORY_NAMES;
  readonly tripCategories = TRIP_CATEGORY_NAMES;
  readonly allPeople: Person[] = PEOPLE;

  readonly linkWithAdjustment = signal<boolean>(false);
  readonly selectedAdjustmentId = signal<string>('');
  readonly hasComment = signal<boolean>(false);
  readonly activeTemplateId = signal<string | null>(null);
  readonly moreOpen = signal(false);
  /** The last posted transaction, shown with what it did to its category this month. */
  readonly lastSaved = signal<{ category: string; monthName: string } | null>(null);
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
    if (this.isKioskMode()) return this.submitting() ? 'Sending…' : 'Send for review';
    return this.submitting() ? 'Adding…' : 'Add transaction';
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

  /** Spent and budget per category in a month, from the month record (admin only). */
  private roomIn(monthName: string): Record<string, CategoryRoom> | null {
    if (!this.expenseState || !monthName) return null;
    const record = (this.expenseState.expensesQuery.data() ?? []).find((e) => e.MonthName === monthName);
    const room: Record<string, CategoryRoom> = {};
    for (const name of CATEGORY_NAMES) {
      room[name] = {
        spent: Number(record?.[name as keyof typeof record] ?? 0) || 0,
        budget: this.budgetSettings.getCategoryBudget(name),
      };
    }
    return room;
  }

  /** What is left per category in the month of the entered date. Trips have no budgets. */
  readonly room = computed(() =>
    this.linkWithAdjustment() ? null : this.roomIn(monthNameOf(this.transactionModel().date)),
  );

  readonly impact = computed(() => {
    const saved = this.lastSaved();
    if (!saved) return null;
    const room = this.roomIn(saved.monthName)?.[saved.category];
    if (!room) return null;
    const now = new Date();
    const thisMonth = monthNameOf(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
    const current = saved.monthName === thisMonth;
    const timing = monthTiming(saved.monthName);
    return {
      pace: timing.kind === 'current' ? timing.pace : null,
      label: categoryLabel(saved.category),
      spent: room.spent,
      budget: room.budget,
      when: current ? 'this month' : `in ${saved.monthName.split(' ')[0]}`,
    };
  });

  readonly moreSummary = computed(() => {
    const parts: string[] = [];
    if (this.linkWithAdjustment()) {
      const trip = this.selectableTrips().find((t) => t.id === this.selectedAdjustmentId());
      parts.push(trip?.title ?? 'Trip');
    }
    if (this.hasComment()) parts.push('Comment');
    if (this.sendToKiosk()) parts.push('To kiosk');
    return parts.join(' · ');
  });

  segment(active: boolean): string {
    return `${SEGMENT_BASE} ${active ? SEGMENT_ON : SEGMENT_OFF}`;
  }

  /** A cleared form that keeps the date, so a run of entries for one day stays quick. */
  private freshModel(): TransactionFormModel {
    return { ...defaultTransactionModel(), date: this.transactionModel().date };
  }

  onAmountChange(amount: number): void {
    this.transactionModel.update((model) => ({ ...model, amount }));
    if (amount !== 0) this.lastSaved.set(null);
  }

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
    }, 4000);
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
    this.lastSaved.set(null);
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

        this.transactionModel.set(this.freshModel());
        this.transactionForm().reset();
        this.resetSplitFields();
        this.showSuccessMessage('Saved to Pending review, since it is in another month');
        return;
      }

      await this.transactionService.createTransaction(result.payload);
      const posted = this.linkWithAdjustment()
        ? null
        : { category: result.payload.category, monthName: monthNameOf(result.payload.date) };
      const tripTitle = this.selectableTrips().find((t) => t.id === this.selectedAdjustmentId())?.title;

      await this.queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await this.queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });

      this.transactionModel.set(this.freshModel());
      this.transactionForm().reset();
      this.resetSplitFields();
      if (posted) {
        this.lastSaved.set(posted);
      } else {
        this.showSuccessMessage(tripTitle ? `Added to ${tripTitle}` : 'Transaction added');
      }
    } catch (err) {
      this.errorMessage.set("Couldn't add the transaction. Check your connection and try again.");
    } finally {
      this.submitting.set(false);
    }
  }

  private async submitKioskRequest(): Promise<void> {
    this.submitting.set(true);
    this.successMessage.set(null);
    this.lastSaved.set(null);
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

      this.transactionModel.set(this.freshModel());
      this.transactionForm().reset();
      this.resetSplitFields();
      this.sendToKiosk.set(false);
      this.showSuccessMessage('Request sent to kiosk');
    } catch (err) {
      console.error('Sending the request to the kiosk failed:', err);
      this.errorMessage.set("Couldn't send the request. Check your connection and try again.");
    } finally {
      this.submitting.set(false);
    }
  }

  private async submitKioskTransaction(): Promise<void> {
    this.submitting.set(true);
    this.successMessage.set(null);
    this.lastSaved.set(null);
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

      this.transactionModel.set(this.freshModel());
      this.transactionForm().reset();
      this.resetSplitFields();
      this.showSuccessMessage('Sent for review');
    } catch (err) {
      console.error('Kiosk approval submission failed:', err);
      const message =
        err instanceof Error ? err.message : 'Unable to submit kiosk transaction for approval.';
      this.errorMessage.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
