import { Component, computed, inject, input, output, signal } from '@angular/core';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { TransactionService, monthTransactionsKey } from '../../services/transaction-service';
import { Transaction } from '../../models/transaction.model';
import { RECURRING_TEMPLATES, RecurringTemplate } from './recurring-templates';
import { ACTIVE_PILL, FIELD_LABEL, IDLE_PILL, PILL_BASE } from '../../utils/pill-styles';
import {
  buildMonthlyBatch,
  isTemplateAdded,
  lastAmountFor,
  monthNameFromDate,
  previousMonthName,
} from './recurring-templates.util';

export interface TemplatePick {
  template: RecurringTemplate;
  lastAmount: number | null;
}

/**
 * Row of quick-pick chips for recurring transactions, plus an
 * "Add all monthly" button that saves every monthly item not yet added.
 */
@Component({
  selector: 'app-recurring-templates',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-1.5">
        <span [class]="fieldLabel" id="recurring-label">Recurring</span>
        <div
          role="group"
          aria-labelledby="recurring-label"
          class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0"
        >
          @for (item of chips(); track item.template.id) {
            <button
              type="button"
              (click)="pick(item.template)"
              [disabled]="item.added"
              [attr.aria-pressed]="activeId() === item.template.id"
              [title]="item.added ? 'Already added for ' + monthName() : item.template.label"
              [class]="pillBase + ' flex items-center gap-1.5 disabled:cursor-not-allowed ' + (activeId() === item.template.id ? activePill : idlePill)"
            >
              @if (item.template.emoji) {
                <span class="text-[12px] opacity-60 grayscale-[40%]" aria-hidden="true">{{ item.template.emoji }}</span>
              }
              {{ item.template.label }}
              @if (item.added) {
                <svg class="size-3.5 text-avocado" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  />
                </svg>
                <span class="sr-only">(added this month)</span>
              }
            </button>
          }
        </div>
      </div>

      <!-- @if (confirming()) {
        <div
          class="p-2.5 rounded-xl bg-ground/80 border border-raised text-[11px] text-ink-2 space-y-2"
        >
          <p>{{ confirmMessage() }}</p>
          <div class="flex gap-2 justify-end">
            <button
              type="button"
              (click)="confirming.set(false)"
              class="min-h-11 px-4 rounded-lg text-ink-2 hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="addAllMonthly()"
              class="min-h-11 px-4 rounded-lg font-semibold text-ground bg-ember/80 hover:bg-ember-ink cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      } @else if (remainingCount() > 0 && !loading()) {
        <button
          type="button"
          (click)="confirming.set(true)"
          [disabled]="saving() || disabled()"
          class="inline-flex min-h-11 items-center text-[13px] font-semibold text-ember-ink hover:text-ember-soft disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {{ saving() ? 'Adding…' : '➕ Add all monthly (' + remainingCount() + ')' }}
        </button>
      } -->

      @if (errorMessage()) {
        <p class="text-[12px] text-cherry">{{ errorMessage() }}</p>
      }
    </div>
  `,
})
export class RecurringTemplatesComponent {
  protected readonly pillBase = PILL_BASE;
  protected readonly activePill = ACTIVE_PILL;
  protected readonly idlePill = IDLE_PILL;
  protected readonly fieldLabel = FIELD_LABEL;

  private readonly transactionService = inject(TransactionService);
  private readonly queryClient = inject(QueryClient);

  /** The form's date ('YYYY-MM-DD'); its month is the month we check and fill. */
  readonly targetDate = input.required<string>();
  readonly activeId = input<string | null>(null);
  /** Disables the batch button (e.g. in privacy mode). */
  readonly disabled = input(false);

  readonly picked = output<TemplatePick>();
  readonly batchDone = output<string>();

  readonly templates = RECURRING_TEMPLATES;
  readonly confirming = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly monthName = computed(() => monthNameFromDate(this.targetDate()));
  private readonly prevMonthName = computed(() => previousMonthName(this.targetDate()));

  // Shared month cache (also used by the Monthly tab); saves refresh it via ['expenses'].
  private readonly monthQuery = injectQuery(() => ({
    queryKey: monthTransactionsKey(this.monthName()),
    enabled: !!this.monthName(),
    queryFn: () => this.transactionService.fetchMonthTransactions(this.monthName()),
  }));
  private readonly prevMonthQuery = injectQuery(() => ({
    queryKey: monthTransactionsKey(this.prevMonthName()),
    enabled: !!this.prevMonthName(),
    queryFn: () => this.transactionService.fetchMonthTransactions(this.prevMonthName()),
  }));
  // The month data includes trip transactions; quick-picks only look at regular ones.
  private readonly monthTxs = computed(() => withoutTrips(this.monthQuery.data()));
  private readonly prevMonthTxs = computed(() => withoutTrips(this.prevMonthQuery.data()));
  private readonly pendingQuery = this.transactionService.getPendingTransactionsQuery();

  readonly loading = computed(() => this.monthQuery.isPending() || this.pendingQuery.isPending());

  readonly chips = computed(() => {
    const monthTxs = this.monthTxs();
    const pending = this.pendingQuery.data() ?? [];
    const monthName = this.monthName();
    return (
      this.templates
        .map((template) => ({
          template,
          added: template.monthly && isTemplateAdded(template, monthTxs, pending, monthName),
        }))
        // Already-added chips go to the back (sort is stable, so config order is kept otherwise).
        .sort((a, b) => Number(a.added) - Number(b.added))
    );
  });

  private readonly addedIds = computed(
    () =>
      new Set(
        this.chips()
          .filter((chip) => chip.added)
          .map((chip) => chip.template.id),
      ),
  );

  readonly batch = computed(() =>
    buildMonthlyBatch(this.templates, this.targetDate(), this.addedIds()),
  );
  readonly remainingCount = computed(
    () => this.batch().direct.length + this.batch().pending.length,
  );
  readonly confirmMessage = computed(() => {
    const count = this.remainingCount();
    const pending = this.batch().pending;
    const toFill = pending.filter((item) => item.amount === 0).length;
    let message = `Add ${count} monthly item${count === 1 ? '' : 's'} for ${this.monthName()}?`;
    if (pending.length > 0) {
      message += ` ${pending.length} will go to Pending`;
      message += toFill > 0 ? ` (${toFill} to fill in the amount when you approve).` : '.';
    }
    return message;
  });

  pick(template: RecurringTemplate): void {
    const lastAmount =
      template.amount == null ? lastAmountFor(template, this.prevMonthTxs()) : null;
    this.picked.emit({ template, lastAmount });
  }

  async addAllMonthly(): Promise<void> {
    this.confirming.set(false);
    if (this.saving()) return;

    const { direct, pending } = this.batch();
    const monthName = this.monthName();
    this.saving.set(true);
    this.errorMessage.set(null);

    try {
      // One at a time: createTransaction reads then updates the month's expenses doc.
      for (const payload of direct) {
        await this.transactionService.createTransaction(payload);
      }
      for (const payload of pending) {
        await this.transactionService.createPendingTransaction(payload, 'admin');
      }

      await Promise.all([
        this.queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        this.queryClient.invalidateQueries({ queryKey: ['adjustments'] }),
        this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] }),
        this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] }),
      ]);

      const parts = [];
      if (direct.length) parts.push(`${direct.length} added`);
      if (pending.length) parts.push(`${pending.length} sent to Pending`);
      this.batchDone.emit(`${monthName}: ${parts.join(', ')}`);
    } catch (error) {
      console.error('Unable to add monthly items:', error);
      this.errorMessage.set('Some items could not be added. Check the list and try again.');
      await Promise.all([
        this.queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] }),
      ]);
    } finally {
      this.saving.set(false);
    }
  }
}

function withoutTrips(transactions: Transaction[] | undefined): Transaction[] {
  return (transactions ?? []).filter((transaction) => !transaction.adjustmentId);
}
