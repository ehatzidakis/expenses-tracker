import { Component, input } from '@angular/core';

export interface SettingsFeedbackMessage {
  type: 'error' | 'success';
  text: string;
}

@Component({
  selector: 'app-settings-feedback-banner',
  standalone: true,
  host: { class: 'block' },
  template: `
    @if (message(); as feedback) {
      <div
        class="p-3 rounded-xl text-xs font-medium text-center"
        [class]="
          feedback.type === 'error'
            ? 'bg-red-950/50 border border-red-800/60 text-red-300'
            : 'bg-emerald-950/50 border border-emerald-800/60 text-emerald-300'
        "
      >
        {{ feedback.text }}
      </div>
    }
  `,
})
export class SettingsFeedbackBannerComponent {
  readonly message = input<SettingsFeedbackMessage | null>(null);
}
