import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { KioskBalanceComponent } from './kiosk-balance.component';
import { CreateEntryTabsComponent } from './create-entry-tabs.component';
import { CreateTransactionFormComponent } from './create-transaction-form.component';
import { CreateAdjustmentFormComponent } from './create-adjustment-form.component';
import { SplitStateStore } from './split-state.store';
import { EntryType } from './create-transaction.models';

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
    <div
      class="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm"
    >
      @if (isKioskMode()) {
        <app-kiosk-balance />
      } @else {
        <app-create-entry-tabs [activeTab]="activeTab()" (tabChange)="setTab($event)" />
      }

      @if (activeTab() === 'transaction') {
        <app-create-transaction-form />
      } @else {
        <app-create-adjustment-form />
      }
    </div>
  `,
})
export class CreateTransactionComponent {
  private authService = inject(AuthService);
  private splitStore = inject(SplitStateStore);
  readonly isKioskMode = this.authService.isKiosk;

  readonly activeTab = signal<EntryType>('transaction');

  constructor() {
    effect(() => {
      if (this.authService.isKiosk()) {
        this.activeTab.set('transaction');
        this.splitStore.reset();
      }
    });
  }

  setTab(tab: EntryType): void {
    if (this.isKioskMode() && tab === 'adjustment') {
      this.activeTab.set('transaction');
      return;
    }

    this.activeTab.set(tab);
    this.splitStore.reset();
  }
}
