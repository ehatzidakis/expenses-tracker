import { Injectable, Injector, inject } from '@angular/core';
import type { SplitzesTab } from '../components/splitzes-modal.component/splitzes-tabs.component';
import { ExpenseStateService } from './expense-state.service';

/** Goes to the Splitz tab on a chosen inner tab, e.g. Incoming from the month panel. */
@Injectable({ providedIn: 'root' })
export class SplitzesLauncher {
  // Looked up on use, so components that only read the next tab don't create the app state.
  private readonly injector = inject(Injector);
  private nextTab: SplitzesTab | null = null;

  open(tab: SplitzesTab = 'balances'): void {
    this.nextTab = tab;
    this.injector.get(ExpenseStateService).setActiveTab('splitz');
  }

  /** The tab Splitz should open on, once; Balances by default. */
  take(): SplitzesTab {
    const tab = this.nextTab ?? 'balances';
    this.nextTab = null;
    return tab;
  }
}
