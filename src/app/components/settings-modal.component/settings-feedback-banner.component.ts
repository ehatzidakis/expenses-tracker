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
            ? 'bg-cherry-deep/50 border border-cherry-deep/60 text-cherry'
            : 'bg-avocado-deep/50 border border-avocado-deep/60 text-avocado-ink'
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
