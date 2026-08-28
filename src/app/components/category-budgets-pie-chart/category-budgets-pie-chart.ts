import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ExpenseStateService } from '../../services/expense-state.service';
import {
  buildPieChartSlices,
  dimColorForSelection,
  PieChartSlice,
} from './category-budgets-pie-chart.util';

@Component({
  selector: 'app-category-budgets-pie-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-budgets-pie-chart.html',
})
export class CategoryBudgetsPieChartComponent {
  readonly state = inject(ExpenseStateService);
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
