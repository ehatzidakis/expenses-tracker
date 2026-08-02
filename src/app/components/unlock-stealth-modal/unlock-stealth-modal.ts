import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { inject, output, signal } from '@angular/core';
import { PrivacyService } from '../../services/privacy.service';

@Component({
  selector: 'app-unlock-stealth-modal',
  imports: [],
  templateUrl: './unlock-stealth-modal.html',
})
export class UnlockStealthModalComponent {
  private privacyService = inject(PrivacyService);

  readonly unlocked = output<void>();
  readonly cancelled = output<void>();

  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  async onUnlock(event: Event): Promise<void> {
    event.preventDefault();
    const formEl = event.target as HTMLFormElement;
    const inputEl = formEl.querySelector('input') as HTMLInputElement;
    const password = inputEl.value.trim();

    if (!password) {
      this.errorMessage.set('Please enter your passcode');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const success = await this.privacyService.unlock(password);

    if (success) {
      this.unlocked.emit();
    } else {
      this.errorMessage.set('Incorrect passcode');
      this.isSubmitting.set(false);
      inputEl.select();
    }
  }
}
