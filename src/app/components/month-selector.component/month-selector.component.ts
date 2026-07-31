import { Component, computed, input, output } from '@angular/core';
import { Expense } from '../../models/expenses.model';

@Component({
  selector: 'app-month-selector',
  standalone: true,
  host: { class: 'block' },
  templateUrl: './month-selector.component.html',
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
