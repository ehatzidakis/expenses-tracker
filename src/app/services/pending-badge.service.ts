import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { QueryClient } from '@tanstack/angular-query-experimental';
import {
  PENDING_STALE_TIME,
  TransactionService,
  type PendingTransaction,
} from './transaction-service';

// Shared with public/push-sw.js, which bumps the count when a push arrives.
const BADGE_CACHE = 'app-badge';
const BADGE_KEY = '/__app-badge';

interface BadgeState {
  count: number;
  // True when a push arrived since the app last checked, so the cached list is out of date.
  dirty: boolean;
}

type BadgeNavigator = Navigator & {
  setAppBadge(count?: number): Promise<void>;
  clearAppBadge(): Promise<void>;
};

/** Kiosk items waiting for review. The admin's own scheduled items don't count. */
export function countKioskPending(pending: PendingTransaction[] | undefined): number {
  return pending?.filter((item) => item.sourceRole === 'kiosk').length ?? 0;
}

/**
 * Keeps the red badge on the Home Screen icon equal to the number of kiosk items
 * waiting for review. Admin only.
 */
@Injectable({ providedIn: 'root' })
export class PendingBadgeService {
  private readonly queryClient = inject(QueryClient);
  private readonly transactionService = inject(TransactionService);
  private readonly swPush = inject(SwPush, { optional: true });
  private started = false;

  start(): void {
    if (this.started || !supportsBadge()) return;
    this.started = true;

    // Whenever the pending list loads or changes (accept, decline, refresh), match it.
    this.queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.action.type === 'success' &&
        event.query.queryKey[0] === 'pendingTransactions'
      ) {
        void this.show(countKioskPending(event.query.state.data as PendingTransaction[]));
      }
    });

    // Coming back to the app, or a push arriving while it's open.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void this.refresh();
    });
    this.swPush?.messages.subscribe(() => void this.refresh());

    void this.refresh();
  }

  private async refresh(): Promise<void> {
    try {
      if ((await readState()).dirty) {
        await this.queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] });
      }
      const pending = await this.queryClient.fetchQuery({
        queryKey: ['pendingTransactions'],
        queryFn: () => this.transactionService.fetchPendingTransactions(),
        staleTime: PENDING_STALE_TIME,
      });
      await this.show(countKioskPending(pending));
    } catch (error) {
      console.warn('Could not update the app badge:', error);
    }
  }

  private async show(count: number): Promise<void> {
    const nav = navigator as BadgeNavigator;
    await (count > 0 ? nav.setAppBadge(count) : nav.clearAppBadge()).catch(() => undefined);
    await writeState({ count, dirty: false });
  }
}

function supportsBadge(): boolean {
  return 'setAppBadge' in navigator && typeof caches !== 'undefined';
}

async function readState(): Promise<BadgeState> {
  const saved = await (await caches.open(BADGE_CACHE)).match(BADGE_KEY);
  const state = saved ? ((await saved.json().catch(() => ({}))) as Partial<BadgeState>) : {};
  return { count: Number(state.count) || 0, dirty: state.dirty === true };
}

async function writeState(state: BadgeState): Promise<void> {
  await (await caches.open(BADGE_CACHE)).put(BADGE_KEY, new Response(JSON.stringify(state)));
}
