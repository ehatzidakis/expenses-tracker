import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { SplitzSettlementService } from '../../services/splitz-settlement.service';
import { participantName } from './pending-review.model';

@Component({
  selector: 'app-splitz-history',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    @if (historyQuery.isPending()) {
      <div class="space-y-2 animate-pulse">
        @for (item of [1, 2, 3]; track item) {
          <div class="h-12 rounded-xl bg-gray-800/60"></div>
        }
      </div>
    } @else if (records().length === 0) {
      <div class="py-8 text-center space-y-1">
        <p class="text-2xl">🧾</p>
        <p class="text-xs text-gray-500">No settlements yet.</p>
      </div>
    } @else {
      <div class="space-y-2">
        @for (record of records(); track record.id) {
          <article class="rounded-xl border border-gray-800/80 bg-gray-950/30 px-3 py-2.5">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-xs font-medium text-gray-200">
                  {{ record.description || 'Settlement' }}
                </p>
                <div class="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-gray-500">
                  <span>{{ name(record.debtorId) }} → {{ name(record.creditorId) }}</span>
                  @if (record.settledAt) {
                    <span>{{ record.settledAt | date: 'dd/MM/yyyy' }}</span>
                  }
                </div>
              </div>
              <span class="shrink-0 text-xs font-semibold text-white tabular-nums">
                €{{ record.amount | number: '1.2-2' }}
              </span>
            </div>
            @if (record.note) {
              <p class="mt-2 text-[10px] text-gray-400">{{ record.note }}</p>
            }
          </article>
        }
      </div>
    }
  `,
})
export class SplitzHistoryComponent {
  private readonly settlementService = inject(SplitzSettlementService);
  readonly historyQuery = this.settlementService.getHistoryQuery();
  readonly records = computed(() => this.historyQuery.data() ?? []);

  name(id: 'me' | number): string {
    return participantName(id);
  }
}
