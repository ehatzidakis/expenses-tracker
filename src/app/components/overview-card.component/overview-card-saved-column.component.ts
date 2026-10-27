import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { OverviewCardBreakdownComponent } from './overview-card-breakdown.component';
import { YearlyBreakdownEntry } from './overview-card.models';
import { PrivacyService } from '../../services/privacy.service';

@Component({
  selector: 'app-overview-card-saved-column',
  standalone: true,
  imports: [CommonModule, OverviewCardBreakdownComponent],
  host: { class: 'block' },
  template: `
    <div class="text-right">
      <span class="text-xs font-medium text-gray-400 uppercase tracking-wider block"
        >Total Saved</span
      >
      <div class="flex items-baseline justify-end mt-1">
        <h2
          class="text-3xl font-extrabold tracking-tight tabular-nums"
          [class]="totalSaved() >= 0 ? 'text-emerald-400' : 'text-red-400'"
          [class.blur-md]="privacyService.isPrivacyMode()"
          [class.select-none]="privacyService.isPrivacyMode()"
        >
          €{{ totalSaved() | number: '1.2-2' }}
        </h2>
      </div>

      @if (hasBreakdown()) {
        <div class="mt-2.5 space-y-2">
          <div class="flex items-center justify-between gap-2 text-[11px]">
            <span class="text-gray-500 text-[10px]">Monthly Saved:</span>
            <span
              class="text-gray-300 font-medium tabular-nums"
              [class.blur-md]="privacyService.isPrivacyMode()"
              [class.select-none]="privacyService.isPrivacyMode()"
              >€{{ monthlySaved() | number: '1.2-2' }}</span
            >
          </div>
          <div class="flex items-center justify-between gap-2 text-[11px]">
            <span class="text-gray-500 text-[10px]">One-Off Bonuses:</span>
            <span
              class="text-gray-300 font-medium tabular-nums"
              [class.blur-md]="privacyService.isPrivacyMode()"
              [class.select-none]="privacyService.isPrivacyMode()"
              >€{{ oneOffBonuses() | number: '1.2-2' }}</span
            >
          </div>
        </div>
      }

      <app-overview-card-breakdown
        [expanded]="expanded()"
        [hasBreakdown]="hasBreakdown()"
        mode="saved"
        [yearlyBreakdown]="yearlyBreakdown()"
        [monthlyValue]="monthlySaved()"
        [oneOffValue]="oneOffBonuses()"
      />
    </div>
  `,
})
export class OverviewCardSavedColumnComponent {
  readonly totalSaved = input.required<number>();
  readonly hasBreakdown = input(false);
  readonly expanded = input(false);
  readonly monthlySaved = input<number | null>(null);
  readonly oneOffBonuses = input<number | null>(null);
  readonly yearlyBreakdown = input<YearlyBreakdownEntry[]>([]);

  readonly privacyService = inject(PrivacyService);
}
