import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { BudgetMode, ExpenseStateService } from '../../services/expense-state.service';
import { AdjustmentService } from '../../services/adjustment-service';
import { Adjustment } from '../../models/adjustments.model';
import { MonthSelectorComponent } from '../month-selector.component/month-selector.component';
import { MonthSummaryComponent } from '../period-summary/month-summary';
import { CategoryBreakdownComponent } from '../category-breakdown.component/category-breakdown.component';
import { RecentTransactionsComponent } from '../recent-transactions/recent-transactions';
import { AdjustmentSelectorComponent } from '../adjustment-selector/adjustment-selector';
import { TripBreakdownComponent } from '../trip-breakdown/trip-breakdown';
import { SinglesViewComponent } from '../singles-view/singles-view';
import { EditAdjustmentComponent } from '../edit-adjustment.component/edit-adjustment.component';
import { SheetComponent } from '../sheet/sheet';
import type { SinglesType } from '../singles-view/singles-view.util';
import { monthTiming } from '../../utils/period-pace';

/**
 * The Budget tab: one page for every period with money in it. A month, a trip and the one-offs
 * share the same order: selector, summary, breakdown, transactions.
 */
@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    MonthSelectorComponent,
    MonthSummaryComponent,
    CategoryBreakdownComponent,
    RecentTransactionsComponent,
    AdjustmentSelectorComponent,
    TripBreakdownComponent,
    SinglesViewComponent,
    EditAdjustmentComponent,
    SheetComponent,
  ],
  host: { class: 'flex flex-col gap-5' },
  template: `
    <div role="group" aria-label="Period" class="grid grid-cols-3 rounded-xl border border-edge p-0.5">
      @for (option of modes; track option.id) {
        <button
          type="button"
          class="min-h-11 rounded-[10px] text-[14px] font-medium transition-colors duration-150 cursor-pointer"
          [class]="mode() === option.id ? 'bg-ember/20 text-ink ring-1 ring-inset ring-ember/60' : 'text-ink-3 hover:text-ink'"
          [attr.aria-pressed]="mode() === option.id"
          (click)="state.budgetMode.set(option.id)"
        >
          {{ option.label }}
        </button>
      }
    </div>

    @switch (mode()) {
      @case ('month') {
        @if (state.expensesQuery.isPending()) {
          <div class="flex flex-col gap-5 animate-pulse" aria-label="Loading the month">
            <div class="h-11 rounded-xl bg-panel"></div>
            <div class="h-52 rounded-2xl bg-panel"></div>
            <div class="h-64 rounded-xl bg-panel/60"></div>
          </div>
        } @else if (state.expensesQuery.isError()) {
          <ng-container *ngTemplateOutlet="loadError; context: { what: 'your months', retry: retryMonths }" />
        } @else if (!hasMonths()) {
          <div class="flex flex-col items-center gap-3 border-y border-ink/10 py-14 text-center">
            <p class="text-[15px] text-ink">No months yet</p>
            <p class="max-w-64 text-[13px] text-ink-3">
              The month appears here as soon as its first expense is added.
            </p>
            <button
              type="button"
              class="min-h-11 rounded-xl bg-ember px-5 text-[14px] font-semibold text-ground hover:bg-ember-ink cursor-pointer"
              (click)="state.setActiveTab('create')"
            >
              Add an expense
            </button>
          </div>
        } @else if (state.selectedExpense(); as month) {
          <app-month-selector
            [months]="state.processedExpenses()"
            [selectedId]="month.id"
            (monthSelected)="state.selectMonth($event)"
          />

          <app-month-summary
            [categories]="state.categoryBreakdown()"
            [totalWage]="state.selectedTotalWage()"
            [timing]="timing()"
            [monthName]="state.selectedExpense()?.MonthName ?? ''"
          />

          <app-category-breakdown
            [categories]="state.categoryBreakdown()"
            [monthName]="month.MonthName"
            [pace]="timing().pace"
          />

          <app-recent-transactions [monthName]="month.MonthName" />
        }
      }

      @case ('trips') {
        @if (adjustmentsQuery.isPending()) {
          <div class="flex flex-col gap-5 animate-pulse" aria-label="Loading trips">
            <div class="h-11 rounded-xl bg-panel"></div>
            <div class="h-44 rounded-2xl bg-panel"></div>
          </div>
        } @else if (adjustmentsQuery.isError()) {
          <ng-container *ngTemplateOutlet="loadError; context: { what: 'your trips', retry: retryAdjustments }" />
        } @else if (!trips().length) {
          <div class="flex flex-col items-center gap-2 border-y border-ink/10 py-14 text-center">
            <p class="text-[15px] text-ink">No trips yet</p>
            <p class="max-w-64 text-[13px] text-ink-3">
              Create a trip from the Add tab, then link expenses to it while you're away.
            </p>
          </div>
        } @else if (selectedTrip(); as trip) {
          <app-adjustment-selector
            [adjustments]="sortedAdjustments()"
            [selectedId]="trip.id"
            [includeSingles]="false"
            (selectionChanged)="selectedTripId.set($event)"
          />
          <app-trip-breakdown [trip]="trip" />
          <app-recent-transactions [adjustmentId]="trip.id" />
        }
      }

      @case ('oneoffs') {
        @if (adjustmentsQuery.isPending()) {
          <div class="flex flex-col gap-5 animate-pulse" aria-label="Loading one-offs">
            <div class="h-32 rounded-2xl bg-panel"></div>
            <div class="h-48 rounded-xl bg-panel/60"></div>
          </div>
        } @else if (adjustmentsQuery.isError()) {
          <ng-container *ngTemplateOutlet="loadError; context: { what: 'your one-offs', retry: retryAdjustments }" />
        } @else {
          <app-singles-view
            [adjustments]="singleAdjustments()"
            [(type)]="singlesType"
            [(year)]="singlesYear"
            (edit)="editingOneOff.set($event)"
          />
        }
      }
    }

    <ng-template #loadError let-what="what" let-retry="retry">
      <div role="alert" class="flex flex-col items-start gap-3 border-y border-ink/10 py-6">
        <p class="text-[15px] text-ink">Couldn't load {{ what }}.</p>
        <p class="text-[13px] text-ink-3">Check your connection and try again.</p>
        <button
          type="button"
          class="min-h-11 rounded-xl border border-edge px-4 text-[14px] font-medium text-ink hover:border-ink-4 cursor-pointer"
          (click)="retry()"
        >
          Try again
        </button>
      </div>
    </ng-template>

    @if (editingOneOff(); as adjustment) {
      <app-sheet label="Edit one-off" (closed)="editingOneOff.set(null)">
        <app-edit-adjustment
          [adjustment]="adjustment"
          (back)="editingOneOff.set(null)"
          (updated)="editingOneOff.set(null)"
          (deleted)="editingOneOff.set(null)"
        />
      </app-sheet>
    }
  `,
})
export class BudgetPageComponent {
  readonly state = inject(ExpenseStateService);
  private readonly adjustmentService = inject(AdjustmentService);

