import { Component, output } from '@angular/core';

@Component({
  selector: 'app-sign-out-action',
  standalone: true,
  host: { class: 'block mt-3' },
  template: `
    <div class="space-y-3">
      <button
        type="button"
        (click)="signOut.emit()"
        class="w-full flex items-center justify-center gap-2 rounded-2xl border border-cherry-fill/80 bg-cherry-deep/40 px-3 py-2.5 text-sm font-medium text-cherry transition hover:bg-cherry-deep/50 cursor-pointer"
      >
        <span>↩</span>
        Sign out
      </button>
    </div>
  `,
})
export class SignOutActionComponent {
  readonly signOut = output<void>();
}
