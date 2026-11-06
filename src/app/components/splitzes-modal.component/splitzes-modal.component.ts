import { Component, computed, inject, output, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction-service';
import { SplitzBalancesComponent } from './splitz-balances.component';
import { SplitzHistoryComponent } from './splitz-history.component';
import { SplitzIncomingComponent } from './splitz-incoming.component';
import { SplitzesTab, SplitzesTabsComponent } from './splitzes-tabs.component';
import { SheetComponent } from '../sheet/sheet';

@Component({
  selector: 'app-splitzes-modal',
  standalone: true,
  imports: [SheetComponent, 
    SplitzBalancesComponent,
    SplitzHistoryComponent,
    SplitzIncomingComponent,
    SplitzesTabsComponent,
  ],
  template: `
    <app-sheet label="Splitzes" (closed)="close.emit()">
      <h2 class="type-wide text-[18px] font-semibold text-ink">Splitzes</h2>
      <p class="mt-1 text-[13px] text-ink-2">Who owes whom, and what's waiting for you</p>

      <!-- A steady height keeps the tabs under the thumb whichever tab is open. -->
      <div class="mt-4 flex min-h-[min(560px,72dvh)] flex-col gap-5">
        <app-splitzes-tabs
          [activeTab]="activeTab()"
          [showIncoming]="isAdmin()"
          [incomingCount]="incomingCount()"
          (tabChange)="selectTab($event)"
        />

        @switch (activeTab()) {
          @case ('incoming') {
            <app-splitz-incoming />
          }
          @case ('history') {
            <app-splitz-history />
          }
          @default {
            <app-splitz-balances />
          }
        }
      </div>
    </app-sheet>
  `,
})
export class SplitzesModalComponent {
  private readonly transactionService = inject(TransactionService);
  readonly close = output<void>();

  readonly isAdmin = inject(AuthService).isAdmin;
  readonly pendingQuery = this.transactionService.getPendingTransactionsQuery();
  // Everything listed under Incoming, including requests still with the kiosk.
  // (The app icon badge counts only what needs the admin's attention.)
  readonly incomingCount = computed(() =>
    this.isAdmin() ? (this.pendingQuery.data()?.length ?? 0) : 0,
  );

  // Always opens on Balances; pending items show as a count badge on the Incoming tab.
  readonly activeTab = signal<SplitzesTab>('balances');

  selectTab(tab: SplitzesTab): void {
    this.activeTab.set(tab);
  }
}
