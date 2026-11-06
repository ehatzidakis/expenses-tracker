import { Component, computed, inject, signal, input } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { SwitchComponent } from '../switch/switch';
import { BUTTON_SECONDARY } from '../../utils/pill-styles';

@Component({
  selector: 'app-notification-setting',
  standalone: true,
  imports: [SwitchComponent],
  host: { class: 'block' },
  template: `
    <div class="py-1">
      @if (canToggle()) {
        <app-switch
          [label]="label()"
          [caption]="subtitle()"
          [checked]="isOn()"
          [disabled]="busy()"
          (toggled)="toggle()"
        />
      } @else {
        <div class="min-h-14 py-2.5">
          <span class="block text-[15px] font-medium text-ink">{{ label() }}</span>
          <span class="mt-0.5 block text-[12px] text-ink-2">{{ subtitle() }}</span>
        </div>
      }

      @switch (push.status()) {
        @case ('needs-install') {
          <p class="pb-3 text-[12px] font-semibold text-ember-ink">
            Add the app to your Home Screen and open it from there to turn these on.
          </p>
        }
        @case ('unsupported') {
          <p class="pb-3 text-[12px] text-ink-3">Not available here. Use the installed app.</p>
        }
        @case ('blocked') {
          <p class="pb-3 text-[12px] font-semibold text-ember-ink">
            Blocked. Allow them in your phone's Settings → Notifications → expenses.
          </p>
        }
        @case ('on') {
          <div class="pb-3">
            <button type="button" [class]="secondary" [disabled]="busy()" (click)="sendTest()">
              Send test notification
            </button>
          </div>
        }
      }

      @if (message(); as message) {
        <p
          class="pb-3 text-[12px]"
          [class]="error() ? 'text-cherry' : 'text-avocado-ink'"
          [attr.role]="error() ? 'alert' : 'status'"
        >
          {{ message }}
        </p>
      }
    </div>
  `,
})
export class NotificationSettingComponent {
  /** The row's name; the kiosk sheet is already titled Notifications. */
  readonly label = input('Notifications');
  protected readonly secondary = BUTTON_SECONDARY;

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
