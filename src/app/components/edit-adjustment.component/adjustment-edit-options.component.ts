import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-adjustment-edit-options',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-ink-2">Type</label>
        <div class="grid grid-cols-2 gap-2 p-1 bg-ground/80 rounded-xl border border-raised">
          <button
            type="button"
            (click)="typeChange.emit(true)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-avocado/20]="isAddition()"
            [class.text-avocado-ink]="isAddition()"
            [class.border]="isAddition()"
            [class.border-avocado/30]="isAddition()"
            [class.text-ink-2]="!isAddition()"
          >
            <span>↑</span> Bonus / Addition
          </button>

          <button
            type="button"
            (click)="typeChange.emit(false)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-cherry-fill/20]="!isAddition()"
            [class.text-cherry]="!isAddition()"
            [class.border]="!isAddition()"
            [class.border-cherry-fill/30]="!isAddition()"
            [class.text-ink-2]="isAddition()"
          >
            <span>↓</span> One-Off Expense
          </button>
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-medium text-ink-2">Trip</label>
        <div class="grid grid-cols-2 gap-2 p-1 bg-ground/80 rounded-xl border border-raised">
          <button
            type="button"
            (click)="tripChange.emit(true)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-ember/20]="isTrip()"
            [class.text-ember-ink]="isTrip()"
            [class.border]="isTrip()"
            [class.border-ember/30]="isTrip()"
            [class.text-ink-2]="!isTrip()"
          >
            🛫 Yes
          </button>
          <button
            type="button"
            (click)="tripChange.emit(false)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-edge/60]="!isTrip()"
            [class.text-ink]="!isTrip()"
            [class.border]="!isTrip()"
            [class.border-ink-4/40]="!isTrip()"
            [class.text-ink-2]="isTrip()"
          >
            No
          </button>
        </div>
      </div>

      @if (isTrip()) {
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-ink-2">Accept New Transactions</label>
          <div class="grid grid-cols-2 gap-2 p-1 bg-ground/80 rounded-xl border border-raised">
            <button
              type="button"
              (click)="selectableChange.emit(true)"
              class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
              [class.bg-avocado/20]="isSelectable()"
              [class.text-avocado-ink]="isSelectable()"
              [class.border]="isSelectable()"
              [class.border-avocado/30]="isSelectable()"
              [class.text-ink-2]="!isSelectable()"
            >
              🔓 Open
            </button>
            <button
              type="button"
              (click)="selectableChange.emit(false)"
              class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
              [class.bg-edge/60]="!isSelectable()"
              [class.text-ink]="!isSelectable()"
              [class.border]="!isSelectable()"
              [class.border-ink-4/40]="!isSelectable()"
              [class.text-ink-2]="isSelectable()"
            >
              🔒 Closed
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdjustmentEditOptionsComponent {
  readonly isAddition = input.required<boolean>();
  readonly isTrip = input.required<boolean>();
  readonly isSelectable = input.required<boolean>();

  readonly typeChange = output<boolean>();
  readonly tripChange = output<boolean>();
  readonly selectableChange = output<boolean>();
}
