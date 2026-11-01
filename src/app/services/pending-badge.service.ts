import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { needsAdminAttention } from '../components/splitzes-modal.component/pending-review.model';
import type { UserRole } from './auth.service';
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

/**
 * Admin: what needs their attention (kiosk submissions and replies, declined requests).
 * Their own scheduled items and requests still with the kiosk don't count.
 */
export function countAdminBadge(pending: PendingTransaction[] | undefined): number {
  return pending?.filter(needsAdminAttention).length ?? 0;
}

interface BadgeSource {
  queryKey: string;
  fetch: () => Promise<PendingTransaction[]>;
  count: (items: PendingTransaction[] | undefined) => number;
}

/**
 * Keeps the red badge on the Home Screen icon equal to what's waiting for this user:
 * items to review for the admin, requests to fill in for the kiosk.
 */
@Injectable({ providedIn: 'root' })
export class PendingBadgeService {
  private readonly queryClient = inject(QueryClient);
  private readonly transactionService = inject(TransactionService);
  private readonly swPush = inject(SwPush, { optional: true });
  private source: BadgeSource | null = null;

  start(role: UserRole): void {
    if (this.source || !supportsBadge()) return;
    this.source =
      role === 'admin'
        ? {
            queryKey: 'pendingTransactions',
            fetch: () => this.transactionService.fetchPendingTransactions(),
            count: countAdminBadge,
          }
        : {
            queryKey: 'kioskRequests',
            fetch: () => this.transactionService.fetchKioskRequests(),
            count: (items) => items?.length ?? 0,
          };
    const source = this.source;

    // Whenever the list loads or changes (accept, decline, send back, refresh), match it.
    this.queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.action.type === 'success' &&
        event.query.queryKey[0] === source.queryKey
      ) {
        void this.show(source.count(event.query.state.data as PendingTransaction[]));
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
    const source = this.source;
    if (!source) return;

    try {
      if ((await readState()).dirty) {
        await this.queryClient.invalidateQueries({ queryKey: [source.queryKey] });
      }
      const items = await this.queryClient.fetchQuery({
        queryKey: [source.queryKey],
        queryFn: source.fetch,
        staleTime: PENDING_STALE_TIME,
      });
      await this.show(source.count(items));
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
