import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { SplitzSettlementService } from '../../services/splitz-settlement.service';
import { SplitzService } from '../../services/splitz.service';
import { SplitzParticipant } from '../../models/splitz.model';
import { participantName } from './pending-review.model';
import { groupSettlements, SettlementGroup, SettlementRow } from './splitz-history.model';
import { categoryLabel } from '../../utils/period-pace';
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
        <p role="alert" class="text-[13px] text-cherry">
          Couldn't load the history. Check your connection and try again.
        </p>
        <button type="button" [class]="secondary" (click)="historyQuery.refetch()">
          Try again
        </button>
      </div>
    } @else if (groups().length === 0) {
      <p class="py-6 text-[13px] text-ink-3">No settlements yet.</p>
    } @else {
      <ul class="divide-y divide-ink/10 border-y border-ink/10">
        @for (group of groups(); track group.id) {
          <li class="settlement-group">
            <button
              type="button"
              class="flex w-full items-start gap-3 py-3 text-left cursor-pointer"
              [attr.aria-expanded]="isOpen(group.id)"
              [attr.aria-controls]="'settlement-' + $index"
              (click)="toggle(group.id)"
            >
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-full border border-edge bg-raised text-[12px] font-semibold text-ink-2"
                aria-hidden="true"
              >
                {{ initials(group.counterpartId) }}
              </span>

              <span class="min-w-0 flex-1">
                <span class="flex items-baseline justify-between gap-3">
                  <span class="truncate text-[15px] font-medium text-ink">
                    Settled with {{ name(group.counterpartId) }}
                  </span>
                  <span
                    class="shrink-0 text-[14px] font-medium tabular-nums"
                    [class]="group.net > 0 ? 'text-avocado-ink' : 'text-ink'"
                    appSensitive="xs"
                  >
                    €{{ abs(group.net) | number: '1.2-2' }}
                  </span>
                </span>

                <span class="mt-0.5 block text-[12px] text-ink-2">
                  {{ outcome(group) }} · {{ group.settledAt | date: 'd MMM yyyy, HH:mm' }}
                </span>

                @if (group.owedToMe > 0 && group.iOwed > 0) {
                  <span class="mt-0.5 block text-[12px] text-ink-3" appSensitive="xs">
                    {{ name(group.counterpartId) }} owed me €{{
                      group.owedToMe | number: '1.2-2'
                    }}
                    · I owed {{ name(group.counterpartId) }} €{{ group.iOwed | number: '1.2-2' }}
                  </span>
                }

                <span class="mt-0.5 block text-[12px] text-ink-3">
                  {{ group.rows.length }}
                  {{ group.rows.length === 1 ? 'transaction' : 'transactions' }}
                  @if (group.first && group.last && group.first !== group.last) {
                    · {{ group.first.date | date: 'd MMM' }} –
                    {{ group.last.date | date: 'd MMM yyyy' }}
                  } @else if (group.last) {
                    · {{ group.last.date | date: 'd MMM yyyy' }}
                  }
                </span>

                @if (group.first && group.last && group.first !== group.last) {
                  <span class="mt-0.5 block truncate text-[12px] text-ink-3">
                    First: {{ group.first.description || 'Untitled' }} · Last:
                    {{ group.last.description || 'Untitled' }}
                  </span>
                }

                @if (group.note) {
                  <span class="mt-1 block text-[12px] italic text-ink-2">{{ group.note }}</span>
                }
              </span>

              <svg
                class="mt-1 size-3.5 shrink-0 text-ink-3 transition-transform duration-200"
                [class.rotate-180]="isOpen(group.id)"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                />
              </svg>
            </button>

            @if (isOpen(group.id)) {
              <ul
                [id]="'settlement-' + $index"
                class="mb-3 ml-12 divide-y divide-ink/10 border-t border-ink/10"
              >
                @for (row of group.rows; track row.id) {
                  <li class="settlement-row flex items-start justify-between gap-3 py-2.5">
                    <div class="min-w-0">
                      <p class="truncate text-[14px] text-ink">
                        {{ row.description || 'Settlement' }}
                      </p>
                      <p class="mt-0.5 truncate text-[12px] text-ink-3">
                        @if (row.date) {
                          {{ row.date | date: 'd MMM yyyy' }} ·
                        }
                        @if (row.category) {
                          {{ category(row.category) }} ·
                        }
                        {{ payer(row.creditorId) }} paid
                      </p>
                    </div>
                    <div class="shrink-0 text-right tabular-nums">
                      <p
                        class="text-[13px] font-medium"
                        [class]="row.creditorId === 'me' ? 'text-avocado-ink' : 'text-ink'"
                        appSensitive="xs"
                      >
                        {{ owedLabel(row) }} €{{ row.amount | number: '1.2-2' }}
                      </p>
                      @if (row.transactionTotalAmount != null) {
                        <p class="mt-0.5 text-[12px] text-ink-3" appSensitive="xs">
                          Full amount: €{{ row.transactionTotalAmount | number: '1.2-2' }}
                        </p>
                      }
                    </div>
                  </li>
                }
              </ul>
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
  // Only for each row's category and full amount; History still works without it.
  private readonly splitTxQuery = inject(SplitzService).getSplitTransactionsQuery();

  readonly groups = computed(() =>
    groupSettlements(this.historyQuery.data() ?? [], this.splitTxQuery.data() ?? []),
  );

  private readonly openIds = signal<ReadonlySet<string>>(new Set());

  isOpen(id: string): boolean {
    return this.openIds().has(id);
  }

  toggle(id: string): void {
    this.openIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  name(id: SplitzParticipant): string {
    return participantName(id);
  }

  initials(id: SplitzParticipant): string {
    return participantName(id).slice(0, 2).toUpperCase();
  }

  payer(id: SplitzParticipant): string {
    return id === 'me' ? 'I' : participantName(id);
  }

  category(name: string): string {
    return categoryLabel(name);
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  /** Who paid whom to close the settle-up. */
  outcome(group: SettlementGroup): string {
    const other = participantName(group.counterpartId);
    if (group.net > 0) return `${other} paid me`;
    if (group.net < 0) return `I paid ${other}`;
    return 'Evened out, no money changed hands';
  }

  owedLabel(row: SettlementRow): string {
    if (row.creditorId === 'me') return `${participantName(row.debtorId)} owed me`;
    if (row.debtorId === 'me') return `I owed ${participantName(row.creditorId)}`;
    return `${participantName(row.debtorId)} owed ${participantName(row.creditorId)}`;
  }
}
