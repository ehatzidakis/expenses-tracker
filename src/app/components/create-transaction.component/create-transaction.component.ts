import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { KioskBalanceComponent } from './kiosk-balance.component';
import { CreateEntryTabsComponent } from './create-entry-tabs.component';
import { CreateTransactionFormComponent } from './create-transaction-form.component';
import { CreateAdjustmentFormComponent } from './create-adjustment-form.component';
import { SplitStateStore } from './split-state.store';
import { EntryKind } from './create-transaction.models';

@Component({
  selector: 'app-create-transaction',
  standalone: true,
  imports: [
    KioskBalanceComponent,
    CreateEntryTabsComponent,
    CreateTransactionFormComponent,
    CreateAdjustmentFormComponent,
  ],
  providers: [SplitStateStore],
  host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-5">
      @if (isKioskMode()) {
        <app-kiosk-balance />
      } @else {
        <app-create-entry-tabs [activeTab]="entry()" (tabChange)="setTab($event)" />
      }

      @if (entry() === 'transaction') {
        <app-create-transaction-form />
      } @else {
        <app-create-adjustment-form [isTrip]="entry() === 'trip'" />
      }
    </div>
  `,
})
export class CreateTransactionComponent {
  private authService = inject(AuthService);
  private splitStore = inject(SplitStateStore);
  readonly isKioskMode = this.authService.isKiosk;

  readonly entry = signal<EntryKind>('transaction');

  constructor() {
    effect(() => {
      if (this.authService.isKiosk()) {
        this.entry.set('transaction');
        this.splitStore.reset();
      }
    });
  }

  setTab(tab: EntryKind): void {
    if (this.isKioskMode() && tab !== 'transaction') {
      this.entry.set('transaction');
      return;
    }

    this.entry.set(tab);
    this.splitStore.reset();
  }
}
