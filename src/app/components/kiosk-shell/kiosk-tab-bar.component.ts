import { Component, input, output } from '@angular/core';

export type KioskTab = 'new' | 'requests';

/** Bottom tab bar for kiosk mode. Same floating pill look as the admin's TabBarComponent. */
@Component({
  selector: 'app-kiosk-tab-bar',
  standalone: true,
  host: { class: 'block' },
  template: `
    <nav
      role="tablist"
      aria-label="Kiosk sections"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-gray-900/70 border border-gray-800/70 backdrop-blur-xl shadow-2xl shadow-black/50"
    >
      @for (tab of tabs; track tab.id) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab() === tab.id"
          (click)="tabChange.emit(tab.id)"
          class="relative flex flex-col items-center justify-center gap-0.5 px-5 py-2 rounded-full text-[10px] font-medium whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer"
          [class]="
            activeTab() === tab.id
              ? 'bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-950/40'
              : 'text-gray-400 hover:text-gray-200'
          "
        >
          <svg
            class="w-4.5 h-4.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            @if (tab.id === 'new') {
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            } @else {
              <path d="M22 12h-6l-2 3h-4l-2-3H2" />
              <path
                d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
              />
            }
          </svg>
          <span>{{ tab.label }}</span>
          @if (tab.id === 'requests' && requestCount() > 0) {
            <span
              class="absolute -top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold leading-4 text-center"
              [attr.aria-label]="requestCount() + ' requests waiting'"
            >
              {{ requestCount() }}
            </span>
          }
        </button>
      }
    </nav>
  `,
})
export class KioskTabBarComponent {
  readonly activeTab = input.required<KioskTab>();
  readonly requestCount = input(0);
  readonly tabChange = output<KioskTab>();

  readonly tabs: { id: KioskTab; label: string }[] = [
    { id: 'new', label: 'New' },
    { id: 'requests', label: 'Requests' },
  ];
}
