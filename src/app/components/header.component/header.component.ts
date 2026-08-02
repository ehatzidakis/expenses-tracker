import { Component, inject, signal } from '@angular/core';
import { PrivacyService } from '../../services/privacy.service';
import { UnlockStealthModalComponent } from '../unlock-stealth-modal/unlock-stealth-modal';

@Component({
  selector: 'app-header',
  standalone: true,
  host: { class: 'block' },
  imports: [UnlockStealthModalComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly privacyService = inject(PrivacyService);

  readonly showUnlockModal = signal(false);

  handlePrivacyToggle(): void {
    if (this.privacyService.isPrivacyMode()) {
      // Trying to step OUT of stealth mode
      if (this.privacyService.hasPassword()) {
        this.showUnlockModal.set(true);
      } else {
        // Direct unlock if no password configured
        this.privacyService.unlock('');
      }
    } else {
      // Instantly enter stealth mode
      this.privacyService.enablePrivacyMode();
    }
  }
}
