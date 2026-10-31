import { Injectable, computed, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import type { NewTransactionInput } from './transaction-service';

// The Cloudflare Worker that sends the pushes (see push-worker/). Nothing here is secret.
export const PUSH_WORKER_URL = 'https://expenses-push.expenses-push-worker.workers.dev';
export const VAPID_PUBLIC_KEY =
  'BFv6qGseP-QTdp6SpOsHFvwuuZHfKW73P600TetFgYSaf8aG6pC4GXnnaPwxf2noVk7w_2bnAb4Q7u9t6Tm71Eg';

/**
 * - `needs-install`: iPhone/iPad in a Safari tab. Push only works from the Home Screen app.
 * - `unsupported`: no service worker (dev build) or the browser can't do push.
 * - `blocked`: the user said no. Only the system settings can undo that.
 */
export type PushStatus = 'needs-install' | 'unsupported' | 'blocked' | 'off' | 'on';

export interface PushSendResult {
  sent: number;
  removed: number;
  failed: number;
}

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  // Optional so tests and dev builds (no service worker) still work.
  private readonly swPush = inject(SwPush, { optional: true });
  private readonly authService = inject(AuthService);

  private readonly subscribed = signal(false);
  private readonly permission = signal(readPermission());

  readonly status = computed<PushStatus>(() => {
    if (isAppleMobile() && !isStandalone()) return 'needs-install';
    if (!this.swPush?.isEnabled || !('PushManager' in globalThis)) return 'unsupported';
    if (this.permission() === 'denied') return 'blocked';
    return this.subscribed() ? 'on' : 'off';
  });

  constructor() {
    this.swPush?.subscription.subscribe((subscription) => this.subscribed.set(!!subscription));
  }

  /** Must be called straight from a tap: iOS only shows the permission prompt then. */
  async enable(): Promise<void> {
    if (!this.swPush?.isEnabled) throw new Error('Notifications are not available here.');

    let subscription: PushSubscription;
    try {
      // No await before this line, or iOS treats it as not coming from a tap.
      subscription = await this.swPush.requestSubscription({ serverPublicKey: VAPID_PUBLIC_KEY });
    } finally {
      this.permission.set(readPermission());
    }

    try {
      await this.post('/subscribe', { subscription: subscription.toJSON() });
    } catch (error) {
      // The server doesn't know this phone, so don't leave it looking switched on.
      await this.swPush.unsubscribe().catch(() => undefined);
      throw error;
    }
  }

  async disable(): Promise<void> {
    if (!this.swPush?.isEnabled) return;

    const subscription = await firstValueFrom(this.swPush.subscription);
    if (subscription) {
      // If this fails the Worker drops the subscription on its own the next time it sends.
      await this.post('/unsubscribe', { endpoint: subscription.endpoint }).catch((error) =>
        console.warn('Could not remove push subscription from the server:', error),
      );
    }
    await this.swPush.unsubscribe();
  }

  sendTest(): Promise<PushSendResult> {
    return this.post<PushSendResult>('/test', {});
  }

  // The notify methods below never throw: the data is already saved, and a missed
  // notification shouldn't look like a failed save.

  /** Kiosk → admin: a new kiosk submission, or a request sent back filled in. */
  notifyNewPending(item: NotificationItem): Promise<void> {
    return this.notify('/notify', { body: summarize(item) });
  }

  /** Kiosk → admin: a request the kiosk couldn't fill, with the reason. */
  notifyRequestDeclined(item: NotificationItem, reason: string): Promise<void> {
    const body = [summarize({ ...item, amount: 0 }), reason.trim()].filter(Boolean).join(' — ');
    return this.notify('/notify', { type: 'request-declined', body });
  }

  /** Admin → kiosk: a new request to fill in. The amount is left out when it's 0. */
  notifyKioskRequest(item: NotificationItem): Promise<void> {
    return this.notify('/request', { body: summarize(item) });
  }

  private async notify(path: string, body: unknown): Promise<void> {
    try {
      await this.post(path, body);
    } catch (error) {
      console.warn('Could not send the notification:', error);
    }
  }

  private async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const token = await this.authService.user()?.getIdToken();
    if (!token) throw new Error('You are signed out. Please sign in again.');

    const response = await fetch(PUSH_WORKER_URL + path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? `Notification server error (${response.status}).`);
    }
    return data as T;
  }
}

type NotificationItem = Pick<NewTransactionInput, 'amount' | 'description' | 'category'>;

/** "€12.50 · Lidl · Supermarket". A 0 amount (not filled in yet) is left out. */
function summarize(item: NotificationItem): string {
  const amount = item.amount > 0 ? `€${item.amount.toFixed(2)}` : '';
  return [amount, item.description, item.category]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' · ');
}

function readPermission(): NotificationPermission {
  return typeof Notification === 'undefined' ? 'default' : Notification.permission;
}

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || globalThis.matchMedia?.('(display-mode: standalone)').matches;
}

function isAppleMobile(): boolean {
  // iPadOS reports itself as a Mac, so also check for touch.
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  );
}
