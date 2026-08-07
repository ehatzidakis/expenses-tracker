import { Component, inject, signal } from '@angular/core';
import { PrivacyService } from '../../services/privacy.service';
import { SettingsModalComponent } from '../settings-modal.component/settings-modal.component';
import { SplitzesModalComponent } from '../splitzes-modal.component/splitzes-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  host: { class: 'block' },
  imports: [SettingsModalComponent, SplitzesModalComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly privacyService = inject(PrivacyService);
  readonly showSettingsModal = signal<boolean>(false);
  readonly showSplitzesModal = signal<boolean>(false);
}
