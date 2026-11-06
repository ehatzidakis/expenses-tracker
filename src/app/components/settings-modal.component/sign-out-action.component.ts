import { Component, output } from '@angular/core';
import { BUTTON_DANGER } from '../../utils/pill-styles';

@Component({
  selector: 'app-sign-out-action',
  standalone: true,
  host: { class: 'block mt-3' },
  template: `
    <button type="button" [class]="danger + ' w-full'" (click)="signOut.emit()">Sign out</button>
  `,
})
export class SignOutActionComponent {
  protected readonly danger = BUTTON_DANGER;

  readonly signOut = output<void>();
}
