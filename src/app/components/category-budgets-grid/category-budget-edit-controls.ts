import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-budget-edit-controls',
  standalone: true,
  host: { class: 'block' },
  imports: [FormsModule],
  template: `
    <div class="space-y-4">
      @if (isEditing()) {
        <div class="rounded-2xl border border-indigo-500/40 bg-indigo-950/20 p-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
                Total wage
              </div>
            </div>
            <div
              class="flex items-center gap-2 rounded-md border border-indigo-500/30 bg-gray-950/70 px-2 py-1.5"
            >
              <span class="text-gray-400">€</span>
              <input
                type="text"
                inputmode="numeric"
                autocomplete="off"
                pattern="[0-9]*"
                class="w-24 bg-transparent text-right text-base font-semibold text-white outline-none"
                [ngModel]="draftWage()"
                (ngModelChange)="wageChange.emit($event)"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            class="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-gray-500"
            (click)="cancel.emit()"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
            (click)="save.emit()"
          >
            Save
          </button>
        </div>
      }
    </div>
  `,
})
export class CategoryBudgetEditControlsComponent {
  readonly isEditing = input(false);
  readonly draftWage = input.required<number>();

  readonly wageChange = output<string | number>();
  readonly cancel = output<void>();
  readonly save = output<void>();
}
