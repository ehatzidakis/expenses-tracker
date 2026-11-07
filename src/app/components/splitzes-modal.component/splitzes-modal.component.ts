import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction-service';
import { SplitzBalancesComponent } from './splitz-balances.component';
import { SplitzHistoryComponent } from './splitz-history.component';
import { SplitzIncomingComponent } from './splitz-incoming.component';
import { SplitzesTab, SplitzesTabsComponent } from './splitzes-tabs.component';
import { SplitzesLauncher } from '../../services/splitzes-launcher.service';

/** The Splitz tab: balances with each person, items waiting for review, and settled history. */
@Component({
  selector: 'app-splitzes-page',
  standalone: true,
  host: { class: 'block' },
  imports: [
    SplitzBalancesComponent,
    SplitzHistoryComponent,
    SplitzIncomingComponent,
    SplitzesTabsComponent,
  ],
  template: `
    <section aria-labelledby="splitzes-heading">
      <h1 id="splitzes-heading" class="type-wide text-[18px] font-semibold text-ink">Splitzes</h1>
      <p class="mt-1 text-[13px] text-ink-2">Who owes whom, and what's waiting for you</p>

      <div class="mt-4 flex flex-col gap-5">
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
    </section>
  `,
})
export class SplitzesPageComponent {
  private readonly transactionService = inject(TransactionService);

  readonly isAdmin = inject(AuthService).isAdmin;
  readonly pendingQuery = this.transactionService.getPendingTransactionsQuery();
  // Everything listed under Incoming, including requests still with the kiosk.
  // (The app icon badge counts only what needs the admin's attention.)
  readonly incomingCount = computed(() =>
    this.isAdmin() ? (this.pendingQuery.data()?.length ?? 0) : 0,
  );

  /** Balances from the tab bar; Incoming from the month panel's review line. */
  readonly activeTab = signal<SplitzesTab>(inject(SplitzesLauncher).take());

  selectTab(tab: SplitzesTab): void {
    this.activeTab.set(tab);
  }
}
