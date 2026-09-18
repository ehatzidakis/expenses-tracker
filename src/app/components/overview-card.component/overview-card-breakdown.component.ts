import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { PrivacyService } from '../../services/privacy.service';
import { YearlyBreakdownEntry } from './overview-card.models';

export type OverviewCardBreakdownMode = 'expenses' | 'saved';

@Component({
  selector: 'app-overview-card-breakdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-300 ease-out"
      [class.grid-rows-[0fr]]="!expanded()"
      [class.grid-rows-[1fr]]="expanded()"
      [class.opacity-0]="!expanded()"
      [class.opacity-100]="expanded()"
      [class.translate-y-[-4px]]="!expanded()"
      [class.translate-y-0]="expanded()"
    >
      <div class="overflow-hidden">
        @if (hasBreakdown()) {
          @if (yearlyBreakdown().length) {
            <div class="mt-2.5 space-y-2" [class.text-left]="mode() === 'saved'">
              @for (yearSummary of yearlyBreakdown(); track yearSummary.year; let idx = $index) {
                <div
                  class="space-y-1 transition-all duration-300 ease-out"
                  [style.transition-delay]="expanded() ? idx * 35 + 'ms' : '0ms'"
                  [class.translate-y-[-4px]]="!expanded()"
                  [class.translate-y-0]="expanded()"
                  [class.opacity-0]="!expanded()"
                  [class.opacity-100]="expanded()"
                >
                  <div
                    class="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500"
                  >
                    {{ yearSummary.year }}
                  </div>

                  @if (mode() === 'expenses') {
                    <div class="flex items-center justify-between gap-2 text-[11px]">
                      <span class="text-gray-500 text-[9px]">Monthly Expenses:</span>
                      <span
                        class="text-gray-300 font-medium tabular-nums"
                        [class.blur-md]="privacyService.isPrivacyMode()"
                        [class.select-none]="privacyService.isPrivacyMode()"
                        >€{{ yearSummary.monthlyExpenses | number: '1.2-2' }}</span
                      >
                    </div>
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-gray-500 text-[9px]">One-Off Expenses:</span>
                      <span
                        class="text-gray-300 font-medium tabular-nums"
                        [class.blur-md]="privacyService.isPrivacyMode()"
                        [class.select-none]="privacyService.isPrivacyMode()"
                        >€{{ yearSummary.oneOffExpenses | number: '1.2-2' }}</span
                      >
                    </div>
                    <div class="flex items-center justify-between text-nowrap text-[11px]">
                      <span class="text-gray-500 text-[9px]"
                        >Total {{ yearSummary.year }} Expenses:</span
                      >
                      <span
                        class="text-gray-300 font-medium tabular-nums"
                        [class.blur-md]="privacyService.isPrivacyMode()"
                        [class.select-none]="privacyService.isPrivacyMode()"
                        >€{{
                          yearSummary.monthlyExpenses + yearSummary.oneOffExpenses | number: '1.2-2'
                        }}</span
                      >
                    </div>
                  } @else {
                    <div class="flex items-center justify-between gap-2 text-[11px]">
                      <span class="text-gray-500 text-[9px]">Monthly Saved:</span>
                      <span
                        class="text-gray-300 font-medium tabular-nums"
                        [class.blur-md]="privacyService.isPrivacyMode()"
                        [class.select-none]="privacyService.isPrivacyMode()"
                        >€{{ yearSummary.monthlySaved | number: '1.2-2' }}</span
                      >
                    </div>
                    <div class="flex items-center justify-between gap-2 text-[11px]">
                      <span class="text-gray-500 text-[9px]">One-Off Bonuses:</span>
                      <span
                        class="text-gray-300 font-medium tabular-nums"
                        [class.blur-md]="privacyService.isPrivacyMode()"
                        [class.select-none]="privacyService.isPrivacyMode()"
                        >€{{ yearSummary.oneOffBonuses | number: '1.2-2' }}</span
                      >
                    </div>
                    <div class="flex items-center justify-between gap-2 text-[11px]">
                      <span class="text-gray-500 text-[9px]"
                        >Total {{ yearSummary.year }} Saved:</span
                      >
                      <span
                        class="text-emerald-400 font-medium tabular-nums"
                        [class.blur-md]="privacyService.isPrivacyMode()"
                        [class.select-none]="privacyService.isPrivacyMode()"
                        >€{{
                          yearSummary.oneOffBonuses +
                            yearSummary.monthlySaved -
                            yearSummary.oneOffExpenses | number: '1.2-2'
                        }}</span
                      >
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="mt-2.5 space-y-1" [class.text-right]="mode() === 'saved'">
              <div
                class="flex gap-2 text-[11px] transition-all duration-300 ease-out"
                [class.justify-baseline]="mode() === 'expenses'"
                [class.justify-end]="mode() === 'saved'"
                [class.translate-y-[-4px]]="!expanded()"
                [class.translate-y-0]="expanded()"
                [class.opacity-0]="!expanded()"
                [class.opacity-100]="expanded()"
              >
                <span class="text-gray-500">{{
                  mode() === 'expenses' ? 'Monthly Expenses:' : 'Monthly Saved:'
                }}</span>
                <span
                  class="text-gray-300 font-medium tabular-nums"
                  [class.blur-md]="privacyService.isPrivacyMode()"
                  [class.select-none]="privacyService.isPrivacyMode()"
                  >€{{ monthlyValue() | number: '1.2-2' }}</span
                >
              </div>
              <div
                class="flex gap-2 text-[11px] transition-all duration-300 ease-out"
                [class.justify-baseline]="mode() === 'expenses'"
                [class.justify-end]="mode() === 'saved'"
                [style.transition-delay]="expanded() ? '80ms' : '0ms'"
                [class.translate-y-[-4px]]="!expanded()"
                [class.translate-y-0]="expanded()"
                [class.opacity-0]="!expanded()"
                [class.opacity-100]="expanded()"
              >
                <span class="text-gray-500">{{
                  mode() === 'expenses' ? 'One-Off Expenses:' : 'One-Off Bonuses:'
                }}</span>
                <span
                  class="text-gray-300 font-medium tabular-nums"
                  [class.blur-md]="privacyService.isPrivacyMode()"
                  [class.select-none]="privacyService.isPrivacyMode()"
                  >€{{ oneOffValue() | number: '1.2-2' }}</span
                >
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class OverviewCardBreakdownComponent {
  readonly expanded = input(false);
  readonly hasBreakdown = input(false);
  readonly mode = input.required<OverviewCardBreakdownMode>();
  readonly yearlyBreakdown = input<YearlyBreakdownEntry[]>([]);
  readonly monthlyValue = input<number | null>(null);
  readonly oneOffValue = input<number | null>(null);

  readonly privacyService = inject(PrivacyService);
}
