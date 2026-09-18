import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ExpenseStateService } from '../../services/expense-state.service';
import {
  buildPieChartSlices,
  dimColorForSelection,
  PieChartSlice,
} from './category-budgets-pie-chart.util';
import { PrivacyService } from '../../services/privacy.service';

@Component({
  selector: 'app-category-budgets-pie-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-5">
      @if (pieChartSlices().length === 0) {
        <div class="text-center py-12 text-xs text-gray-500">
          No data available for this period.
        </div>
      } @else {
        <div class="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
          <div class="flex items-center justify-center">
            <div class="relative flex items-center justify-center">
              <div
                class="h-44 w-44 rounded-full border border-gray-700/80 shadow-inner"
                [style.background]="chartStyle()"
              ></div>
              <div
                class="absolute inset-8 rounded-full bg-gray-950/95 border border-gray-700/80 flex flex-col items-center justify-center text-center"
              >
                <span class="text-[10px] uppercase tracking-[0.22em] text-gray-500">Total</span>
                <span
                  class="mt-1 text-lg font-bold text-white"
                  [class.blur-md]="privacyService.isPrivacyMode()"
                  [class.select-none]="privacyService.isPrivacyMode()"
                >
                  €{{
                    pieChartSlices().reduce((sum, slice) => sum + slice.amount, 0) | number: '1.0-0'
                  }}
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-2.5">
            @for (slice of pieChartSlices(); track slice.name) {
              <button
                type="button"
                class="flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-all"
                [class.border-indigo-400/50]="selectedSlice() === slice.name"
                [class.bg-indigo-500/8]="selectedSlice() === slice.name"
                [class.border-gray-800/70]="selectedSlice() !== slice.name"
                [class.bg-gray-950/60]="selectedSlice() !== slice.name"
                (click)="toggleSlice(slice.name)"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="h-2.5 w-2.5 rounded-full"
                    [style.background]="
                      dimColorForSelection(slice.color, selectedSlice() === slice.name)
                    "
                  ></span>
                  <span class="text-xs font-medium text-gray-200 truncate">{{ slice.name }}</span>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-[11px] font-semibold text-white">
                    {{ slice.percentage | number: '1.0-1' }}%
                  </div>
                  <div class="text-[10px] text-gray-400">€{{ slice.amount | number: '1.0-0' }}</div>
                </div>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class CategoryBudgetsPieChartComponent {
  readonly state = inject(ExpenseStateService);
  readonly privacyService = inject(PrivacyService);

  readonly selectedSlice = signal<string | null>(null);

  readonly pieChartSlices = computed(() => {
    const allTimeExpense = this.state.processedExpenses().find((expense) => expense.id === 'ALL');
    if (!allTimeExpense) return [] as PieChartSlice[];

    const expenseValues = { ...allTimeExpense } as Record<string, string | number>;
    return buildPieChartSlices(expenseValues, Number(allTimeExpense.TotalWage) || 0);
  });

  readonly chartStyle = computed(() => {
    const slices = this.pieChartSlices();
    const selected = this.selectedSlice();

    if (!slices.length) {
      return 'conic-gradient(#1f2937 0 100%)';
    }

    let accumulator = 0;
    const segments = slices.map((slice) => {
      const start = accumulator;
      accumulator += slice.percentage;
      const color = dimColorForSelection(slice.color, selected === slice.name);
      return `${color} ${start}% ${accumulator}%`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  });

  dimColorForSelection(color: string, isSelected: boolean): string {
    return dimColorForSelection(color, isSelected);
  }

  toggleSlice(name: string): void {
    const selected = this.selectedSlice();
    this.selectedSlice.set(selected === name ? null : name);
  }
}
