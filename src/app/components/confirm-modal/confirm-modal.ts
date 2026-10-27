import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    <dialog
      #dialog
      /* (click)="onBackdropClick($event)" */
      (cancel)="$event.preventDefault(); cancelled.emit()"
      class="m-auto w-[calc(100%-2rem)] max-w-sm bg-transparent p-0 text-current backdrop:bg-black/75 backdrop:backdrop-blur-xs"
    >
      <!-- Modal Card -->
      <div
        class="bg-gray-900 border border-gray-800/90 rounded-2xl p-5 space-y-4 shadow-2xl animate-fade-in"
      >
        <!-- Header & Icon -->
        <div class="flex items-start gap-3">
          <div
            class="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-100">{{ title() }}</h3>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">{{ message() }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 pt-1">
          <button
            type="button"
            (click)="cancelled.emit()"
            class="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700/80 hover:bg-gray-750 active:scale-[0.98] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="confirmed.emit()"
            class="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-linear-to-br from-red-500 to-rose-600 shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            {{ confirmText() }}
          </button>
        </div>
      </div>
    </dialog>
  `,
})
export class ConfirmModal {
  readonly isOpen = input.required<boolean>();
  readonly title = input<string>('Are you sure?');
  readonly message = input<string>('This action cannot be undone.');
  readonly confirmText = input<string>('Delete');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      if (!dialog) return;

      if (this.isOpen()) {
        if (!dialog.open) dialog.showModal();
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  // Close when clicking the backdrop (the dialog element itself, outside the card).
  // onBackdropClick(event: MouseEvent): void {
  //   if (event.target === this.dialogRef()?.nativeElement) {
  //     this.cancelled.emit();
  //   }
  // }
}
