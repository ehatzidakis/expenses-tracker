import { Component, input } from '@angular/core';

@Component({
  selector: 'app-settings-modal-footer',
  standalone: true,
  host: { class: 'block' },
  template: `
    <p class="text-center text-[12px] text-ink-3">Version {{ version() }}</p>
  `,
})
export class SettingsModalFooterComponent {
  readonly version = input.required<string>();
}
