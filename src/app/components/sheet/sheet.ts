import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';

/**
 * Bottom sheet for editing, opened over the page so the list underneath keeps its scroll
 * position. Render it inside an @if; it opens on render and emits `closed` on Escape, a tap on
 * the backdrop, or the close button.
 */
@Component({
  selector: 'app-sheet',
  standalone: true,
  styles: `
    dialog[open] .sheet-panel {
      animation: sheet-up 380ms var(--ease-out-expo) both;
    }
    dialog::backdrop {
      background: rgb(8 5 4 / 0.72);
      backdrop-filter: blur(3px);
    }
    @keyframes sheet-up {
      from {
        transform: translateY(24px);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }
  `,
  template: `
    <dialog
      #dialog
      class="mx-auto mb-0 mt-auto w-full max-w-lg max-h-[92dvh] bg-transparent p-0 text-ink outline-none"
      [attr.aria-label]="label()"
      (cancel)="$event.preventDefault(); closed.emit()"
      (click)="onDialogClick($event)"
    >
      <div
        class="sheet-panel flex max-h-[92dvh] flex-col rounded-t-[28px] border border-b-0 border-edge bg-panel shadow-[0_-24px_60px_-20px_rgb(0_0_0/0.8)]"
      >
        <div class="flex items-center justify-between gap-3 px-5 pt-2">
          <span class="w-11" aria-hidden="true"></span>
          <span class="mt-1 h-1 w-10 rounded-full bg-edge" aria-hidden="true"></span>
          <button
            type="button"
            class="-mr-2 flex size-11 items-center justify-center rounded-full text-ink-2 hover:text-ink cursor-pointer"
            aria-label="Close"
            (click)="closed.emit()"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div #body class="overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
          <ng-content />
        </div>
      </div>
    </dialog>
  `,
})
export class SheetComponent {
  readonly label = input('');
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

  constructor() {
    afterNextRender(() => {
      const dialog = this.dialog().nativeElement;
      if (!dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
    });
  }

  /** Back to the top, for content that swaps views inside one sheet (Settings › Budgets). */
  scrollToTop(): void {
    this.body().nativeElement.scrollTop = 0;
  }

  /** A click that lands on the dialog itself (not the panel) is a tap on the backdrop. */
  onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.closed.emit();
  }
}
