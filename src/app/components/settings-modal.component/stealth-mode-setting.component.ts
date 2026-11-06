import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-stealth-mode-setting',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div
      class="flex items-center justify-between bg-raised/40 p-3.5 rounded-2xl border border-raised/80"
    >
      <div class="space-y-0.5">
        <span class="text-sm font-medium text-ink block">Stealth Mode</span>
        <span class="text-[11px] text-ink-2 block">Hide monetary values on screen</span>
      </div>

      <button
        type="button"
        (click)="toggle.emit()"
        class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
        [class]="enabled() ? 'bg-ember' : 'bg-edge'"
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-ink shadow ring-0 transition duration-200 ease-in-out"
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
