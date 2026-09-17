import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type PinFormVariant = 'indigo' | 'red';

@Component({
  selector: 'app-pin-entry-form',
  standalone: true,
  imports: [FormsModule],
  host: { class: 'block' },
  template: `
    <div class="bg-gray-800/60 border border-gray-700 p-4 rounded-2xl space-y-3">
      <span class="text-xs font-medium text-gray-300 block" [class.text-center]="centerTitle()">
        {{ title() }}
      </span>
      <input
        type="password"
        [ngModel]="value()"
        (ngModelChange)="setValue($event)"
        [placeholder]="placeholder()"
        [autofocus]="autofocus()"
        class="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-100 placeholder:text-gray-600 tracking-widest focus:outline-none focus:border-indigo-500"
        [class.text-center]="centerTitle()"
      />
      <div class="flex gap-2">
        <button
          type="button"
          (click)="cancel.emit()"
          class="flex-1 py-2 text-xs text-gray-400 bg-gray-800 rounded-xl hover:text-white cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          (click)="submitted.emit(value())"
          class="flex-1 py-2 text-xs font-semibold text-white rounded-xl cursor-pointer"
          [class]="submitButtonClass()"
        >
          {{ submitLabel() }}
        </button>
      </div>
    </div>
  `,
})
export class PinEntryFormComponent {
  readonly title = input.required<string>();
  readonly placeholder = input.required<string>();
  readonly submitLabel = input.required<string>();
  readonly variant = input<PinFormVariant>('indigo');
  readonly centerTitle = input(false);
  readonly autofocus = input(false);

  readonly cancel = output<void>();
  readonly submitted = output<string>();
  readonly valueChange = output<string>();
  readonly value = signal('');

  setValue(value: string): void {
    this.value.set(value);
    this.valueChange.emit(value);
  }

  submitButtonClass(): string {
    return this.variant() === 'red'
      ? 'bg-red-600 hover:bg-red-500'
      : 'bg-indigo-600 hover:bg-indigo-500';
  }
}
