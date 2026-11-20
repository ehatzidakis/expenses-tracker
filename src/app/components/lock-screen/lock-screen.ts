import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { AppLockService } from '../../services/app-lock.service';
import { AuthService } from '../../services/auth.service';
import { BUTTON_PRIMARY } from '../../utils/pill-styles';

/**
 * Covers the app until Face ID goes through, and blanks it while it is in the background.
 * Render it inside an @if. It is a modal dialog so it sits above any sheet that was open and
 * makes the page behind it unreachable.
 */
@Component({
  selector: 'app-lock-screen',
  standalone: true,
  styles: `
    dialog::backdrop {
      background: var(--color-ground);
    }
  `,
  template: `
    <dialog
      #dialog
      class="m-0 h-dvh max-h-none w-full max-w-none bg-ground p-0 text-ink outline-none"
      [attr.aria-label]="locked() ? 'App locked' : null"
      (cancel)="$event.preventDefault()"
    >
      <div
        class="mx-auto flex h-full w-full max-w-sm flex-col px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)]"
      >
        <div class="flex flex-1 flex-col items-center justify-center text-center">
          <img src="assets/favicon.svg" alt="" class="size-12" />

          @if (locked()) {
            <h1 class="type-wide mt-6 text-[22px] font-semibold text-ink">Expenses is locked</h1>
            <p class="mt-2 text-[14px] text-ink-2">Use Face ID to open it.</p>

            <button
              type="button"
              [class]="primary + ' mt-8 flex w-full items-center justify-center gap-2'"
              [disabled]="lock.busy()"
              (click)="tryUnlock(false)"
            >
              <svg
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path
                  d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2"
                />
                <path d="M9 9.5v1M15 9.5v1M12 9.5v3.5h-1M9.5 15.5a3.5 3.5 0 005 0" />
              </svg>
              {{ lock.busy() ? 'Checking…' : 'Unlock with Face ID' }}
            </button>

            <p class="mt-3 min-h-5 text-[13px] text-cherry" role="alert">{{ error() }}</p>
          }
        </div>

        @if (locked()) {
          <button
            type="button"
            class="mx-auto min-h-11 px-4 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink cursor-pointer"
            (click)="signOut()"
          >
            Sign out instead
          </button>
        }
      </div>
    </dialog>
  `,
})
export class LockScreenComponent {
  protected readonly lock = inject(AppLockService);
  private readonly auth = inject(AuthService);
  protected readonly primary = BUTTON_PRIMARY;

  protected readonly locked = computed(() => this.lock.locked());
  protected readonly error = signal('');

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterNextRender(() => {
      const dialog = this.dialog().nativeElement;
      // jsdom (tests) has no showModal.
      if (!dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
    });

    // Ask straight away when the app opens or comes back. iOS may want a tap first; the
    // button is there for that, so a refused first try shows no error.
    effect(() => {
      if (this.lock.locked() && !this.lock.covered()) untracked(() => this.tryUnlock(true));
    });
  }

  async tryUnlock(automatic: boolean): Promise<void> {
    if (document.visibilityState !== 'visible') return;
    this.error.set('');
    const ok = await this.lock.unlock();
    if (!ok && !automatic) this.error.set("Face ID didn't go through. Try again.");
  }

  async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      this.error.set('Unable to sign out right now.');
    }
  }
}
