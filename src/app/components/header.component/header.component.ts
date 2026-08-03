import { Component, inject, signal } from '@angular/core';
import { PrivacyService } from '../../services/privacy.service';
import { SettingsModalComponent } from '../settings-modal.component/settings-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  host: { class: 'block' },
  imports: [SettingsModalComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly privacyService = inject(PrivacyService);
  readonly showSettingsModal = signal<boolean>(false);
}
