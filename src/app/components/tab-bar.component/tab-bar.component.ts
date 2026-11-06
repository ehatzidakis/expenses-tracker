import { Component, input, output } from '@angular/core';
import { AppTab } from '../../services/expense-state.service';

interface TabDef {
  id: AppTab;
  label: string;
}

/** Docked bottom navigation: smoked glass, an ember rule over the current tab. */
@Component({
  selector: 'app-tab-bar',
  standalone: true,
  host: { class: 'block' },
  template: `
    <nav
      aria-label="Main"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-panel/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <ul class="mx-auto flex max-w-lg">
        @for (tab of tabs; track tab.id) {
          <li class="flex-1">
            <button
              type="button"
              (click)="onSelect(tab.id)"
              class="relative flex w-full min-h-[54px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150 cursor-pointer"
              [class]="activeTab() === tab.id ? 'text-ember-ink' : 'text-ink-3 hover:text-ink'"
              [attr.aria-current]="activeTab() === tab.id ? 'page' : null"
            >
              @if (activeTab() === tab.id) {
                <span class="absolute inset-x-6 top-0 h-[2px] rounded-b-full bg-ember" aria-hidden="true"></span>
              }
              <svg
                class="size-[22px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                @switch (tab.id) {
                  @case ('monthly') {
                    <path d="M3.5 7.5h17M3.5 12h17M3.5 16.5h10" />
                  }
                  @case ('sumup') {
                    <path d="M12 2 2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  }
                  @case ('create') {
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v8M8 12h8" />
                  }
                  @case ('charts') {
                    <path d="M5 20V11M12 20V5M19 20v-6" />
                  }
                }
              </svg>
              <span>{{ tab.label }}</span>
            </button>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class TabBarComponent {
  activeTab = input<AppTab>('monthly');
  tabChange = output<AppTab>();

  readonly tabs: TabDef[] = [
    { id: 'monthly', label: 'Budget' },
    { id: 'sumup', label: 'All time' },
    { id: 'create', label: 'Add' },
    { id: 'charts', label: 'Charts' },
  ];

  onSelect(id: AppTab): void {
    this.tabChange.emit(id);
  }
}
