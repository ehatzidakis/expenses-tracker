import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-adjustment-edit-options',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-gray-400">Adjustment Type</label>
        <div class="grid grid-cols-2 gap-2 p-1 bg-gray-950/80 rounded-xl border border-gray-800">
          <button
            type="button"
            (click)="typeChange.emit(true)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-emerald-500/20]="isAddition()"
            [class.text-emerald-400]="isAddition()"
            [class.border]="isAddition()"
            [class.border-emerald-500/30]="isAddition()"
            [class.text-gray-400]="!isAddition()"
          >
            <span>↑</span> Bonus / Addition
          </button>

          <button
            type="button"
            (click)="typeChange.emit(false)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-red-500/20]="!isAddition()"
            [class.text-red-400]="!isAddition()"
            [class.border]="!isAddition()"
            [class.border-red-500/30]="!isAddition()"
            [class.text-gray-400]="isAddition()"
          >
            <span>↓</span> One-Off Expense
          </button>
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-medium text-gray-400">Trip</label>
        <div class="grid grid-cols-2 gap-2 p-1 bg-gray-950/80 rounded-xl border border-gray-800">
          <button
            type="button"
            (click)="tripChange.emit(true)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-sky-500/20]="isTrip()"
            [class.text-sky-400]="isTrip()"
            [class.border]="isTrip()"
            [class.border-sky-500/30]="isTrip()"
            [class.text-gray-400]="!isTrip()"
          >
            🛫 Yes
          </button>
          <button
            type="button"
            (click)="tripChange.emit(false)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-gray-700/60]="!isTrip()"
            [class.text-gray-200]="!isTrip()"
            [class.border]="!isTrip()"
            [class.border-gray-600/40]="!isTrip()"
            [class.text-gray-400]="isTrip()"
          >
            No
          </button>
        </div>
      </div>

      @if (isTrip()) {
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-gray-400">Accept New Transactions</label>
          <div class="grid grid-cols-2 gap-2 p-1 bg-gray-950/80 rounded-xl border border-gray-800">
            <button
              type="button"
              (click)="selectableChange.emit(true)"
              class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
              [class.bg-emerald-500/20]="isSelectable()"
              [class.text-emerald-400]="isSelectable()"
              [class.border]="isSelectable()"
              [class.border-emerald-500/30]="isSelectable()"
              [class.text-gray-400]="!isSelectable()"
            >
              🔓 Open
            </button>
            <button
              type="button"
              (click)="selectableChange.emit(false)"
              class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
              [class.bg-gray-700/60]="!isSelectable()"
              [class.text-gray-200]="!isSelectable()"
              [class.border]="!isSelectable()"
              [class.border-gray-600/40]="!isSelectable()"
              [class.text-gray-400]="isSelectable()"
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
