import { Component, computed, input, output } from '@angular/core';

export type SplitzesTab = 'balances' | 'incoming' | 'history';

@Component({
  selector: 'app-splitzes-tabs',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div
      class="relative flex bg-gray-950/80 p-1 rounded-xl border border-gray-800/80"
      role="tablist"
    >
      @for (tab of tabs(); track tab.id) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab() === tab.id"
          (click)="tabChange.emit(tab.id)"
          class="relative z-10 flex-1 py-1.5 text-xs font-semibold transition-colors duration-200 text-center rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
          [class.text-white]="activeTab() === tab.id"
          [class.text-gray-400]="activeTab() !== tab.id"
        >
          {{ tab.label }}
          @if (tab.id === 'incoming' && incomingCount() > 0) {
            <span
              class="min-w-4 h-4 px-1 rounded-full bg-amber-500 text-[10px] leading-4 text-gray-950 tabular-nums"
            >
              {{ incomingCount() }}
            </span>
          }
        </button>
      }
      <div
        class="absolute top-1 bottom-1 left-1 bg-teal-600/90 rounded-lg transition-transform duration-200 ease-out"
        [style.width]="indicatorWidth()"
        [style.transform]="indicatorTransform()"
      ></div>
    </div>
  `,
})
export class SplitzesTabsComponent {
  readonly activeTab = input.required<SplitzesTab>();
  readonly showIncoming = input(false);
  readonly incomingCount = input(0);
  readonly tabChange = output<SplitzesTab>();

  readonly tabs = computed<Array<{ id: SplitzesTab; label: string }>>(() => [
    { id: 'balances', label: 'Balances' },
    ...(this.showIncoming() ? [{ id: 'incoming' as const, label: 'Incoming' }] : []),
    { id: 'history', label: 'History' },
  ]);

  readonly indicatorWidth = computed(() => `calc((100% - 8px) / ${this.tabs().length})`);
  readonly indicatorTransform = computed(() => {
    const index = Math.max(
      0,
      this.tabs().findIndex((tab) => tab.id === this.activeTab()),
    );
    return `translateX(${index * 100}%)`;
  });
}
