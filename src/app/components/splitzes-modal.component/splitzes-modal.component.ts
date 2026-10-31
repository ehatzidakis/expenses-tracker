import { Component, computed, inject, output, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction-service';
import { isAwaitingKiosk } from './pending-review.model';
import { SplitzBalancesComponent } from './splitz-balances.component';
import { SplitzHistoryComponent } from './splitz-history.component';
import { SplitzIncomingComponent } from './splitz-incoming.component';
import { SplitzesModalHeaderComponent } from './splitzes-modal-header.component';
import { SplitzesTab, SplitzesTabsComponent } from './splitzes-tabs.component';

@Component({
  selector: 'app-splitzes-modal',
  standalone: true,
  imports: [
    SplitzBalancesComponent,
    SplitzHistoryComponent,
    SplitzIncomingComponent,
    SplitzesModalHeaderComponent,
    SplitzesTabsComponent,
  ],
  template: `
    <div
      class="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center overflow-hidden"
      (click)="close.emit()"
    >
      <div
        class="w-full max-w-md max-h-[85vh] overflow-y-auto bg-gray-900 border border-gray-800/80 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl text-gray-100"
        (click)="$event.stopPropagation()"
      >
        <app-splitzes-modal-header (close)="close.emit()" />

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
    </div>
  `,
})
export class SplitzesModalComponent {
  private readonly transactionService = inject(TransactionService);
  readonly close = output<void>();

  readonly isAdmin = inject(AuthService).isAdmin;
  readonly pendingQuery = this.transactionService.getPendingTransactionsQuery();
  // Requests still with the kiosk aren't waiting for the admin, so they don't count.
  readonly incomingCount = computed(() =>
    this.isAdmin() ? (this.pendingQuery.data() ?? []).filter((p) => !isAwaitingKiosk(p)).length : 0,
  );

  // Always opens on Balances; pending items show as a count badge on the Incoming tab.
  readonly activeTab = signal<SplitzesTab>('balances');

  selectTab(tab: SplitzesTab): void {
    this.activeTab.set(tab);
  }
}
