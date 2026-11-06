import { Component, input } from '@angular/core';

@Component({
  selector: 'app-settings-modal-footer',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="pt-1 text-[11px] uppercase tracking-[0.18em] text-ink-3 text-left">
      v{{ version() }}
    </div>
  `,
})
export class SettingsModalFooterComponent {
  readonly version = input.required<string>();
}
