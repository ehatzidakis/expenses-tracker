import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Adjustment } from '../../models/adjustments.model';

@Component({
  selector: 'app-adjustment-selector',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <section class="flex items-center gap-2">
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none flex-1 min-w-0">
        <!-- Singles pill -->
        <button
          (click)="onSelect(null)"
          [class]="
            selectedId() === null
              ? 'bg-indigo-600 text-white font-medium border-indigo-500'
              : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'
          "
          class="px-4 py-2 rounded-xl text-xs whitespace-nowrap border transition-all duration-150 shrink-0"
        >
          Singles
        </button>

        <!-- One pill per trip adjustment -->
        @for (trip of tripAdjustments(); track trip.id) {
          <button
            (click)="onSelect(trip.id)"
            [class]="
              selectedId() === trip.id
                ? 'bg-sky-600 text-white font-medium border-sky-500'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'
            "
            class="px-4 py-2 rounded-xl text-xs whitespace-nowrap border transition-all duration-150 shrink-0 flex items-center gap-1"
          >
            {{ trip.title }}
          </button>
        }
      </div>
    </section>
  `,
})
export class AdjustmentSelectorComponent {
  adjustments = input.required<Adjustment[]>();
  selectedId = input<string | null>(null);

  selectionChanged = output<string | null>();

  tripAdjustments = computed(() => this.adjustments().filter((a) => a.isTrip));

  onSelect(id: string | null): void {
    this.selectionChanged.emit(id);
  }
}
