import { Component, ElementRef, computed, contentChild, input } from '@angular/core';
import { shiftDateInputValue } from '../../utils/date-step';

/**
 * Wraps a projected `<input #dateInput type="date">` with − / + buttons that
 * move the date one day back or forward. The new value is written to the input
 * and announced with native `input`/`change` events, so it works with any
 * binding (`[formField]`, `(input)`, etc.).
 */
@Component({
  selector: 'app-date-stepper',
  standalone: true,
  host: { class: 'flex items-stretch gap-1.5 min-w-0' },
  template: `
    <button
      type="button"
      aria-label="Previous day"
      title="Previous day"
      (click)="step(-1)"
      [class]="buttonClass()"
    >
      <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" />
      </svg>
    </button>
    <ng-content />
    <button
      type="button"
      aria-label="Next day"
      title="Next day"
      (click)="step(1)"
      [class]="buttonClass()"
    >
      <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" />
      </svg>
    </button>
  `,
})
export class DateStepperComponent {
  readonly size = input<'md' | 'sm'>('md');

  private readonly dateInput = contentChild.required<string, ElementRef<HTMLInputElement>>(
    'dateInput',
    { read: ElementRef },
  );

  /** 44px either way; `size` is kept so existing callers still compile. */
  readonly buttonClass = computed(
    () =>
      'flex size-11 shrink-0 items-center justify-center rounded-xl border border-edge text-ink-2 transition-colors hover:border-ink-4 hover:text-ink active:bg-raised cursor-pointer select-none',
  );

  step(days: number): void {
    const el = this.dateInput().nativeElement;
    if (el.disabled || el.readOnly) return;

    let next = shiftDateInputValue(el.value, days);
    if (el.min && next < el.min) next = el.min;
    if (el.max && next > el.max) next = el.max;
    if (next === el.value) return;

    el.value = next;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
