import { Directive, inject } from '@angular/core';
import { PrivacyService } from '../services/privacy.service';

/** Blurs the element while privacy mode is on. Put it on anything that shows a money amount. */
@Directive({
  selector: '[appSensitive]',
  standalone: true,
  host: {
    '[class.blur-md]': 'privacy.isPrivacyMode()',
    '[class.select-none]': 'privacy.isPrivacyMode()',
  },
})
export class SensitiveDirective {
  protected readonly privacy = inject(PrivacyService);
}
