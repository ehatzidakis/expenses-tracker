import { Component, computed, input, output } from '@angular/core';
import { PersonSummary } from '../../models/splitz.model';
import { SensitiveDirective } from '../../utils/sensitive.directive';
import { BUTTON_SECONDARY } from '../../utils/pill-styles';

@Component({
  selector: 'app-splitz-person-card',
  standalone: true,
  imports: [SensitiveDirective],
  host: { class: 'block' },
  template: `
    <div class="py-3">
      <div class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-full border border-edge bg-raised text-[12px] font-semibold text-ink-2"
            aria-hidden="true"
          >
            {{ initials() }}
          </span>
          <p class="truncate text-[15px] font-medium text-ink">{{ summary().person.name }}</p>
        </div>

        <span class="shrink-0 text-[13px] tabular-nums" [class]="balanceTone()" appSensitive="xs">
          {{ balanceLabel() }}
        </span>
      </div>

      @if (summary().peerDebts.length > 0) {
        <ul class="ml-12 mt-1.5 space-y-1">
          @for (peer of summary().peerDebts; track peer.creditor.id) {
            <li class="flex items-center justify-between text-[12px]">
              <span class="text-ink-3">Owes {{ peer.creditor.name }}</span>
              <span class="text-ink-2 tabular-nums" appSensitive="xs">€{{ peer.netOwed.toFixed(2) }}</span>
            </li>
          }
        </ul>
      }

      @if (net() !== 0) {
        <div class="ml-12 mt-2">
          <button type="button" [class]="secondary" [disabled]="disabled()" (click)="settle.emit()">
            {{ busy() ? 'Settling…' : 'Settle up' }}
          </button>
        </div>
      }
    </div>
  `,
})
export class SplitzPersonCardComponent {
  protected readonly secondary = BUTTON_SECONDARY;

  readonly summary = input.required<PersonSummary>();
  readonly busy = input(false);
  readonly disabled = input(false);
  readonly settle = output<void>();

  readonly net = computed(() => this.summary().netWithMe);
  readonly initials = computed(() => this.summary().person.name.slice(0, 2).toUpperCase());
  /** Money owed to me is avocado; money I owe stays neutral cream; nothing owed is quiet. */
  readonly balanceTone = computed(() => {
    const net = this.net();
    if (net === 0) return 'text-ink-3';
    return net > 0 ? 'font-medium text-avocado-ink' : 'font-medium text-ink';
  });
  readonly balanceLabel = computed(() => {
    const net = this.net();
    if (net === 0) return 'Settled';
    return net > 0 ? `Owes me €${net.toFixed(2)}` : `I owe €${Math.abs(net).toFixed(2)}`;
  });
}
