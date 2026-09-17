import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-stealth-mode-setting',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div
      class="flex items-center justify-between bg-gray-800/40 p-3.5 rounded-2xl border border-gray-800/80"
    >
      <div class="space-y-0.5">
        <span class="text-sm font-medium text-gray-200 block">Stealth Mode</span>
        <span class="text-[11px] text-gray-400 block">Hide monetary values on screen</span>
      </div>

      <button
        type="button"
        (click)="toggle.emit()"
        class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
        [class]="enabled() ? 'bg-indigo-600' : 'bg-gray-700'"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          [class]="enabled() ? 'translate-x-5' : 'translate-x-0'"
        ></span>
      </button>
    </div>
  `,
})
export class StealthModeSettingComponent {
  readonly enabled = input(false);
  readonly toggle = output<void>();
}
