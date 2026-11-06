import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-budget-edit-controls',
  standalone: true,
  host: { class: 'block' },
  imports: [FormsModule],
  template: `
    @if (isEditing()) {
      <div>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="min-h-12 rounded-xl border border-edge text-[15px] font-medium text-ink-2 transition-colors hover:border-ink-4 hover:text-ink cursor-pointer"
            (click)="cancel.emit()"
          >
            Cancel
          </button>
          <button
            type="button"
            class="min-h-12 rounded-xl bg-ember text-[15px] font-semibold text-ground transition-colors hover:bg-ember-ink cursor-pointer"
            (click)="save.emit()"
          >
            Save
          </button>
        </div>
      </div>
    }
  `,
})
export class CategoryBudgetEditControlsComponent {
  readonly isEditing = input(false);
  readonly draftWage = input.required<number>();

  readonly wageChange = output<string | number>();
  readonly cancel = output<void>();
  readonly save = output<void>();
}
