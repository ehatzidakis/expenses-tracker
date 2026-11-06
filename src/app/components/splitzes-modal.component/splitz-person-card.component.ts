import { Component, computed, input, output } from '@angular/core';
import { PersonSummary } from '../../models/splitz.model';
import { SensitiveDirective } from '../../utils/sensitive.directive';

const AVATAR_CLASSES: Record<number, string> = {
  1: 'bg-ember/20 border-ember/30 text-ember-ink',
  2: 'bg-ember/20 border-ember/30 text-ember-soft',
  3: 'bg-ember/20 border-ember/30 text-ember-ink',
};
const DEFAULT_AVATAR = 'bg-edge/40 border-ink-4/40 text-ink-2';

@Component({
  selector: 'app-splitz-person-card',
  standalone: true,
  imports: [SensitiveDirective],
  host: { class: 'block' },
  template: `
    <article class="rounded-xl border border-raised/80 bg-ground/30 px-3 py-3 space-y-2">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-9 h-9 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold"
            [class]="avatarClass()"
          >
            {{ initials() }}
          </div>
          <p class="truncate text-sm font-semibold text-ink">{{ summary().person.name }}</p>
        </div>

        <span
          class="shrink-0 px-3 py-1 rounded-full text-xs font-semibold tabular-nums"
          [class.bg-avocado/15]="net() > 0"
          [class.text-avocado-ink]="net() > 0"
          [class.bg-ember/15]="net() < 0"
          [class.text-ember-soft]="net() < 0"
          [class.bg-edge/60]="net() === 0"
          [class.text-ink-2]="net() === 0"
          appSensitive
        >
          {{ balanceLabel() }}
        </span>
      </div>

      @if (summary().peerDebts.length > 0) {
        <div class="ml-12 space-y-1">
          @for (peer of summary().peerDebts; track peer.creditor.id) {
            <div class="flex items-center justify-between text-xs">
              <span class="text-ink-3">Owes {{ peer.creditor.name }}</span>
              <span class="font-medium text-ember-soft tabular-nums" appSensitive>
                €{{ peer.netOwed.toFixed(2) }}
              </span>
            </div>
          }
        </div>
      }

      @if (net() !== 0) {
        <div class="ml-12 pt-1">
          <button
            type="button"
            (click)="settle.emit()"
            [disabled]="disabled()"
            class="text-xs px-3 py-1.5 rounded-full bg-avocado/15 text-avocado-ink border border-avocado/30 hover:bg-avocado/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {{ busy() ? 'Settling…' : '✓ Settle up' }}
          </button>
        </div>
      }
    </article>
  `,
})
export class SplitzPersonCardComponent {
  readonly summary = input.required<PersonSummary>();
  readonly busy = input(false);
  readonly disabled = input(false);
  readonly settle = output<void>();

  readonly net = computed(() => this.summary().netWithMe);
  readonly initials = computed(() => this.summary().person.name.slice(0, 2).toUpperCase());
  readonly avatarClass = computed(() => AVATAR_CLASSES[this.summary().person.id] ?? DEFAULT_AVATAR);
  readonly balanceLabel = computed(() => {
    const net = this.net();
    if (net === 0) return 'Settled';
    return net > 0 ? `Owes me €${net.toFixed(2)}` : `I owe €${Math.abs(net).toFixed(2)}`;
  });
}
