import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { getCategoryMeta } from '../../services/expense-state.service';
import { categoryLabel } from '../../utils/period-pace';
import { SensitiveDirective } from '../../utils/sensitive.directive';

/** What is left of one category's budget in the month being logged. */
export interface CategoryRoom {
  spent: number;
  budget: number | null;
}

/**
 * The category keyboard on the Add tab: one tile per category, each showing what is left of its
 * budget this month, so the budget is in view at the moment of choosing.
 */
@Component({
  selector: 'app-category-picker',
  standalone: true,
  imports: [DecimalPipe, SensitiveDirective],
  host: { class: 'block' },
  template: `
    <div role="group" [attr.aria-label]="label()" class="grid grid-cols-3 gap-2">
      @for (name of categories(); track name) {
        <button
          type="button"
          class="flex min-h-[60px] min-w-0 flex-col justify-center gap-1 rounded-xl border px-2 py-2 text-left transition-colors duration-150 cursor-pointer"
          [class]="
            selected() === name
              ? 'border-transparent bg-ember/20 ring-1 ring-inset ring-ember/60'
              : 'border-edge hover:border-ink-4'
          "
          [attr.aria-pressed]="selected() === name"
          (click)="pick.emit(name)"
        >
          @if (roomFor(name); as room) {
            <!-- The name gets the full width; the emoji rides on the figure's line. -->
            <span class="truncate text-[13px] font-medium leading-tight text-ink">{{ nameOf(name) }}</span>
            <span class="flex min-w-0 items-center gap-1.5 text-[12px]">
              @if (emoji(name); as glyph) {
                <span class="shrink-0 text-[11px] opacity-60 grayscale-[40%]" aria-hidden="true">{{ glyph }}</span>
              }
              @if (room.budget === null) {
                <span class="truncate text-ink-4">No budget</span>
              } @else if (room.spent > room.budget + 0.005) {
                <span class="truncate font-semibold text-cherry" appSensitive="xs">
                  €{{ room.spent - room.budget | number: '1.2-2' }} over
                </span>
              } @else {
                <span class="truncate text-ink-3" appSensitive="xs">
                  €{{ room.budget - room.spent | number: '1.2-2' }} left
                </span>
              }
            </span>
          } @else {
            <!-- No figures (kiosk, trips): the emoji sits above the name, which keeps the full width. -->
            @if (emoji(name); as glyph) {
              <span class="text-[12px] leading-none opacity-60 grayscale-[40%]" aria-hidden="true">{{ glyph }}</span>
            }
            <span class="truncate text-[13px] font-medium leading-tight text-ink">{{ nameOf(name) }}</span>
          }
        </button>
      }
    </div>
  `,
})
export class CategoryPickerComponent {
  readonly categories = input.required<ReadonlyArray<string>>();
  readonly selected = input('');
  /** Spent and budget per category for the month being logged; null hides the figures. */
  readonly room = input<Record<string, CategoryRoom> | null>(null);
  readonly label = input('Category');

  readonly pick = output<string>();

  roomFor(name: string): CategoryRoom | null {
    return this.room()?.[name] ?? null;
  }

  emoji(name: string): string {
    return getCategoryMeta(name).emoji;
  }

  nameOf(name: string): string {
    return categoryLabel(name);
  }
}
