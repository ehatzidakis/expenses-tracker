import { Component, computed, inject, signal } from '@angular/core';
import { AppLockService } from '../../services/app-lock.service';
import { AuthService } from '../../services/auth.service';
import { SwitchComponent } from '../switch/switch';

/** Admin only: ask for Face ID when the app opens or comes back after a minute away. */
@Component({
  selector: 'app-lock-setting',
  standalone: true,
  imports: [SwitchComponent],
  host: { class: 'block' },
  template: `
    <div class="py-1">
      <app-switch
        label="Require Face ID"
        [caption]="caption()"
        [checked]="lock.enabled()"
        [disabled]="lock.busy() || (!lock.supported() && !lock.enabled())"
        (toggled)="toggle()"
      />

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
export class AppLockSettingComponent {
  protected readonly lock = inject(AppLockService);
  private readonly user = inject(AuthService).user;

  readonly message = signal<string | null>(null);
  readonly error = signal(false);

  readonly caption = computed(() =>
    this.lock.supported() || this.lock.enabled()
      ? 'When the app opens, or after a minute away'
      : 'Not available here. Use the installed app on your phone.',
  );

  async toggle(): Promise<void> {
    this.message.set(null);

    if (this.lock.enabled()) {
      this.lock.disable();
      this.show(false, 'Face ID is off.');
      return;
    }

    const user = this.user();
    if (!user) return;

    try {
      // Called straight from the tap so iOS shows the Face ID prompt.
      await this.lock.enable({ uid: user.uid, email: user.email ?? 'Expenses' });
      this.show(false, 'Face ID is on.');
    } catch (error) {
      console.error('Face ID setup failed:', error);
      this.show(true, error instanceof Error ? error.message : 'Face ID was not set up.');
    }
  }

  private show(isError: boolean, text: string): void {
    this.error.set(isError);
    this.message.set(text);
  }
}
