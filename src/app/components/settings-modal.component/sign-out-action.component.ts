import { Component, output } from '@angular/core';

@Component({
  selector: 'app-sign-out-action',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="space-y-3">
      <button
        type="button"
        (click)="signOut.emit()"
        class="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-700/80 bg-red-950/40 px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-900/50 cursor-pointer"
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
