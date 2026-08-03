import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
})
export class ConfirmModal {
  readonly isOpen = input.required<boolean>();
  readonly title = input<string>('Are you sure?');
  readonly message = input<string>('This action cannot be undone.');
  readonly confirmText = input<string>('Delete');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
