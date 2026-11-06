import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-transaction-comment-fields',
  standalone: true,
  imports: [CommonModule, FormField],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">
      <div class="space-y-2 pt-1">
        <label class="text-xs font-medium text-ink-2">Add Comment</label>
        <div class="grid grid-cols-2 gap-2 p-1 bg-ground/80 rounded-xl border border-raised">
          <button
            type="button"
            (click)="commentToggle.emit(true)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-ember/20]="enabled()"
            [class.text-ember-ink]="enabled()"
            [class.border]="enabled()"
            [class.border-ember/30]="enabled()"
            [class.text-ink-2]="!enabled()"
          >
            Yes
          </button>
          <button
            type="button"
            (click)="commentToggle.emit(false)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-edge/60]="!enabled()"
            [class.text-ink]="!enabled()"
            [class.border]="!enabled()"
            [class.border-ink-4/40]="!enabled()"
            [class.text-ink-2]="enabled()"
          >
            No
          </button>
        </div>
      </div>

      @if (enabled()) {
        <div class="space-y-1.5">
          <label for="tx-comment" class="text-xs font-medium text-ink-2">Comment</label>
          <textarea
            id="tx-comment"
            rows="2"
            [formField]="commentField()"
            placeholder="Add a note about this transaction"
            class="w-full bg-raised/60 border border-raised rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-ember/60 resize-none"
          ></textarea>
          @if (commentField()().touched() && commentField()().invalid()) {
            <span class="text-[11px] text-cherry">{{
              commentField()().errors()[0]?.message
            }}</span>
          }
        </div>
      }
    </div>
  `,
})
export class TransactionCommentFieldsComponent {
  readonly enabled = input.required<boolean>();
  readonly commentField = input.required<FieldTree<string>>();
  readonly commentToggle = output<boolean>();
}
