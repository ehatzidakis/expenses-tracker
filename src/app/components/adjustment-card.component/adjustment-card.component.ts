import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Adjustment } from '../../models/adjustments.model';
import { SensitiveDirective } from '../../utils/sensitive.directive';

function formatDateForInput(dateVal: Date | string): string {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal).substring(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** One one-off (or trip) as a row. Income reads avocado; spending stays neutral cream. */
@Component({
  selector: 'app-adjustment-card',
  standalone: true,
  imports: [CommonModule, SensitiveDirective],
  host: { class: 'block' },
  template: `
    <button
      type="button"
      class="flex w-full min-h-14 items-center justify-between gap-3 py-3 text-left hover:bg-ink/[0.03] cursor-pointer"
      (click)="cardClick.emit()"
    >
      <span class="flex min-w-0 items-center gap-3">
        <span
          class="flex size-6 shrink-0 items-center justify-center"
          [class]="isAddition() ? 'text-avocado' : 'text-ink-3'"
          aria-hidden="true"
        >
          <svg
            class="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            @if (adjustment().isTrip) {
              <path
                d="M2.5 19h19M3.6 12.6l2.4 2.3 5.2-1.4L6 6.5l2.2-.6 6.9 5.4 4.2-1.1a1.6 1.6 0 0 1 .8 3.1l-13 3.5-3.6-3.4z"
              />
            } @else if (isAddition()) {
              <path d="M12 19V5M6 11l6-6 6 6" />
            } @else {
              <path d="M12 5v14M6 13l6 6 6-6" />
            }
          </svg>
        </span>
        <span class="min-w-0">
          <span class="flex items-center gap-1.5">
            <span class="truncate text-[15px] font-medium text-ink">{{ adjustment().title }}</span>
            @if (adjustment().isTrip) {
              <span
                class="shrink-0 rounded-md border px-1.5 py-px text-[11px] font-medium"
                [class]="
                  adjustment().isSelectable
                    ? 'border-avocado/40 text-avocado'
                    : 'border-edge text-ink-3'
                "
              >
                {{ adjustment().isSelectable ? 'Open' : 'Closed' }}
              </span>
            }
          </span>
          <span class="mt-0.5 block text-[12px] text-ink-3">
            @if (isSameDay()) {
              {{ adjustment().startDate | date: 'd MMM y' }}
            } @else {
              {{ adjustment().startDate | date: 'd MMM' }} –
              {{ adjustment().endDate | date: 'd MMM y' }}
            }
          </span>
        </span>
      </span>
      <span
        class="shrink-0 text-[15px] font-semibold tabular-nums"
        [class]="isAddition() ? 'text-avocado' : 'text-ink'"
        appSensitive
      >
        {{ isAddition() ? '+' : '-' }}€{{ adjustment().amount | number: '1.2-2' }}
      </span>
    </button>
  `,
})
export class AdjustmentCardComponent {
  readonly adjustment = input.required<Adjustment>();

  readonly cardClick = output<void>();

  readonly isAddition = computed(() => !this.adjustment().isTrip && this.adjustment().adjType);

  readonly isSameDay = computed(() => {
    const adj = this.adjustment();
    if (!adj.startDate || !adj.endDate) return true;
    return formatDateForInput(adj.startDate) === formatDateForInput(adj.endDate);
  });
}
