import { Component, input, output } from '@angular/core';
import { BUTTON_DANGER_SM, BUTTON_SECONDARY } from '../../utils/pill-styles';

@Component({
  selector: 'app-stealth-passcode-setting',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="flex min-h-14 items-center justify-between gap-4 py-2.5">
      <span class="min-w-0">
        <span class="block text-[15px] font-medium text-ink">Stealth passcode</span>
        <span class="mt-0.5 block text-[12px] text-ink-2">
          {{ hasPassword() ? 'A PIN is needed to turn stealth off' : 'No PIN set' }}
        </span>
      </span>
      @if (hasPassword()) {
        <button type="button" [class]="dangerSm + ' shrink-0'" (click)="remove.emit()">
          Remove PIN
        </button>
      } @else {
        <button type="button" [class]="secondary + ' shrink-0'" (click)="set.emit()">Set PIN</button>
      }
    </div>
  `,
})
export class StealthPasscodeSettingComponent {
  protected readonly secondary = BUTTON_SECONDARY;
  protected readonly dangerSm = BUTTON_DANGER_SM;

  readonly hasPassword = input(false);
  readonly set = output<void>();
  readonly remove = output<void>();
}
