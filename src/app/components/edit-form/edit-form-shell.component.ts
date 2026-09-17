import { Component, input, output } from '@angular/core';
import { ConfirmModal } from '../confirm-modal/confirm-modal';

@Component({
  selector: 'app-edit-form-shell',
  standalone: true,
  imports: [ConfirmModal],
  template: `
    <div [class]="outerClass()">
      <div class="flex items-center justify-between">
        <button
          type="button"
          (click)="back.emit()"
          [class]="backClass()"
        >
          ← Back
        </button>
        <h3 class="text-sm font-semibold text-gray-200">{{ title() }}</h3>
        <div class="w-10"></div>
      </div>

      <form
        (submit)="submitted.emit($event)"
        class="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm"
      >
        <ng-content />

        @if (errorMessage()) {
          <div class="p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-xs">
            {{ errorMessage() }}
          </div>
        }

        <div class="pt-2 space-y-2">
          <button
            type="submit"
            [disabled]="formInvalid() || submitting() || deleting() || privacyDisabled()"
            class="w-full py-3 rounded-xl text-sm font-semibold text-white bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all"
          >
            {{ submitting() ? 'Saving…' : 'Save Changes' }}
          </button>

          <button
            type="button"
            (click)="deleteRequested.emit()"
            [disabled]="submitting() || deleting() || privacyDisabled()"
            class="w-full py-3 rounded-xl text-sm font-semibold text-red-400 bg-red-950/30 hover:bg-red-900/40 border border-red-800/50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all"
          >
            {{ deleting() ? 'Deleting…' : deleteLabel() }}
          </button>
        </div>
      </form>
    </div>

    <app-confirm-modal
      [isOpen]="showDeleteConfirm()"
      [title]="deleteTitle()"
      [message]="deleteMessage()"
      confirmText="Delete"
      (confirmed)="deleteConfirmed.emit()"
      (cancelled)="deleteCancelled.emit()"
    />
  `,
})
export class EditFormShellComponent {
  readonly title = input.required<string>();
  readonly outerClass = input('space-y-4');
  readonly backClass = input(
    'text-xs font-medium text-gray-400 hover:text-gray-200 flex items-center gap-1 transition-colors',
  );
  readonly formInvalid = input.required<boolean>();
  readonly submitting = input.required<boolean>();
  readonly deleting = input.required<boolean>();
  readonly privacyDisabled = input.required<boolean>();
  readonly errorMessage = input<string | null>(null);
  readonly deleteLabel = input.required<string>();
  readonly deleteTitle = input.required<string>();
  readonly deleteMessage = input.required<string>();
  readonly showDeleteConfirm = input.required<boolean>();

  readonly back = output<void>();
  readonly submitted = output<Event>();
  readonly deleteRequested = output<void>();
  readonly deleteConfirmed = output<void>();
  readonly deleteCancelled = output<void>();
}
