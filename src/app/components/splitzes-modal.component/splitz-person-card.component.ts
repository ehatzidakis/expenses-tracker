import { Component, computed, input, output } from '@angular/core';
import { PersonSummary } from '../../models/splitz.model';

const AVATAR_CLASSES: Record<number, string> = {
  1: 'bg-teal-600/20 border-teal-500/30 text-teal-400',
  2: 'bg-amber-600/20 border-amber-500/30 text-amber-400',
  3: 'bg-violet-600/20 border-violet-500/30 text-violet-400',
};
const DEFAULT_AVATAR = 'bg-gray-700/40 border-gray-600/40 text-gray-300';

@Component({
  selector: 'app-splitz-person-card',
  standalone: true,
  host: { class: 'block' },
  template: `
    <article class="rounded-xl border border-gray-800/80 bg-gray-950/30 px-3 py-3 space-y-2">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-9 h-9 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold"
            [class]="avatarClass()"
          >
            {{ initials() }}
          </div>
          <p class="truncate text-sm font-semibold text-gray-100">{{ summary().person.name }}</p>
        </div>

        <span
          class="shrink-0 px-3 py-1 rounded-full text-xs font-semibold tabular-nums"
          [class.bg-emerald-500/15]="net() > 0"
          [class.text-emerald-400]="net() > 0"
          [class.bg-amber-500/15]="net() < 0"
          [class.text-amber-400]="net() < 0"
          [class.bg-gray-700/60]="net() === 0"
          [class.text-gray-400]="net() === 0"
        >
          {{ balanceLabel() }}
        </span>
      </div>

      @if (summary().peerDebts.length > 0) {
        <div class="ml-12 space-y-1">
          @for (peer of summary().peerDebts; track peer.creditor.id) {
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-500">Owes {{ peer.creditor.name }}</span>
              <span class="font-medium text-amber-400 tabular-nums">
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
            class="text-xs px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
