import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-stealth-passcode-setting',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="space-y-3">
      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block px-1"
        >Security</span
      >

      <div
        class="flex items-center justify-between bg-gray-800/40 p-3.5 rounded-2xl border border-gray-800/80"
      >
        <div>
          <span class="text-sm font-medium text-gray-200 block">Stealth Passcode</span>
          <span class="text-[11px] text-gray-400 block">
            {{ hasPassword() ? 'Protected with PIN' : 'No PIN set' }}
          </span>
        </div>

        @if (hasPassword()) {
          <button
            type="button"
            (click)="remove.emit()"
            class="px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all cursor-pointer"
          >
            Remove
          </button>
        } @else {
          <button
            type="button"
            (click)="set.emit()"
            class="px-3 py-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl transition-all cursor-pointer"
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
