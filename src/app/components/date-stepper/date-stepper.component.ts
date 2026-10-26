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
      −
    </button>
    <ng-content />
    <button
      type="button"
      aria-label="Next day"
      title="Next day"
      (click)="step(1)"
      [class]="buttonClass()"
    >
      +
    </button>
  `,
})
export class DateStepperComponent {
  readonly size = input<'md' | 'sm'>('md');

  private readonly dateInput = contentChild.required<string, ElementRef<HTMLInputElement>>(
    'dateInput',
    { read: ElementRef },
  );

  readonly buttonClass = computed(() => {
    const base =
      'shrink-0 flex items-center justify-center bg-gray-800/60 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-700/60 active:bg-gray-700 transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/60';
    return this.size() === 'sm'
      ? `${base} w-7 rounded-lg text-sm`
      : `${base} w-10 rounded-xl text-lg`;
  });

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
