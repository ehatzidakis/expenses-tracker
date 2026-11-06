import { Component, input, output } from '@angular/core';
import { ConfirmModal } from '../confirm-modal/confirm-modal';

@Component({
  selector: 'app-edit-form-shell',
  standalone: true,
  imports: [ConfirmModal],
  host: { class: 'block' },
  template: `
    <div [class]="outerClass()">
      @if (showBack()) {
        <div class="flex items-center justify-between gap-3">
          <button type="button" (click)="back.emit()" [class]="backClass()">
            <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.83 10l3.94 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clip-rule="evenodd"
              />
            </svg>
            Back
          </button>
          <h3 class="type-wide text-[16px] font-semibold text-ink">{{ title() }}</h3>
          <span class="w-16" aria-hidden="true"></span>
        </div>
      } @else {
        <h3 class="type-wide text-lg font-semibold text-ink">{{ title() }}</h3>
      }

      <form (submit)="submitted.emit($event)" class="space-y-4">
        <ng-content />

        @if (errorMessage()) {
          <div
            role="alert"
            class="p-3 bg-cherry-deep/60 border border-cherry/30 text-cherry rounded-xl text-[13px]"
          >
            {{ errorMessage() }}
          </div>
        }

        <div class="pt-2 space-y-2">
          <button
            type="submit"
            [disabled]="formInvalid() || submitting() || deleting() || privacyDisabled()"
            class="w-full min-h-12 rounded-xl text-[15px] font-semibold text-ground bg-ember hover:bg-ember-ink disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-[transform,background-color] cursor-pointer"
          >
            {{ submitting() ? submittingLabel() : submitLabel() }}
          </button>

          <button
            type="button"
            (click)="deleteRequested.emit()"
            [disabled]="submitting() || deleting() || privacyDisabled()"
            class="w-full min-h-12 rounded-xl text-[15px] font-semibold text-cherry border border-cherry/35 hover:bg-cherry-deep/50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-[transform,background-color] cursor-pointer"
          >
            {{ deleting() ? deletingLabel() : deleteLabel() }}
          </button>
        </div>
      </form>
    </div>

    <app-confirm-modal
      [isOpen]="showDeleteConfirm()"
      [title]="deleteTitle()"
      [message]="deleteMessage()"
      [confirmText]="deleteConfirmText()"
      (confirmed)="deleteConfirmed.emit()"
      (cancelled)="deleteCancelled.emit()"
    />
  `,
})
export class EditFormShellComponent {
  readonly title = input.required<string>();
  readonly outerClass = input('space-y-4');
  /** Show a Back button; off inside a sheet, which has its own close button. */
  readonly showBack = input(false);
  readonly backClass = input(
    '-ml-2 flex min-h-11 items-center gap-1 px-2 text-[14px] font-medium text-ink-2 hover:text-ink transition-colors cursor-pointer',
  );
  readonly formInvalid = input.required<boolean>();
  readonly submitting = input.required<boolean>();
  readonly deleting = input.required<boolean>();
  readonly privacyDisabled = input.required<boolean>();
  readonly errorMessage = input<string | null>(null);
  readonly submitLabel = input('Save Changes');
  readonly submittingLabel = input('Saving…');
  readonly deletingLabel = input('Deleting…');
  readonly deleteConfirmText = input('Delete');
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
