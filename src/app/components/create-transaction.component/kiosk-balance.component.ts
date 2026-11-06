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
      class="rounded-xl border bg-ember-deep/20 p-3"
      [class.border-avocado/30]="netBalance() > 0"
      [class.bg-avocado/10]="netBalance() > 0"
      [class.border-ember/30]="netBalance() < 0"
      [class.bg-ember/10]="netBalance() < 0"
      [class.border-ink/30]="netBalance() === 0"
      [class.bg-ink/5]="netBalance() === 0"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-[11px] uppercase font-bold tracking-[0.12em] text-ember-ink">
            Stavi balance
          </p>
          <!-- Not blurred: only the kiosk login sees this, and it is their own balance -->
          <p class="mt-1 text-sm font-semibold text-ink">
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
          class="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
          [class.border-avocado/30]="netBalance() > 0"
          [class.bg-avocado/10]="netBalance() > 0"
          [class.text-avocado-ink]="netBalance() > 0"
          [class.border-ember/30]="netBalance() < 0"
          [class.bg-ember/10]="netBalance() < 0"
          [class.text-ember-soft]="netBalance() < 0"
          [class.border-ink/30]="netBalance() === 0"
          [class.bg-ink/5]="netBalance() === 0"
          [class.text-ink]="netBalance() === 0"
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
