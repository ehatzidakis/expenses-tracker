import { Component, input, output } from '@angular/core';
import { SwitchComponent } from '../switch/switch';

@Component({
  selector: 'app-stealth-mode-setting',
  standalone: true,
  imports: [SwitchComponent],
  host: { class: 'block' },
  template: `
    <app-switch
      label="Stealth mode"
      caption="Hide amounts on screen"
      [checked]="enabled()"
      (toggled)="toggle.emit()"
    />
  `,
})
export class StealthModeSettingComponent {
  readonly enabled = input(false);
  readonly toggle = output<void>();
}
