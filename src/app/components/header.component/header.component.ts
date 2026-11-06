import { Component, inject, signal } from '@angular/core';
import { PrivacyService } from '../../services/privacy.service';
import { SettingsModalComponent } from '../settings-modal.component/settings-modal.component';
import { SplitzesModalComponent } from '../splitzes-modal.component/splitzes-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  host: { class: 'block' },
  imports: [SettingsModalComponent, SplitzesModalComponent],
  template: `
    <header class="flex min-h-14 items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <img src="assets/favicon.svg" alt="" class="size-7" />
        <h1 class="type-wide text-[17px] font-bold uppercase tracking-[0.02em] text-ink">Expenses</h1>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          (click)="showSplitzesModal.set(true)"
          class="flex min-h-11 items-center gap-1.5 rounded-xl border border-edge px-3.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-ink-4 hover:text-ink active:scale-[0.97] cursor-pointer"
        >
          <svg
            class="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
          </svg>
          Splitz
        </button>

        <div class="relative">
          <button
            type="button"
            (click)="showSettingsModal.set(true)"
            class="relative flex size-11 items-center justify-center rounded-full border text-[12px] font-bold transition-colors active:scale-95 cursor-pointer"
            [class]="
              privacyService.isPrivacyMode()
                ? 'border-ember bg-ember-deep text-ember-ink'
                : 'border-edge bg-raised text-ink-2 hover:text-ink'
            "
            [attr.aria-label]="
              privacyService.isPrivacyMode() ? 'Settings (stealth mode on)' : 'Settings'
            "
          >
            ME
            @if (privacyService.isPrivacyMode()) {
              <span
                class="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-ground bg-ember"
                aria-hidden="true"
              ></span>
            }
          </button>

          @if (showSettingsModal()) {
            <app-settings-modal (close)="showSettingsModal.set(false)" />
          }
        </div>
      </div>
    </header>

    @if (showSplitzesModal()) {
      <app-splitzes-modal (close)="showSplitzesModal.set(false)" />
    }
  `,
})
export class HeaderComponent {
  readonly privacyService = inject(PrivacyService);
  readonly showSettingsModal = signal<boolean>(false);
  readonly showSplitzesModal = signal<boolean>(false);
}
