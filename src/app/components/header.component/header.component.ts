import { Component, inject } from '@angular/core';
import { PrivacyService } from '../../services/privacy.service';

@Component({
  selector: 'app-header',
  standalone: true,
  host: { class: 'block' },
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly privacyService = inject(PrivacyService);

  toggleStealthMode(): void {
    this.privacyService.toggle();
  }
}
