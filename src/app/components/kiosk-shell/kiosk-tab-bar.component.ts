import { Component, input, output } from '@angular/core';

export type KioskTab = 'new' | 'requests';

/** Bottom tab bar for kiosk mode. Docked smoked glass, like the admin's TabBarComponent. */
@Component({
  selector: 'app-kiosk-tab-bar',
  standalone: true,
  host: { class: 'block' },
  template: `
    <nav
      role="tablist"
      aria-label="Kiosk sections"
      class="fixed inset-x-0 bottom-0 z-40 flex justify-center border-t border-ink/10 bg-panel/90 pb-[max(calc(env(safe-area-inset-bottom)-16px),8px)] backdrop-blur-xl"
    >
      @for (tab of tabs; track tab.id) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab() === tab.id"
          (click)="tabChange.emit(tab.id)"
          class="relative flex min-h-[50px] w-full max-w-48 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer"
          [class]="
            activeTab() === tab.id
              ? 'text-ember-ink shadow-[inset_0_2px_0_var(--color-ember)]'
              : 'text-ink-3 hover:text-ink'
          "
        >
          <svg
            class="size-[22px]"
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
              class="absolute top-1.5 left-1/2 ml-2 min-w-4 h-4 px-1 rounded-full bg-cherry-fill text-ink text-[11px] font-bold leading-4 text-center"
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
