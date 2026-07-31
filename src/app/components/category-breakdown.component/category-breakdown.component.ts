import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategorySpend } from '../../services/expense-state.service';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './category-breakdown.component.html'
})
export class CategoryBreakdownComponent {
  categories = input.required<CategorySpend[]>();
}