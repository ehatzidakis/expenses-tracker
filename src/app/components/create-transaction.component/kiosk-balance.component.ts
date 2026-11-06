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
    <!-- Not blurred: only the kiosk login sees this, and it is their own balance -->
    <p class="flex min-h-11 items-center justify-between gap-3 border-b border-ink/10 pb-3 text-[14px]">
      <span class="text-ink-2">Your balance</span>
      @if (netBalance() > 0) {
        <span class="type-wide font-semibold text-avocado-ink">You are owed €{{ netBalance().toFixed(2) }}</span>
      } @else if (netBalance() < 0) {
        <span class="type-wide font-semibold text-ink">You owe €{{ (-netBalance()).toFixed(2) }}</span>
      } @else {
        <span class="text-ink-3">All settled</span>
      }
    </p>
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
