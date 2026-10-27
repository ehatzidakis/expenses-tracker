import { Component, output } from '@angular/core';

@Component({
  selector: 'app-splitzes-modal-header',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between pb-3 border-b border-gray-800">
      <div class="flex items-center gap-2">
        <span class="text-lg">✂️</span>
        <div>
          <h2 class="text-base font-semibold">Splitzes</h2>
          <p class="text-[11px] text-gray-400">Running balances with your crew</p>
        </div>
      </div>
      <button
        type="button"
        (click)="close.emit()"
        aria-label="Close Splitzes"
        class="h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm cursor-pointer transition-colors"
      >
        ✕
      </button>
    </div>
  `,
})
export class SplitzesModalHeaderComponent {
  readonly close = output<void>();
}
