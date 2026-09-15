import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  templateUrl: './confirm-modal.html',
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
