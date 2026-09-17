import { Component, input } from '@angular/core';

@Component({
  selector: 'app-settings-modal-footer',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="pt-1 text-[10px] uppercase tracking-[0.18em] text-gray-500 text-left">
      v{{ version() }}
    </div>
  `,
})
export class SettingsModalFooterComponent {
  readonly version = input.required<string>();
}
