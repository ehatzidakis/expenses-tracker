import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { BUTTON_DANGER, DIALOG, DIALOG_PANEL, BUTTON_SECONDARY_LG } from '../../utils/pill-styles';

let nextConfirmId = 0;

/**
 * Asks before something that can't be undone (delete, decline). A centred dialog over whatever
 * is open, so it also sits above a sheet. Cancel comes first, so it gets the focus.
 */
@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    <dialog
      #dialog
      [class]="dialogClass"
      [attr.aria-labelledby]="uid + '-title'"
      [attr.aria-describedby]="uid + '-message'"
      (cancel)="$event.preventDefault(); cancelled.emit()"
    >
      <div [class]="panelClass">
        <h3 [id]="uid + '-title'" class="type-wide text-[18px] font-semibold text-ink">{{ title() }}</h3>
        <p [id]="uid + '-message'" class="mt-2 text-[14px] leading-relaxed text-ink-2">{{ message() }}</p>

        <div class="mt-5 grid grid-cols-2 gap-3">
          <button type="button" [class]="secondaryLg" (click)="cancelled.emit()">
            Cancel
          </button>
          <button type="button" [class]="danger" (click)="confirmed.emit()">
            {{ confirmText() }}
          </button>
        </div>
      </div>
    </dialog>
  `,
})
export class ConfirmModal {
  protected readonly secondaryLg = BUTTON_SECONDARY_LG;
  protected readonly uid = `confirm-${nextConfirmId++}`;
  protected readonly dialogClass = DIALOG;
  protected readonly panelClass = DIALOG_PANEL;
  protected readonly danger = BUTTON_DANGER;

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
        // jsdom (tests) has no showModal.
        if (!dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }
}
