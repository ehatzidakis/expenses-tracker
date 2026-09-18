import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { SplitzService } from '../../services/splitz.service';
import { PEOPLE } from '../../models/splitz.model';

@Component({
  selector: 'app-kiosk-balance',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <div
      class="rounded-xl border bg-amber-950/20 p-3"
      [class.border-emerald-500/30]="netBalance() > 0"
      [class.bg-emerald-500/10]="netBalance() > 0"
      [class.border-amber-500/30]="netBalance() < 0"
      [class.bg-amber-500/10]="netBalance() < 0"
      [class.border-white/30]="netBalance() === 0"
      [class.bg-white/5]="netBalance() === 0"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-[10px] uppercase font-bold tracking-[0.12em] text-violet-300">
            Stavi balance
          </p>
          <p class="mt-1 text-sm font-semibold text-white">
            @if (netBalance() > 0) {
              You are owed €{{ netBalance().toFixed(2) }}
            } @else if (netBalance() < 0) {
              You owe €{{ (-netBalance()).toFixed(2) }}
            } @else {
              All settled — €0.00
            }
          </p>
        </div>
        <span
          class="rounded-full border px-2.5 py-1 text-[10px] font-semibold"
          [class.border-emerald-500/30]="netBalance() > 0"
          [class.bg-emerald-500/10]="netBalance() > 0"
          [class.text-emerald-300]="netBalance() > 0"
          [class.border-amber-500/30]="netBalance() < 0"
          [class.bg-amber-500/10]="netBalance() < 0"
          [class.text-amber-300]="netBalance() < 0"
          [class.border-white/30]="netBalance() === 0"
          [class.bg-white/5]="netBalance() === 0"
          [class.text-gray-200]="netBalance() === 0"
        >
          @if (netBalance() > 0) {
            Owed
          } @else if (netBalance() < 0) {
            Due
          } @else {
            Settled
          }
        </span>
      </div>
    </div>
  `,
})
export class KioskBalanceComponent {
  private readonly splitzService = inject(SplitzService);
  private readonly splitTransactionsQuery = this.splitzService.getSplitTransactionsQuery();

  readonly netBalance = computed(() => {
    const stavi = PEOPLE.find((person) => person.name === 'Stavi') ?? PEOPLE[0];
    const summaries = this.splitzService.computePersonSummaries(
      this.splitTransactionsQuery.data() ?? [],
    );
    const summary = summaries.find((entry) => entry.person.id === stavi.id);
    return -(summary?.netWithMe ?? 0);
  });
}
