import { Injectable, inject } from '@angular/core';
import {
  QueryClient,
  dehydrate,
  hydrate,
  type DehydratedState,
  type Query,
} from '@tanstack/angular-query-experimental';
import { del, get, set } from 'idb-keyval';
import { APP_VERSION } from '../../environments/version';

const STORAGE_KEY = 'query-cache';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SAVE_DELAY_MS = 1000;

/**
 * Queries kept on the device between launches. These only change when someone saves, and
 * SyncMarkerService refreshes them when a save happened on another device.
 * pendingTransactions is left out on purpose: kiosk users add those from other devices.
 */
const PERSISTED_QUERY_ROOTS = new Set([
  'expenses',
  'adjustments',
  'splitTransactions',
  'splitzSettlementHistory',
]);

export function isPersistedQuery(query: Query): boolean {
  return PERSISTED_QUERY_ROOTS.has(String(query.queryKey[0]));
}

interface PersistedCache {
  /** App version that wrote the cache; a new deploy starts fresh. */
  version: string;
  savedAt: number;
  /** The last change marker this cache is up to date with (see SyncMarkerService). */
  syncToken: string | null;
  state: DehydratedState;
}

/**
 * Saves the query cache to IndexedDB so a relaunch (iOS often kills a backgrounded PWA)
 * shows the last data instantly instead of reading everything from Firestore again.
 * IndexedDB stores objects as they are, so Date fields such as Adjustment.startDate survive.
 * Best effort: if storage is unavailable or cleared, the app just fetches as normal.
 */
@Injectable({ providedIn: 'root' })
export class QueryPersistenceService {
  private readonly queryClient = inject(QueryClient);
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  /** Change marker the in-memory cache is up to date with. Saved together with the cache. */
  syncToken: string | null = null;

  /** Restores the saved cache, then keeps saving it. Runs once before the app starts. */
  async restore(): Promise<void> {
    try {
      const cached = await get<PersistedCache>(STORAGE_KEY);
      if (cached?.version === APP_VERSION && Date.now() - cached.savedAt < MAX_AGE_MS) {
        hydrate(this.queryClient, cached.state);
        this.syncToken = cached.syncToken;
      } else if (cached) {
        await del(STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Could not restore the saved query cache:', error);
    }

    this.queryClient.getQueryCache().subscribe((event) => {
      if (isPersistedQuery(event.query)) this.scheduleSave();
    });
    // iOS can kill a PWA in the background without firing pagehide, so save on hide.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void this.save();
    });
  }

  scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.save();
    }, SAVE_DELAY_MS);
  }

  async save(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    const state = dehydrate(this.queryClient, {
      shouldDehydrateQuery: (query) => isPersistedQuery(query) && query.state.status === 'success',
    });
    const cache: PersistedCache = {
      version: APP_VERSION,
      savedAt: Date.now(),
      syncToken: this.syncToken,
      state,
    };
    try {
      await set(STORAGE_KEY, cache);
    } catch (error) {
      console.warn('Could not save the query cache:', error);
    }
  }

  /** Forgets everything, in memory and on the device. Used on sign-out. */
  async clear(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.queryClient.clear();
    this.syncToken = null;
    try {
      await del(STORAGE_KEY);
    } catch (error) {
      console.warn('Could not delete the saved query cache:', error);
    }
  }
}
