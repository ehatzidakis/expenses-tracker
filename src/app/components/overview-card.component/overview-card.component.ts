import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategorySpend } from '../../services/expense-state.service';

@Component({
  selector: 'app-overview-card',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './overview-card.component.html',
})
export class OverviewCardComponent {
  totalSpend = input.required<number>();
  totalWage = input<number>(0);
  monthName = input<string>('');
  dateRangeInfo = input<{ count: number; first: string; last: string } | null>(null);
  topCategory = input<CategorySpend | null>(null);

  totalSaved = computed(() => this.totalWage() - this.totalSpend());
}
