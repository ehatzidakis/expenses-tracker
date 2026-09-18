import { Component, inject, output, signal } from '@angular/core';
import { APP_VERSION } from '../../../environments/version';
import { AuthService } from '../../services/auth.service';
import { PrivacyService } from '../../services/privacy.service';
import { PinEntryFormComponent } from './pin-entry-form.component';
import {
  SettingsFeedbackBannerComponent,
  type SettingsFeedbackMessage,
} from './settings-feedback-banner.component';
import { SettingsModalFooterComponent } from './settings-modal-footer.component';
import { SettingsModalHeaderComponent } from './settings-modal-header.component';
import { SignOutActionComponent } from './sign-out-action.component';
import { StealthModeSettingComponent } from './stealth-mode-setting.component';
import { StealthPasscodeSettingComponent } from './stealth-passcode-setting.component';

type PinAction = 'none' | 'set' | 'remove' | 'unlock-to-disable';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [
    PinEntryFormComponent,
    SettingsFeedbackBannerComponent,
    SettingsModalFooterComponent,
    SettingsModalHeaderComponent,
    SignOutActionComponent,
    StealthModeSettingComponent,
    StealthPasscodeSettingComponent,
  ],
  template: `
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      (click)="close.emit()"
    >
      <div
        class="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6 text-gray-100"
        (click)="$event.stopPropagation()"
      >
        <app-settings-modal-header (close)="close.emit()" />

        <app-settings-feedback-banner [message]="feedbackMessage()" />

        <app-stealth-mode-setting
          [enabled]="privacyService.isPrivacyMode()"
          (toggle)="handleToggleStealth()"
        />

        <!-- Inline Form: Unlock to Disable Stealth Mode -->
        @if (activeAction() === 'unlock-to-disable') {
          <app-pin-entry-form
            title="Enter Passcode to Exit Stealth"
            placeholder="••••"
            submitLabel="Confirm"
            [centerTitle]="true"
            [autofocus]="true"
            (valueChange)="pinInput.set($event)"
            (cancel)="resetForm()"
            (submitted)="handleUnlockDisable()"
          />
        }

        @if (activeAction() === 'none') {
          <app-stealth-passcode-setting
            [hasPassword]="privacyService.hasPassword()"
            (set)="activeAction.set('set'); clearFeedback()"
            (remove)="activeAction.set('remove'); clearFeedback()"
          />
        }

        @if (activeAction() === 'set') {
          <app-pin-entry-form
            title="Create New Passcode"
            placeholder="Enter PIN (e.g. 1234)"
            submitLabel="Save PIN"
            (valueChange)="pinInput.set($event)"
            (cancel)="resetForm()"
            (submitted)="handleSetPin()"
          />
        }

        @if (activeAction() === 'remove') {
          <app-pin-entry-form
            title="Confirm Current Passcode"
            placeholder="Current PIN"
            submitLabel="Remove PIN"
            variant="red"
            (valueChange)="currentPinInput.set($event)"
            (cancel)="resetForm()"
            (submitted)="handleRemovePin()"
          />
        }

        <app-sign-out-action (signOut)="handleSignOut()" />

        <app-settings-modal-footer [version]="appVersion" />
      </div>
    </div>
  `,
})
export class SettingsModalComponent {
  readonly privacyService = inject(PrivacyService);
  readonly authService = inject(AuthService);
  readonly close = output<void>();
  readonly appVersion = APP_VERSION;

  readonly activeAction = signal<PinAction>('none');
  readonly pinInput = signal<string>('');
  readonly currentPinInput = signal<string>('');
  readonly feedbackMessage = signal<SettingsFeedbackMessage | null>(null);

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

  async handleSignOut(): Promise<void> {
    try {
      await this.authService.signOut();
      this.close.emit();
    } catch (error) {
      console.error('Sign out failed:', error);
      this.setFeedback('error', 'Unable to sign out right now.');
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
