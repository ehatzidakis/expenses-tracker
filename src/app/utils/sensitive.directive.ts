import { Directive, computed, inject, input } from '@angular/core';
import { PrivacyService } from '../services/privacy.service';

type BlurLevel = 'xs' | 'sm' | 'md';

/**
 * Blurs the element while privacy mode is on. Put it on anything that shows a money amount.
 * Optional strength: `appSensitive` (md, default), `appSensitive="sm"`, `appSensitive="xs"`.
 */
@Directive({
  selector: '[appSensitive]',
  standalone: true,
  host: {
    '[class.blur-xs]': "privacy.isPrivacyMode() && blur() === 'xs'",
    '[class.blur-sm]': "privacy.isPrivacyMode() && blur() === 'sm'",
    '[class.blur-md]': "privacy.isPrivacyMode() && blur() === 'md'",
    '[class.select-none]': 'privacy.isPrivacyMode()',
  },
})
export class SensitiveDirective {
  protected readonly privacy = inject(PrivacyService);

  readonly level = input<'' | BlurLevel>('', { alias: 'appSensitive' });
  protected readonly blur = computed<BlurLevel>(() => this.level() || 'md');
}
