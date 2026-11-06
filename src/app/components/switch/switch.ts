import { Component, input, output } from '@angular/core';

/**
 * An on/off setting. The whole row is the control, so the hit area is the full row (at least
 * 56px tall), and screen readers hear it as a switch with its label and state.
 */
@Component({
  selector: 'app-switch',
  standalone: true,
  host: { class: 'block' },
  template: `
    <button
      type="button"
      role="switch"
      class="flex min-h-14 w-full items-center justify-between gap-4 py-2.5 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      [attr.aria-checked]="checked()"
      [disabled]="disabled()"
      (click)="toggled.emit(!checked())"
    >
      <span class="min-w-0">
        <span class="block text-[15px] font-medium text-ink">{{ label() }}</span>
        @if (caption()) {
          <span class="mt-0.5 block text-[12px] text-ink-2">{{ caption() }}</span>
        }
      </span>
      <span
        class="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-150"
        [class]="checked() ? 'border-ember bg-ember' : 'border-edge bg-raised-hi'"
        aria-hidden="true"
      >
        <span
          class="absolute left-0.5 size-[22px] rounded-full transition-transform duration-150"
          [class]="checked() ? 'translate-x-5 bg-ink' : 'translate-x-0 bg-ink-3'"
        ></span>
      </span>
    </button>
  `,
})
export class SwitchComponent {
  readonly label = input.required<string>();
  readonly caption = input('');
  readonly checked = input(false);
  readonly disabled = input(false);

  /** The value the user asked for. */
  readonly toggled = output<boolean>();
}
