import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { OverviewCardBreakdownComponent } from './overview-card-breakdown.component';
import { YearlyBreakdownEntry } from './overview-card.models';
import { PrivacyService } from '../../services/privacy.service';

@Component({
  selector: 'app-overview-card-spend-column',
  standalone: true,
  imports: [CommonModule, OverviewCardBreakdownComponent],
  host: { class: 'block' },
  template: `
    <div class="text-left">
      <span class="text-xs font-medium text-gray-400 uppercase tracking-wider block"
        >Total Actual Spend</span
      >

      <div class="flex items-baseline justify-start mt-1">
        <h2
          class="text-3xl font-extrabold text-white tracking-tight tabular-nums"
          [class.blur-md]="privacyService.isPrivacyMode()"
          [class.select-none]="privacyService.isPrivacyMode()"
        >
          €{{ totalSpend() | number: '1.2-2' }}
        </h2>
      </div>

      @if (hasBreakdown()) {
        <div class="mt-2.5 space-y-2">
          <div class="flex items-center justify-between gap-2 text-[11px]">
            <span class="text-gray-500 text-[10px]">Monthly Expenses:</span>
            <span
              class="text-gray-300 font-medium tabular-nums"
              [class.blur-md]="privacyService.isPrivacyMode()"
              [class.select-none]="privacyService.isPrivacyMode()"
              >€{{ monthlyExpenses() | number: '1.2-2' }}</span
            >
          </div>
          <div class="flex items-center justify-between gap-2 text-[11px]">
            <span class="text-gray-500 text-[10px]">One-Off Expenses:</span>
            <span
              class="text-gray-300 font-medium tabular-nums"
              [class.blur-md]="privacyService.isPrivacyMode()"
              [class.select-none]="privacyService.isPrivacyMode()"
              >€{{ oneOffExpenses() | number: '1.2-2' }}</span
            >
          </div>
        </div>
      }

      <app-overview-card-breakdown
        [expanded]="expanded()"
        [hasBreakdown]="hasBreakdown()"
        mode="expenses"
        [yearlyBreakdown]="yearlyBreakdown()"
        [monthlyValue]="monthlyExpenses()"
        [oneOffValue]="oneOffExpenses()"
      />
    </div>
  `,
})
export class OverviewCardSpendColumnComponent {
  readonly totalSpend = input.required<number>();
  readonly hasBreakdown = input(false);
  readonly expanded = input(false);
  readonly monthlyExpenses = input<number | null>(null);
  readonly oneOffExpenses = input<number | null>(null);
  readonly yearlyBreakdown = input<YearlyBreakdownEntry[]>([]);

  readonly privacyService = inject(PrivacyService);
}
