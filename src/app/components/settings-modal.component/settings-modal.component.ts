import { CommonModule } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrivacyService } from '../../services/privacy.service';

type PinAction = 'none' | 'set' | 'remove' | 'unlock-to-disable';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-modal.component.html',
})
export class SettingsModalComponent {
  readonly privacyService = inject(PrivacyService);
  readonly close = output<void>();

  readonly activeAction = signal<PinAction>('none');
  readonly pinInput = signal<string>('');
  readonly currentPinInput = signal<string>('');
  readonly feedbackMessage = signal<{ type: 'error' | 'success'; text: string } | null>(null);

  async handleToggleStealth(): Promise<void> {
    this.clearFeedback();
    if (!this.privacyService.isPrivacyMode()) {
      this.privacyService.enablePrivacyMode();
    } else {
      if (this.privacyService.hasPassword()) {
        this.activeAction.set('unlock-to-disable');
        this.pinInput.set('');
      } else {
        this.privacyService.unlock('');
      }
    }
  }

  async handleSetPin(): Promise<void> {
    const pin = this.pinInput().trim();
    if (!pin) {
      this.setFeedback('error', 'Please enter a valid PIN.');
      return;
    }

    await this.privacyService.setPassword(pin);
    this.setFeedback('success', 'PIN set successfully.');
    this.resetForm();
  }

  async handleRemovePin(): Promise<void> {
    const currentPin = this.currentPinInput().trim();
    if (!currentPin) {
      this.setFeedback('error', 'Please enter your current PIN.');
      return;
    }

    const success = await this.privacyService.removePassword(currentPin);
    if (success) {
      this.setFeedback('success', 'PIN removed successfully.');
      this.resetForm();
    } else {
      this.setFeedback('error', 'Incorrect PIN. Please try again.');
    }
  }

  async handleUnlockDisable(): Promise<void> {
    const pin = this.pinInput().trim();
    const success = await this.privacyService.unlock(pin);

    if (success) {
      this.resetForm();
    } else {
      this.setFeedback('error', 'Incorrect PIN. Please try again.');
    }
  }

  resetForm(): void {
    this.activeAction.set('none');
    this.pinInput.set('');
    this.currentPinInput.set('');
  }

  clearFeedback(): void {
    this.feedbackMessage.set(null);
  }

  setFeedback(type: 'error' | 'success', text: string): void {
    this.feedbackMessage.set({ type, text });
  }
}
