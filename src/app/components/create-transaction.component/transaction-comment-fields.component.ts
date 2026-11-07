import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { FIELD, FIELD_LABEL } from '../../utils/pill-styles';

@Component({
  selector: 'app-transaction-comment-fields',
  standalone: true,
  imports: [CommonModule, FormField],
  host: { class: 'block' },
  template: `
    @if (!enabled()) {
      <button
        type="button"
        (click)="commentToggle.emit(true)"
        class="flex min-h-11 items-center gap-2 text-[14px] text-ink-2 transition-colors hover:text-ink cursor-pointer"
      >
        <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
          />
        </svg>
        Add a comment
      </button>
    } @else {
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between gap-3">
          <label for="tx-comment" [class]="fieldLabel">Comment</label>
          <button
            type="button"
            (click)="commentToggle.emit(false)"
            class="min-h-11 px-2 text-[13px] text-ink-3 transition-colors hover:text-ink cursor-pointer"
          >
            Remove
          </button>
        </div>
        <textarea
          id="tx-comment"
          rows="2"
          [formField]="commentField()"
          placeholder="A note for later"
          [class]="field + ' resize-none py-3'"
        ></textarea>
        @if (commentField()().touched() && commentField()().invalid()) {
          <p class="text-[12px] text-cherry">{{ commentField()().errors()[0]?.message }}</p>
        }
      </div>
    }
  `,
})
export class TransactionCommentFieldsComponent {
  protected readonly field = FIELD;
  protected readonly fieldLabel = FIELD_LABEL;
  readonly enabled = input.required<boolean>();
  readonly commentField = input.required<FieldTree<string>>();
  readonly commentToggle = output<boolean>();
}
