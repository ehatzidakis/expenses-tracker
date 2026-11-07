import { Component, input, output } from '@angular/core';
import type { EntryKind } from './create-transaction.models';
import { SEGMENT_BASE, SEGMENT_FRAME, SEGMENT_OFF, SEGMENT_ON } from '../../utils/pill-styles';

@Component({
  selector: 'app-create-entry-tabs',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div role="group" aria-label="What to add" [class]="frame + ' grid-cols-3'">
      @for (option of options; track option.id) {
        <button
          type="button"
          [class]="segment(activeTab() === option.id)"
          [attr.aria-pressed]="activeTab() === option.id"
          (click)="tabChange.emit(option.id)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class CreateEntryTabsComponent {
  protected readonly frame = SEGMENT_FRAME;

  segment(active: boolean): string {
    return `${SEGMENT_BASE} ${active ? SEGMENT_ON : SEGMENT_OFF}`;
  }

  readonly options: ReadonlyArray<{ id: EntryKind; label: string }> = [
    { id: 'transaction', label: 'Transaction' },
    { id: 'trip', label: 'Trip' },
    { id: 'oneoff', label: 'One-off' },
  ];

  readonly activeTab = input.required<EntryKind>();
  readonly tabChange = output<EntryKind>();
}
