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
      <label class="text-xs font-medium text-gray-400">Add Comment</label>
      <div class="grid grid-cols-2 gap-2 p-1 bg-gray-950/80 rounded-xl border border-gray-800">
        <button
          type="button"
          (click)="commentToggle.emit(true)"
          class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
          [class.bg-indigo-500/20]="enabled()"
          [class.text-indigo-400]="enabled()"
          [class.border]="enabled()"
          [class.border-indigo-500/30]="enabled()"
          [class.text-gray-400]="!enabled()"
        >
          Yes
        </button>
        <button
          type="button"
          (click)="commentToggle.emit(false)"
          class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
          [class.bg-gray-700/60]="!enabled()"
          [class.text-gray-200]="!enabled()"
          [class.border]="!enabled()"
          [class.border-gray-600/40]="!enabled()"
          [class.text-gray-400]="enabled()"
        >
          No
        </button>
      </div>
      </div>

      @if (enabled()) {
        <div class="space-y-1.5">
          <label for="tx-comment" class="text-xs font-medium text-gray-400">Comment</label>
          <textarea
            id="tx-comment"
            rows="2"
            [formField]="commentField()"
            placeholder="Add a note about this transaction"
            class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 resize-none"
          ></textarea>
          @if (commentField()().touched() && commentField()().invalid()) {
            <span class="text-[11px] text-red-400">{{ commentField()().errors()[0]?.message }}</span>
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
