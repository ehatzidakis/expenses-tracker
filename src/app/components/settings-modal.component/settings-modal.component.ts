import {
  Component,
  ElementRef,
  afterNextRender,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { APP_VERSION } from '../../../environments/version';
import { AuthService } from '../../services/auth.service';
import { PrivacyService } from '../../services/privacy.service';
import { PinEntryFormComponent } from './pin-entry-form.component';
import {
  SettingsFeedbackBannerComponent,
  type SettingsFeedbackMessage,
} from './settings-feedback-banner.component';
import { SettingsModalFooterComponent } from './settings-modal-footer.component';
import { SignOutActionComponent } from './sign-out-action.component';
import { StealthModeSettingComponent } from './stealth-mode-setting.component';
import { StealthPasscodeSettingComponent } from './stealth-passcode-setting.component';
import { DataExportSettingComponent } from './data-export-setting.component';
import { NotificationSettingComponent } from './notification-setting.component';
import { CategoryBudgetsGrid } from '../category-budgets-grid/category-budgets-grid';

type PinAction = 'none' | 'set' | 'remove' | 'unlock-to-disable';

/** The Settings tab. Budgets and wage open as a sub-view with Back. */
@Component({
  selector: 'app-settings-page',
  standalone: true,
  host: { class: 'block' },
  imports: [
    CategoryBudgetsGrid,
    PinEntryFormComponent,
    SettingsFeedbackBannerComponent,
    SettingsModalFooterComponent,
    SignOutActionComponent,
    StealthModeSettingComponent,
    StealthPasscodeSettingComponent,
    DataExportSettingComponent,
    NotificationSettingComponent,
  ],
  template: `
    <section [attr.aria-label]="view() === 'budgets' ? 'Budgets and wage' : 'Settings'">
      @if (view() === 'budgets') {
        <div class="flex min-h-11 items-center gap-2 pt-1.5">
          <button
            #backButton
            type="button"
            class="-ml-2 flex min-h-11 items-center gap-1 rounded-xl px-2 text-[14px] text-ink-2 transition-colors hover:text-ink cursor-pointer"
            (click)="showMain()"
          >
            <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" />
            </svg>
            Back
          </button>
          <h1 class="type-wide ml-1 text-[18px] font-semibold text-ink">Budgets and wage</h1>
        </div>
        <div class="mt-4">
          <app-category-budgets-grid />
        </div>
      } @else {
        <h1 class="type-wide text-[18px] font-semibold text-ink">Settings</h1>

        <div class="mt-3 flex flex-col gap-4">
          <app-settings-feedback-banner [message]="feedbackMessage()" />

          <div class="divide-y divide-ink/10 border-y border-ink/10">
            <app-stealth-mode-setting
              [enabled]="privacyService.isPrivacyMode()"
              (toggle)="handleToggleStealth()"
            />

            @if (activeAction() === 'unlock-to-disable') {
              <app-pin-entry-form
                title="Passcode to turn stealth off"
                placeholder="PIN"
                submitLabel="Turn off"
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
                title="New passcode"
                placeholder="For example 1234"
                submitLabel="Save PIN"
                (valueChange)="pinInput.set($event)"
                (cancel)="resetForm()"
                (submitted)="handleSetPin()"
              />
            }

            @if (activeAction() === 'remove') {
              <app-pin-entry-form
                title="Current passcode"
                placeholder="Current PIN"
                submitLabel="Remove PIN"
                tone="danger"
                (valueChange)="currentPinInput.set($event)"
                (cancel)="resetForm()"
                (submitted)="handleRemovePin()"
              />
            }

            @if (authService.isAdmin()) {
              <button
                #budgetsRow
                type="button"
                class="flex min-h-14 w-full items-center justify-between gap-4 py-2.5 text-left cursor-pointer"
                (click)="showBudgets()"
              >
                <span class="min-w-0">
                  <span class="block text-[15px] font-medium text-ink">Budgets and wage</span>
                  <span class="mt-0.5 block text-[12px] text-ink-2">
                    Your wage and each category's monthly budget
                  </span>
                </span>
                <svg class="size-4 shrink-0 text-ink-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" />
                </svg>
              </button>

              <app-notification-setting />
            }
          </div>

          <app-data-export-setting />

          <app-sign-out-action (signOut)="handleSignOut()" />

          <app-settings-modal-footer [version]="appVersion" />
        </div>
      }
    </section>
  `,
})
export class SettingsPageComponent {
  readonly privacyService = inject(PrivacyService);
  readonly authService = inject(AuthService);
  readonly appVersion = APP_VERSION;

  readonly activeAction = signal<PinAction>('none');
  /** Budgets opens in place, with Back to return. */
  readonly view = signal<'main' | 'budgets'>('main');
  private readonly injector = inject(Injector);
  private readonly backButton = viewChild<ElementRef<HTMLButtonElement>>('backButton');
  private readonly budgetsRow = viewChild<ElementRef<HTMLButtonElement>>('budgetsRow');

  showBudgets(): void {
    this.view.set('budgets');
    this.afterSwap(() => this.backButton()?.nativeElement.focus());
  }

  showMain(): void {
    this.view.set('main');
    this.afterSwap(() => this.budgetsRow()?.nativeElement.focus());
  }

  /** New view starts at the top, and focus lands where the person just was. */
  private afterSwap(focus: () => void): void {
    afterNextRender(
      () => {
        window.scrollTo({ top: 0 });
        focus();
      },
      { injector: this.injector },
    );
  }
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
