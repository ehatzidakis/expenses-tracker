import { Component, computed, input, output } from '@angular/core';
import { Expense } from '../../models/expenses.model';

@Component({
  selector: 'app-month-selector',
  standalone: true,
  host: { class: 'block' },
  template: `
    <section class="flex items-center gap-2">
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none flex-1 min-w-0">
        @for (item of regularMonths(); track item.id) {
          <button
            (click)="onSelect(item.id)"
            [class]="
              selectedId() === item.id
                ? 'bg-indigo-600 text-white font-medium border-indigo-500'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'
            "
            class="px-4 py-2 rounded-xl text-xs whitespace-nowrap border transition-all duration-150 shrink-0"
          >
            {{ item.MonthName }}
          </button>
        }
      </div>
    </section>
  `,
})
export class MonthSelectorComponent {
  months = input.required<Expense[]>();
  selectedId = input<string | null>(null);
  monthSelected = output<string>();

  regularMonths = computed(() => this.months().filter((m) => m.id !== 'ALL'));

  onSelect(id: string): void {
    this.monthSelected.emit(id);
  }
}
