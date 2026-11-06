import { Component, input } from '@angular/core';
import { ERROR_WELL, SUCCESS_WELL } from '../../utils/pill-styles';

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
      @if (feedback.type === 'error') {
        <p role="alert" [class]="errorWell">{{ feedback.text }}</p>
      } @else {
        <p role="status" [class]="successWell">{{ feedback.text }}</p>
      }
    }
  `,
})
export class SettingsFeedbackBannerComponent {
  protected readonly errorWell = ERROR_WELL;
  protected readonly successWell = SUCCESS_WELL;

  readonly message = input<SettingsFeedbackMessage | null>(null);
}
