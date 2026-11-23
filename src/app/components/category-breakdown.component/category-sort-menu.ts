import { Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { CATEGORY_SORTS, CategorySort } from '../../utils/category-sort';

/** Each sort and its reverse share a group; a hairline separates the groups. */
const GROUP_STARTS = new Set<CategorySort>(['spent-desc', 'left-desc', 'over-desc']);

/**
 * The sort control beside the Categories heading: a quiet text button naming the current order,
 * opening a short menu of the default plus each sort and its reverse.
 */
@Component({
  selector: 'app-category-sort-menu',
  standalone: true,
  host: {
    class: 'relative block',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close(true)',
  },
  template: `
    <button
      #trigger
      type="button"
      class="flex min-h-11 items-center gap-1 whitespace-nowrap px-1.5 text-[13px] text-ink-3 hover:text-ink cursor-pointer"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [attr.aria-label]="'Sort categories: ' + current().label"
      (click)="toggle()"
    >
      <svg class="size-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M2.24 6.8a.75.75 0 001.06-.04l1.95-2.1v8.59a.75.75 0 001.5 0V4.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0L2.2 5.74a.75.75 0 00.04 1.06zm8 6.4a.75.75 0 00-.04 1.06l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75a.75.75 0 00-1.5 0v8.59l-1.95-2.1a.75.75 0 00-1.06-.04z"
        />
      </svg>
      {{ current().short }}
    </button>

    @if (open()) {
      <div
        role="menu"
        aria-label="Sort categories"
        class="absolute left-0 top-full z-30 mt-1 w-60 rounded-2xl border border-edge bg-raised p-1.5 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7)]"
      >
        @for (option of options; track option.id) {
          @if (groupStarts.has(option.id)) {
            <div class="mx-2 my-1 h-px bg-ink/10" role="separator"></div>
          }
          <button
            type="button"
            role="menuitemradio"
            [attr.aria-checked]="option.id === value()"
            class="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-[13px] cursor-pointer hover:bg-raised-hi"
            [class]="option.id === value() ? 'font-medium text-ink' : 'text-ink-2'"
            (click)="pick(option.id)"
          >
            <span class="flex items-center gap-2">
              {{ option.label }}
              @if (option.percent) {
                <!-- Ranked by share of the budget used, not euros -->
                <span
                  class="rounded-md border border-edge px-1.5 text-[11px] font-medium leading-[18px] text-ink-3"
                  aria-hidden="true"
                  >%</span
                >
                <span class="sr-only">, by percentage of budget</span>
              }
            </span>
            @if (option.id === value()) {
              <svg class="size-4 shrink-0 text-ember" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.58l7.3-7.3a1 1 0 011.4 0z"
                />
              </svg>
            }
          </button>
        }
      </div>
    }
  `,
})
export class CategorySortMenuComponent {
  readonly value = input.required<CategorySort>();
  readonly changed = output<CategorySort>();

  protected readonly options = CATEGORY_SORTS;
  protected readonly groupStarts = GROUP_STARTS;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  readonly open = signal(false);
  readonly current = computed(() => CATEGORY_SORTS.find((o) => o.id === this.value()) ?? CATEGORY_SORTS[0]);

  toggle(): void {
    this.open.update((v) => !v);
  }

  pick(sort: CategorySort): void {
    this.changed.emit(sort);
    this.close(true);
  }

  /** Escape and picking return focus to the button; an outside tap leaves focus where it went. */
  close(refocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (refocus) this.trigger().nativeElement.focus();
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}
