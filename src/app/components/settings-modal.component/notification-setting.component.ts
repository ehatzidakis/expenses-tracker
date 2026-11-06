import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { PushNotificationService } from '../../services/push-notification.service';

@Component({
  selector: 'app-notification-setting',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="space-y-2 bg-raised/40 p-3.5 rounded-2xl border border-raised/80">
      <div class="flex items-center justify-between gap-3">
        <div class="space-y-0.5">
          <span class="text-sm font-medium text-ink block">Notifications</span>
          <span class="text-[11px] text-ink-2 block">{{ subtitle() }}</span>
        </div>

        @if (canToggle()) {
          <button
            type="button"
            role="switch"
            aria-label="Notifications"
            [attr.aria-checked]="isOn()"
            [disabled]="busy()"
            (click)="toggle()"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50"
            [class]="isOn() ? 'bg-ember' : 'bg-edge'"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-ink shadow ring-0 transition duration-200 ease-in-out"
              [class]="isOn() ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        }
      </div>

      @switch (push.status()) {
        @case ('needs-install') {
          <p class="text-[11px] text-ember-soft">
            Add the app to your Home Screen and open it from there to turn these on.
          </p>
        }
        @case ('unsupported') {
          <p class="text-[11px] text-ink-3">Not available here. Use the installed app.</p>
        }
        @case ('blocked') {
          <p class="text-[11px] text-ember-soft">
            Blocked. Allow them in your phone's Settings → Notifications → expenses.
          </p>
        }
        @case ('on') {
          <button
            type="button"
            [disabled]="busy()"
            (click)="sendTest()"
            class="rounded-xl border border-edge bg-raised/70 px-3 py-1.5 text-xs text-ink transition hover:bg-edge disabled:opacity-50"
          >
            Send test notification
          </button>
        }
      }

      @if (message(); as message) {
        <p class="text-[11px]" [class.text-avocado-ink]="!error()" [class.text-cherry]="error()">
          {{ message }}
        </p>
      }
    </div>
  `,
})
export class NotificationSettingComponent {
  readonly push = inject(PushNotificationService);
  private readonly isKiosk = inject(AuthService).isKiosk;

  readonly subtitle = computed(() =>
    this.isKiosk() ? 'When you get a new request' : 'When the kiosk adds a pending transaction',
  );

  readonly busy = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal(false);

  readonly isOn = computed(() => this.push.status() === 'on');
  readonly canToggle = computed(() => ['on', 'off'].includes(this.push.status()));

  toggle(): Promise<void> {
    // Call enable() synchronously from the tap so iOS shows the permission prompt.
    const turningOn = !this.isOn();
    const action = turningOn ? this.push.enable() : this.push.disable();
    return this.run(action, () =>
      turningOn ? 'Notifications are on.' : 'Notifications turned off.',
    );
  }

  sendTest(): Promise<void> {
    return this.run(this.push.sendTest(), (result) =>
      result.sent > 0
        ? 'Test sent. It should arrive in a few seconds.'
        : 'No phone received it. Try turning notifications off and on again.',
    );
  }

  private async run<T>(action: Promise<T>, successText: (result: T) => string): Promise<void> {
    this.busy.set(true);
    this.message.set(null);
    try {
      const result = await action;
      this.error.set(false);
      this.message.set(successText(result));
    } catch (error) {
      console.error('Notification setting failed:', error);
      this.error.set(true);
      this.message.set(
        this.push.status() === 'blocked'
          ? null
          : error instanceof Error
            ? error.message
            : 'Something went wrong.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
