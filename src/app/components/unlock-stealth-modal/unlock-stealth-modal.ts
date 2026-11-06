import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { inject, output, signal } from '@angular/core';
import { PrivacyService } from '../../services/privacy.service';

@Component({
  selector: 'app-unlock-stealth-modal',
  imports: [],
  template: ` <div
    class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
    (click)="cancelled.emit()"
  >
    <div
      class="bg-panel border border-raised rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4"
      (click)="$event.stopPropagation()"
    >
      <div class="space-y-1 text-center">
        <div
          class="h-10 w-10 rounded-full bg-ember/15 text-ember-ink mx-auto flex items-center justify-center text-lg font-bold"
        >
          🔒
        </div>
        <h3 class="text-base font-semibold text-ink">Unlock Stealth Mode</h3>
        <p class="text-xs text-ink-2">Enter your passcode to restore financial details.</p>
      </div>

      <form (submit)="onUnlock($event)" class="space-y-4">
        <div>
          <input
            #passInput
            type="password"
            placeholder="Enter passcode"
            autofocus
            class="w-full bg-raised/80 border border-edge rounded-xl px-3.5 py-2.5 text-sm text-center text-ink placeholder:text-ink-3 tracking-widest focus:outline-none focus:ring-2 focus:ring-ember/60"
          />
          @if (errorMessage()) {
            <span class="text-[11px] text-cherry block text-center mt-1.5">
              {{ errorMessage() }}
            </span>
          }
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            (click)="cancelled.emit()"
            class="py-2.5 rounded-xl text-xs font-medium text-ink-2 hover:text-ink bg-raised/50 hover:bg-raised transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="isSubmitting()"
            class="py-2.5 rounded-xl text-xs font-semibold text-ground bg-ember hover:bg-ember-ink disabled:opacity-50 transition-all shadow-md cursor-pointer"
          >
            {{ isSubmitting() ? 'Checking...' : 'Unlock' }}
          </button>
        </div>
      </form>
    </div>
  </div>`,
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
