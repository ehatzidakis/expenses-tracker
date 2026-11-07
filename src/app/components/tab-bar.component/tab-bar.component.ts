import { Component, inject, input, output } from '@angular/core';
import { AppTab } from '../../services/expense-state.service';
import { PrivacyService } from '../../services/privacy.service';
import { injectPendingAttention } from '../splitzes-modal.component/pending-attention';

interface TabDef {
  id: AppTab;
  label: string;
}

/**
 * Docked bottom navigation: smoked glass, an ember rule over the current tab, Add in the middle.
 * Splitz carries the count of items waiting for review; Settings shows a dot while stealth is on.
 */
@Component({
  selector: 'app-tab-bar',
  standalone: true,
  host: { class: 'block' },
  template: `
    <!-- Only part of the home-indicator inset: the labels clear the indicator without dead space under them. -->
    <nav
      aria-label="Main"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-panel/90 pb-[max(calc(env(safe-area-inset-bottom)-16px),8px)] backdrop-blur-xl"
    >
      <ul class="mx-auto flex max-w-lg">
        @for (tab of tabs; track tab.id) {
          <li class="flex-1">
            <button
              type="button"
              (click)="onSelect(tab.id)"
              class="relative flex w-full min-h-[50px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150 cursor-pointer"
              [class]="activeTab() === tab.id ? 'text-ember-ink' : 'text-ink-3 hover:text-ink'"
              [attr.aria-current]="activeTab() === tab.id ? 'page' : null"
              [attr.aria-label]="ariaLabel(tab)"
            >
              @if (activeTab() === tab.id) {
                <span class="absolute inset-x-4 top-0 h-[2px] rounded-b-full bg-ember" aria-hidden="true"></span>
              }
              <span class="relative">
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
                    @case ('charts') {
                      <path d="M5 20V11M12 20V5M19 20v-6" />
                    }
                    @case ('create') {
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v8M8 12h8" />
                    }
                    @case ('splitz') {
                      <circle cx="6" cy="6" r="3" />
                      <circle cx="6" cy="18" r="3" />
                      <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
                    }
                    @case ('settings') {
                      <path d="M20 7h-9M14 17H5" />
                      <circle cx="17" cy="17" r="3" />
                      <circle cx="7" cy="7" r="3" />
                    }
                  }
                </svg>
                @if (tab.id === 'splitz' && attention().count > 0) {
                  <span
                    class="absolute -top-1 left-[15px] min-w-4 rounded-full bg-cherry-fill px-1 text-center text-[10px] font-semibold leading-4 text-ink tabular-nums ring-2 ring-panel"
                    aria-hidden="true"
                    >{{ attention().count }}</span
                  >
                }
                @if (tab.id === 'settings' && privacy.isPrivacyMode()) {
                  <span
                    class="absolute -top-0.5 -right-1 size-2.5 rounded-full bg-ember ring-2 ring-panel"
                    aria-hidden="true"
                  ></span>
                }
              </span>
              <span aria-hidden="true">{{ tab.label }}</span>
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

  protected readonly privacy = inject(PrivacyService);
  /** Items waiting under Splitz › Incoming. */
  readonly attention = injectPendingAttention();

  readonly tabs: TabDef[] = [
    { id: 'monthly', label: 'Budget' },
    { id: 'charts', label: 'Charts' },
    { id: 'create', label: 'Add' },
    { id: 'splitz', label: 'Splitz' },
    { id: 'settings', label: 'Settings' },
  ];

  /** The visible label, plus the count or stealth state the icon shows. */
  ariaLabel(tab: TabDef): string {
    const count = this.attention().count;
    if (tab.id === 'splitz' && count > 0) return `Splitz, ${count} waiting for review`;
    if (tab.id === 'settings' && this.privacy.isPrivacyMode()) return 'Settings, stealth mode on';
    return tab.label;
  }

  onSelect(id: AppTab): void {
    this.tabChange.emit(id);
  }
}
