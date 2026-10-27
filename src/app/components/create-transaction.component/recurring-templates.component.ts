import { Component, computed, inject, input, output, signal } from '@angular/core';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { TransactionService } from '../../services/transaction-service';
import { RECURRING_TEMPLATES, RecurringTemplate } from './recurring-templates';
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
    <div class="space-y-2">
      <div class="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        @for (item of chips(); track item.template.id) {
          <button
            type="button"
            (click)="pick(item.template)"
            [disabled]="item.added"
            [attr.aria-pressed]="activeId() === item.template.id"
            [title]="item.added ? 'Already added for ' + monthName() : item.template.label"
            class="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            [class.bg-indigo-500/20]="activeId() === item.template.id"
            [class.border-indigo-400/50]="activeId() === item.template.id"
            [class.text-indigo-200]="activeId() === item.template.id"
            [class.bg-gray-800/60]="activeId() !== item.template.id"
            [class.border-gray-700/60]="activeId() !== item.template.id"
            [class.text-gray-300]="activeId() !== item.template.id && !item.added"
            [class.text-gray-500]="activeId() !== item.template.id && item.added"
          >
            {{ item.template.emoji }} {{ item.template.label }}
            @if (item.added) {
              <span class="text-emerald-400">✓</span>
            }
          </button>
        }
      </div>

      @if (confirming()) {
        <div
          class="p-2.5 rounded-xl bg-gray-950/80 border border-gray-800 text-[11px] text-gray-300 space-y-2"
        >
          <p>{{ confirmMessage() }}</p>
          <div class="flex gap-2 justify-end">
            <button
              type="button"
              (click)="confirming.set(false)"
              class="px-3 py-1 rounded-lg text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="addAllMonthly()"
              class="px-3 py-1 rounded-lg font-semibold text-white bg-indigo-500/80 hover:bg-indigo-500 cursor-pointer"
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
          class="text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {{ saving() ? 'Adding…' : '➕ Add all monthly (' + remainingCount() + ')' }}
        </button>
      }

      @if (errorMessage()) {
        <p class="text-[11px] text-red-400">{{ errorMessage() }}</p>
      }
    </div>
  `,
})
export class RecurringTemplatesComponent {
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

  // Keys start with 'expenses' so the existing ['expenses'] invalidation refreshes them.
  private readonly monthQuery = injectQuery(() => ({
    queryKey: ['expenses', 'month-tx', this.monthName()],
    enabled: !!this.monthName(),
    queryFn: () => this.transactionService.fetchMonthTransactions(this.monthName()),
  }));
  private readonly prevMonthQuery = injectQuery(() => ({
    queryKey: ['expenses', 'month-tx', this.prevMonthName()],
    enabled: !!this.prevMonthName(),
    queryFn: () => this.transactionService.fetchMonthTransactions(this.prevMonthName()),
  }));
  private readonly pendingQuery = this.transactionService.getPendingTransactionsQuery();

  readonly loading = computed(() => this.monthQuery.isPending() || this.pendingQuery.isPending());

  readonly chips = computed(() => {
    const monthTxs = this.monthQuery.data() ?? [];
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
      template.amount == null ? lastAmountFor(template, this.prevMonthQuery.data() ?? []) : null;
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
