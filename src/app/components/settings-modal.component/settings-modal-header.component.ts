import { Component, output } from '@angular/core';

@Component({
  selector: 'app-settings-modal-header',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between pb-3 border-b border-raised">
      <div class="flex items-center gap-2">
        <span class="text-lg">⚙️</span>
        <h2 class="text-base font-semibold">Settings</h2>
      </div>
      <button
        type="button"
        (click)="close.emit()"
        class="h-8 w-8 rounded-full bg-raised hover:bg-edge text-ink-2 hover:text-ink flex items-center justify-center text-sm cursor-pointer transition-colors"
      >
        ✕
      </button>
    </div>
  `,
})
export class SettingsModalHeaderComponent {
  readonly close = output<void>();
}
