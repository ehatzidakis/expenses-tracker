import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SensitiveDirective } from '../../utils/sensitive.directive';

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
  imports: [CommonModule, SensitiveDirective],
  template: `
    <div class="space-y-4">
      @if (monthlyTrends.length === 0) {
        <div class="text-center py-12 text-xs text-ink-3">No monthly data available yet.</div>
      } @else {
        @if (activeMonth; as active) {
          <div
            class="bg-ground/70 border border-raised/90 rounded-xl p-3 flex items-center justify-between transition-all"
          >
            <div>
              <span class="text-[11px] font-bold text-ink-2 uppercase tracking-wider block"
                >Selected Period</span
              >
              <span class="text-xs font-semibold text-ink">{{ active.monthName }}</span>
            </div>

            <div class="flex items-center gap-4 text-right">
              <div>
                <span class="text-[11px] text-ink-2 block">Spend</span>
                <span
                  class="text-xs font-bold"
                  [class.text-cherry]="active.total > active.wage"
                  [class.text-ember-ink]="active.total <= active.wage"
                  appSensitive
                >
                  €{{ active.total | number: '1.2-2' }}
                </span>
              </div>

              <div class="border-l border-raised pl-4">
                <span class="text-[11px] text-ink-2 block">Wage</span>
                <span class="text-xs font-bold text-avocado-ink" appSensitive>
                  €{{ active.wage | number: '1.0-0' }}
                </span>
              </div>
            </div>
          </div>
        }

        <div
          class="relative pt-1 pb-2 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none"
        >
          <div
            class="inline-flex min-w-full items-end gap-3 h-44 border-b border-raised/80 pb-6 relative pl-2"
          >
            @for (item of monthlyTrends; track item.id) {
              <div
                (click)="selectMonth(item.id)"
                class="flex-none w-8 flex flex-col items-center h-full justify-end relative snap-center cursor-pointer group"
              >
                <div
                  class="absolute left-1 right-1 border-b border-avocado-ink/30 z-0 pointer-events-none"
                  [style.bottom.%]="getWageLinePercent(item.wage)"
                ></div>

                <div
                  class="w-full max-w-5 rounded-t-lg transition-all duration-200 relative z-10 active:scale-95 min-h-1"
                  [class.bg-cherry-fill]="item.total > item.wage"
                  [class.bg-ember]="item.total <= item.wage"
                  [class.ring-2]="activeMonth?.id === item.id"
                  [class.ring-ember-ink]="activeMonth?.id === item.id"
                  [class.ring-offset-2]="activeMonth?.id === item.id"
                  [class.ring-offset-ground]="activeMonth?.id === item.id"
                  [class.brightness-125]="activeMonth?.id === item.id"
                  [class.shadow-lg]="activeMonth?.id === item.id"
                  [class.opacity-100]="activeMonth?.id === item.id"
                  [class.opacity-60]="activeMonth?.id !== item.id"
                  [style.height.%]="getBarHeightPercent(item.total)"
                ></div>

                <span
                  class="absolute -bottom-6 text-[11px] font-semibold transition-colors whitespace-nowrap"
                  [class.text-ember-ink]="activeMonth?.id === item.id"
                  [class.font-bold]="activeMonth?.id === item.id"
                  [class.text-ink-2]="activeMonth?.id !== item.id"
                >
                  {{ item.shortLabel }}
                </span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class CategoryBudgetsBarChartComponent {
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
