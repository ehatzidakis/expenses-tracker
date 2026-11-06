import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BUTTON_DANGER,
  BUTTON_PRIMARY,
  FIELD,
  FIELD_LABEL,
  BUTTON_SECONDARY_LG,
} from '../../utils/pill-styles';

type PinFormTone = 'primary' | 'danger';

let nextPinId = 0;

@Component({
  selector: 'app-pin-entry-form',
  standalone: true,
  imports: [FormsModule],
  host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-3 py-3">
      <label [for]="uid" [class]="fieldLabel">{{ title() }}</label>
      <input
        [id]="uid"
        type="password"
        inputmode="numeric"
        autocomplete="off"
        [ngModel]="value()"
        (ngModelChange)="setValue($event)"
        [placeholder]="placeholder()"
        [autofocus]="autofocus()"
        [class]="field + ' tracking-widest'"
      />
      <div class="grid grid-cols-2 gap-3">
        <button type="button" [class]="secondaryLg" (click)="cancel.emit()">
          Cancel
        </button>
        <button
          type="button"
          [class]="tone() === 'danger' ? danger : primary"
          (click)="submitted.emit(value())"
        >
          {{ submitLabel() }}
        </button>
      </div>
    </div>
  `,
})
export class PinEntryFormComponent {
  protected readonly secondaryLg = BUTTON_SECONDARY_LG;
  protected readonly uid = `pin-${nextPinId++}`;
  protected readonly field = FIELD;
  protected readonly fieldLabel = FIELD_LABEL;
  protected readonly primary = BUTTON_PRIMARY;
  protected readonly danger = BUTTON_DANGER;

  readonly title = input.required<string>();
  readonly placeholder = input.required<string>();
  readonly submitLabel = input.required<string>();
  readonly tone = input<PinFormTone>('primary');
  readonly autofocus = input(false);

  readonly cancel = output<void>();
  readonly submitted = output<string>();
  readonly valueChange = output<string>();
  readonly value = signal('');

  setValue(value: string): void {
    this.value.set(value);
    this.valueChange.emit(value);
  }

}
