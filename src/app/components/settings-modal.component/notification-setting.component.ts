import { Component, computed, inject, signal } from '@angular/core';
import { PushNotificationService } from '../../services/push-notification.service';

@Component({
  selector: 'app-notification-setting',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="space-y-2 bg-gray-800/40 p-3.5 rounded-2xl border border-gray-800/80">
      <div class="flex items-center justify-between gap-3">
        <div class="space-y-0.5">
          <span class="text-sm font-medium text-gray-200 block">Notifications</span>
          <span class="text-[11px] text-gray-400 block">
            When the kiosk adds a pending transaction
          </span>
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
            [class]="isOn() ? 'bg-indigo-600' : 'bg-gray-700'"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              [class]="isOn() ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        }
      </div>

      @switch (push.status()) {
        @case ('needs-install') {
          <p class="text-[11px] text-amber-300">
            Add the app to your Home Screen and open it from there to turn these on.
          </p>
        }
        @case ('unsupported') {
          <p class="text-[11px] text-gray-500">Not available here. Use the installed app.</p>
        }
        @case ('blocked') {
          <p class="text-[11px] text-amber-300">
            Blocked. Allow them in your phone's Settings → Notifications → expenses.
          </p>
        }
        @case ('on') {
          <button
            type="button"
            [disabled]="busy()"
            (click)="sendTest()"
            class="rounded-xl border border-gray-700 bg-gray-800/70 px-3 py-1.5 text-xs text-gray-200 transition hover:bg-gray-700 disabled:opacity-50"
          >
            Send test notification
          </button>
        }
      }

      @if (message(); as message) {
        <p class="text-[11px]" [class.text-emerald-300]="!error()" [class.text-red-300]="error()">
          {{ message }}
        </p>
      }
    </div>
  `,
})
export class NotificationSettingComponent {
  readonly push = inject(PushNotificationService);

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
