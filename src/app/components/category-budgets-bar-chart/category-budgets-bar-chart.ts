import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { PrivacyService } from '../../services/privacy.service';

export interface MonthlyTrendItem {
  id: string;
  monthName: string;
  shortLabel: string;
  total: number;
  wage: number;
}

@Component({
  selector: 'app-category-budgets-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-budgets-bar-chart.html',
})
export class CategoryBudgetsBarChartComponent {
  readonly privacyService = inject(PrivacyService);

  @Input() monthlyTrends: MonthlyTrendItem[] = [];
  @Input() activeMonth: MonthlyTrendItem | null = null;
  @Input() maxTrendSpend = 2000;

  @Output() monthSelected = new EventEmitter<string>();

  selectMonth(id: string): void {
    this.monthSelected.emit(id);
  }

  getBarHeightPercent(amount: number): number {
    const max = this.maxTrendSpend;
    if (max <= 0) return 0;
    return Math.min(Math.round((amount / max) * 100), 100);
  }

  getWageLinePercent(wage?: number): number {
    const targetWage = wage ?? this.activeMonth?.wage ?? 1600;
    const max = this.maxTrendSpend;
    if (max <= 0) return 0;
    return Math.min(Math.round((targetWage / max) * 100), 100);
  }
}
