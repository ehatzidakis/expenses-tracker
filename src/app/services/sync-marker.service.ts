import { Injectable, Injector, effect, inject } from '@angular/core';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { db } from '../firebase.config';
import { AuthService } from './auth.service';
import { QueryPersistenceService, isPersistedQuery } from './query-persistence';

const MARKER_PATH = ['meta', 'sync'] as const;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Lets a device keep its cache for a long time and still notice saves made on other devices.
 *
 * Every save writes a new random token to meta/sync. On launch and when the app comes back
 * to the foreground (at most every 5 minutes), the device reads that one document. If the
 * token differs from the one its cache is up to date with, it refreshes the cached queries.
 * Tokens are compared for equality, so device clocks don't matter.
 */
@Injectable({ providedIn: 'root' })
export class SyncMarkerService {
  private readonly queryClient = inject(QueryClient);
  private readonly persistence = inject(QueryPersistenceService);
  private readonly authService = inject(AuthService);
  // Kept so watch() can create its effect after an await, outside an injection context.
  private readonly injector = inject(Injector);
  private lastCheckAt = 0;
  private checking = false;

  /** Starts checking for saves made elsewhere. Call once, after the cache is restored. */
  watch(): void {
    effect(
      () => {
        if (this.authService.user()) void this.checkForRemoteChanges(true);
      },
      { injector: this.injector },
    );
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.authService.user()) {
        void this.checkForRemoteChanges();
      }
    });
  }

  /**
   * Records that this device just saved something. Call after the save succeeds.
   * Never throws: a failed marker write must not turn a successful save into an error.
   */
  async bump(): Promise<void> {
    const token = newToken();
    this.persistence.syncToken = token;
    try {
      await setDoc(doc(db, ...MARKER_PATH), { token, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.warn(
        'Could not update the sync marker (check the Firestore rules for meta/sync):',
        error,
      );
    }
  }

  async checkForRemoteChanges(force = false): Promise<void> {
    if (this.checking || (!force && Date.now() - this.lastCheckAt < CHECK_INTERVAL_MS)) return;
    this.checking = true;
    this.lastCheckAt = Date.now();
    try {
      const snapshot = await getDoc(doc(db, ...MARKER_PATH));
      const token = (snapshot.data()?.['token'] as string | undefined) ?? null;
      if (token === this.persistence.syncToken) return;

      this.persistence.syncToken = token;
      // Queries already fetching are getting fresh data anyway; refetching them would pay twice.
      await this.queryClient.invalidateQueries({
        predicate: (query) => isPersistedQuery(query) && query.state.fetchStatus !== 'fetching',
      });
      this.persistence.scheduleSave();
    } catch (error) {
      console.warn('Could not check for changes from other devices:', error);
    } finally {
      this.checking = false;
    }
  }
}

function newToken(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
