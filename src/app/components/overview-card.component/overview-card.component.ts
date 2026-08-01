import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategorySpend } from '../../services/expense-state.service';
import { PrivacyService } from '../../services/privacy.service';

@Component({
  selector: 'app-overview-card',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './overview-card.component.html',
})
export class OverviewCardComponent {
  totalSpend = input.required<number>();
  totalWage = input<number>(0);
  totalSaved = input<number | null>(null);
  monthName = input<string>('');
  dateRangeInfo = input<{ count: number; first: string; last: string } | null>(null);
  topCategory = input<CategorySpend | null>(null);

  monthlyExpenses = input<number | null>(null);
  oneOffExpenses = input<number | null>(null);
  monthlySaved = input<number | null>(null);
  oneOffBonuses = input<number | null>(null);

  computedTotalSaved = computed(() => this.totalSaved() ?? this.totalWage() - this.totalSpend());

  // Breakdown rows only apply when the parent supplies the monthly/one-off split (SumUp view).
  hasBreakdown = computed(() => this.monthlyExpenses() !== null);
  expanded = signal(false);

  readonly privacyService = inject(PrivacyService);

  toggleExpanded(): void {
    if (this.hasBreakdown()) {
      this.expanded.update((v) => !v);
    }
  }
}
