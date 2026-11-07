import { Component, computed, input, output } from '@angular/core';
import { SEGMENT_BASE, SEGMENT_FRAME, SEGMENT_OFF, SEGMENT_ON } from '../../utils/pill-styles';

export type SplitzesTab = 'balances' | 'incoming' | 'history';

@Component({
  selector: 'app-splitzes-tabs',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div role="tablist" aria-label="Splitzes" [class]="frame + ' ' + (tabs().length === 3 ? 'grid-cols-3' : 'grid-cols-2')">
      @for (tab of tabs(); track tab.id) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab() === tab.id"
          [class]="segment(activeTab() === tab.id) + ' flex items-center justify-center gap-1.5'"
          (click)="tabChange.emit(tab.id)"
        >
          {{ tab.label }}
          @if (tab.id === 'incoming' && incomingCount() > 0) {
            <span
              class="min-w-5 rounded-full bg-cherry-fill px-1.5 text-[11px] font-semibold leading-5 text-ink tabular-nums"
            >
              {{ incomingCount() }}
            </span>
          }
        </button>
      }
    </div>
  `,
})
export class SplitzesTabsComponent {
  protected readonly frame = SEGMENT_FRAME;

  segment(active: boolean): string {
    return `${SEGMENT_BASE} ${active ? SEGMENT_ON : SEGMENT_OFF}`;
  }

  readonly activeTab = input.required<SplitzesTab>();
  readonly showIncoming = input(false);
  readonly incomingCount = input(0);
  readonly tabChange = output<SplitzesTab>();

  readonly tabs = computed<Array<{ id: SplitzesTab; label: string }>>(() => [
    { id: 'balances', label: 'Balances' },
    ...(this.showIncoming() ? [{ id: 'incoming' as const, label: 'Incoming' }] : []),
    { id: 'history', label: 'History' },
  ]);

}
