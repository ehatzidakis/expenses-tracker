import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { SplitzSettlementService } from '../../services/splitz-settlement.service';
import { participantName } from './pending-review.model';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { BUTTON_SECONDARY } from '../../utils/pill-styles';

@Component({
  selector: 'app-splitz-history',
  standalone: true,
  imports: [CommonModule, SensitiveDirective],
  host: { class: 'block' },
  template: `
    @if (historyQuery.isPending()) {
      <ul class="animate-pulse divide-y divide-ink/10" aria-label="Loading history">
        @for (item of [1, 2, 3]; track item) {
          <li class="py-3"><span class="block h-4 w-40 rounded bg-raised"></span></li>
        }
      </ul>
    } @else if (historyQuery.isError()) {
      <div class="flex flex-col items-start gap-3 py-4">
        <p role="alert" class="text-[13px] text-cherry">Couldn't load the history. Check your connection and try again.</p>
        <button type="button" [class]="secondary" (click)="historyQuery.refetch()">Try again</button>
      </div>
    } @else if (records().length === 0) {
      <p class="py-6 text-[13px] text-ink-3">No settlements yet.</p>
    } @else {
      <ul class="divide-y divide-ink/10 border-y border-ink/10">
        @for (record of records(); track record.id) {
          <li class="py-2.5">
            <div class="flex items-baseline justify-between gap-3">
              <p class="min-w-0 truncate text-[14px] text-ink">{{ record.description || 'Settlement' }}</p>
              <span class="shrink-0 text-[14px] font-medium text-ink tabular-nums" appSensitive="xs">
                €{{ record.amount | number: '1.2-2' }}
              </span>
            </div>
            <p class="mt-0.5 text-[12px] text-ink-3">
              {{ name(record.debtorId) }} to {{ name(record.creditorId) }}
              @if (record.settledAt) {
                · {{ record.settledAt | date: 'd MMM yyyy' }}
              }
            </p>
            @if (record.note) {
              <p class="mt-1 text-[12px] italic text-ink-2">{{ record.note }}</p>
            }
          </li>
        }
      </ul>
    }
  `,
})
export class SplitzHistoryComponent {
  protected readonly secondary = BUTTON_SECONDARY;
  private readonly settlementService = inject(SplitzSettlementService);
  readonly historyQuery = this.settlementService.getHistoryQuery();
  readonly records = computed(() => this.historyQuery.data() ?? []);

  name(id: 'me' | number): string {
    return participantName(id);
  }
}
