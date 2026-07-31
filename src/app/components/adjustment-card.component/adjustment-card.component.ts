import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Adjustment } from '../../models/adjustments.model';

@Component({
  selector: 'app-adjustment-card',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './adjustment-card.component.html',
})
export class AdjustmentCardComponent {
  adjustment = input.required<Adjustment>();

  isAddition = computed(() => this.adjustment().adjType);

  isSameDay = computed(
    () => this.adjustment().startDate.toDateString() === this.adjustment().endDate.toDateString(),
  );
}
