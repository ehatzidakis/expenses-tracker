import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Adjustment } from '../../models/adjustments.model';
import { PrivacyService } from '../../services/privacy.service';

function formatDateForInput(dateVal: Date | string): string {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal).substring(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
@Component({
  selector: 'app-adjustment-card',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './adjustment-card.component.html',
})
export class AdjustmentCardComponent {
  readonly adjustment = input.required<Adjustment>();
  readonly privacyService = inject(PrivacyService);

  readonly cardClick = output<void>();

  readonly isAddition = computed(() => this.adjustment().adjType);

  readonly isSameDay = computed(() => {
    const adj = this.adjustment();
    if (!adj.startDate || !adj.endDate) return true;
    return formatDateForInput(adj.startDate) === formatDateForInput(adj.endDate);
  });
}
