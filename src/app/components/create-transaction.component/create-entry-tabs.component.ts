import { Component, input, output } from '@angular/core';
import type { EntryType } from './create-transaction.component';

@Component({
  selector: 'app-create-entry-tabs',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="relative flex bg-gray-950/80 p-1 rounded-xl border border-gray-800/80">
      <button
        type="button"
        (click)="tabChange.emit('transaction')"
        class="relative z-10 flex-1 py-1.5 text-xs font-semibold transition-colors duration-200 text-center rounded-lg cursor-pointer"
        [class.text-white]="activeTab() === 'transaction'"
        [class.text-gray-400]="activeTab() !== 'transaction'"
      >
        Add Transaction
      </button>
      <button
        type="button"
        (click)="tabChange.emit('adjustment')"
        class="relative z-10 flex-1 py-1.5 text-xs font-semibold transition-colors duration-200 text-center rounded-lg cursor-pointer"
        [class.text-white]="activeTab() === 'adjustment'"
        [class.text-gray-400]="activeTab() !== 'adjustment'"
      >
        Add One-Off
      </button>
      <div
        class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-600/90 rounded-lg transition-transform duration-200 ease-out"
        [class.translate-x-0]="activeTab() === 'transaction'"
        [class.translate-x-full]="activeTab() === 'adjustment'"
      ></div>
    </div>
  `,
})
export class CreateEntryTabsComponent {
  readonly activeTab = input.required<EntryType>();
  readonly tabChange = output<EntryType>();
}
