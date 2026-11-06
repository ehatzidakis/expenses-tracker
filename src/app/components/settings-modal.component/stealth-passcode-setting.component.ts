import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-stealth-passcode-setting',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="space-y-3">
      <span class="text-xs font-semibold text-ink-2 uppercase tracking-wider block px-1"
        >Security</span
      >

      <div
        class="flex items-center justify-between bg-raised/40 p-3.5 rounded-2xl border border-raised/80"
      >
        <div>
          <span class="text-sm font-medium text-ink block">Stealth Passcode</span>
          <span class="text-[11px] text-ink-2 block">
            {{ hasPassword() ? 'Protected with PIN' : 'No PIN set' }}
          </span>
        </div>

        @if (hasPassword()) {
          <button
            type="button"
            (click)="remove.emit()"
            class="px-3 py-1.5 text-xs font-semibold text-cherry bg-cherry-fill/10 hover:bg-cherry-fill/20 border border-cherry-fill/20 rounded-xl transition-all cursor-pointer"
          >
            Remove
          </button>
        } @else {
          <button
            type="button"
            (click)="set.emit()"
            class="px-3 py-1.5 text-xs font-semibold text-ember-ink bg-ember/10 hover:bg-ember/20 border border-ember/20 rounded-xl transition-all cursor-pointer"
          >
            Set PIN
          </button>
        }
      </div>
    </div>
  `,
})
export class StealthPasscodeSettingComponent {
  readonly hasPassword = input(false);
  readonly set = output<void>();
  readonly remove = output<void>();
}
