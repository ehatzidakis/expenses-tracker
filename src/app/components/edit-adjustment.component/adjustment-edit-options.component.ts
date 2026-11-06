import { Component, input, output } from '@angular/core';
import {
  FIELD_LABEL,
  SEGMENT_BASE,
  SEGMENT_FRAME,
  SEGMENT_OFF,
  SEGMENT_ON,
} from '../../utils/pill-styles';

/** Type, trip and open/closed for an existing one-off, as the shared segment switches. */
@Component({
  selector: 'app-adjustment-edit-options',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <span id="adj-edit-type" [class]="fieldLabel">Type</span>
        <div role="group" aria-labelledby="adj-edit-type" [class]="frame + ' grid-cols-2'">
          <button
            type="button"
            [class]="segment(isAddition())"
            [attr.aria-pressed]="isAddition()"
            (click)="typeChange.emit(true)"
          >
            Income
          </button>
          <button
            type="button"
            [class]="segment(!isAddition())"
            [attr.aria-pressed]="!isAddition()"
            (click)="typeChange.emit(false)"
          >
            Expense
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <span id="adj-edit-trip" [class]="fieldLabel">Trip</span>
        <div role="group" aria-labelledby="adj-edit-trip" [class]="frame + ' grid-cols-2'">
          <button
            type="button"
            [class]="segment(isTrip())"
            [attr.aria-pressed]="isTrip()"
            (click)="tripChange.emit(true)"
          >
            Yes
          </button>
          <button
            type="button"
            [class]="segment(!isTrip())"
            [attr.aria-pressed]="!isTrip()"
            (click)="tripChange.emit(false)"
          >
            No
          </button>
        </div>
      </div>

      @if (isTrip()) {
        <div class="flex flex-col gap-1.5">
          <span id="adj-edit-open" [class]="fieldLabel">New transactions</span>
          <div role="group" aria-labelledby="adj-edit-open" [class]="frame + ' grid-cols-2'">
            <button
              type="button"
              [class]="segment(isSelectable())"
              [attr.aria-pressed]="isSelectable()"
              (click)="selectableChange.emit(true)"
            >
              Open
            </button>
            <button
              type="button"
              [class]="segment(!isSelectable())"
              [attr.aria-pressed]="!isSelectable()"
              (click)="selectableChange.emit(false)"
            >
              Closed
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdjustmentEditOptionsComponent {
  protected readonly frame = SEGMENT_FRAME;
  protected readonly fieldLabel = FIELD_LABEL;

  readonly isAddition = input.required<boolean>();
  readonly isTrip = input.required<boolean>();
  readonly isSelectable = input.required<boolean>();

  readonly typeChange = output<boolean>();
  readonly tripChange = output<boolean>();
  readonly selectableChange = output<boolean>();

  segment(active: boolean): string {
    return `${SEGMENT_BASE} ${active ? SEGMENT_ON : SEGMENT_OFF}`;
  }
}
