import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Adjustment } from '../../models/adjustments.model';
import { PrivacyService } from '../../services/privacy.service';

@Component({
  selector: 'app-adjustment-card',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './adjustment-card.component.html',
})
export class AdjustmentCardComponent {
  adjustment = input.required<Adjustment>();

  privacyService = inject(PrivacyService);

  isAddition = computed(() => this.adjustment().adjType);

  isSameDay = computed(
    () => this.adjustment().startDate.toDateString() === this.adjustment().endDate.toDateString(),
  );
}