  readonly adjustmentsQuery = this.adjustmentService.getAdjustmentsQuery();

  readonly modes: { id: BudgetMode; label: string }[] = [
    { id: 'month', label: 'Month' },
    { id: 'trips', label: 'Trips' },
    { id: 'oneoffs', label: 'One-offs' },
  ];

  readonly mode = this.state.budgetMode;

  readonly hasMonths = computed(() => this.state.processedExpenses().some((e) => e.id !== 'ALL'));

  readonly timing = computed(() => monthTiming(this.state.selectedExpense()?.MonthName ?? ''));

  readonly sortedAdjustments = computed(() =>
    [...(this.adjustmentsQuery.data() ?? [])].sort(
      (a, b) => b.startDate.getTime() - a.startDate.getTime(),
    ),
  );

  readonly trips = computed(() => this.sortedAdjustments().filter((a) => a.isTrip));
  readonly singleAdjustments = computed(() => this.sortedAdjustments().filter((a) => !a.isTrip));

  readonly selectedTripId = signal<string | null>(null);
  /** The picked trip, or the newest one. */
  readonly selectedTrip = computed<Adjustment | null>(
    () => this.trips().find((t) => t.id === this.selectedTripId()) ?? this.trips()[0] ?? null,
  );

  readonly singlesType = signal<SinglesType | null>(null);
  readonly singlesYear = signal<number | null>(null);
  readonly editingOneOff = signal<Adjustment | null>(null);

  readonly retryMonths = () => void this.state.expensesQuery.refetch();
  readonly retryAdjustments = () => void this.adjustmentsQuery.refetch();
}
