import { Injectable, signal } from '@angular/core';
import type { SplitzesTab } from '../components/splitzes-modal.component/splitzes-tabs.component';

/** Opens the Splitzes sheet from anywhere (the header button, the month panel) on a chosen tab. */
@Injectable({ providedIn: 'root' })
export class SplitzesLauncher {
  readonly openTab = signal<SplitzesTab | null>(null);

  open(tab: SplitzesTab = 'balances'): void {
    this.openTab.set(tab);
  }

  close(): void {
    this.openTab.set(null);
  }
}
