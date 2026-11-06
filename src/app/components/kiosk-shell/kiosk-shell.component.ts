import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction-service';
import { CreateTransactionComponent } from '../create-transaction.component/create-transaction.component';
import { NotificationSettingComponent } from '../settings-modal.component/notification-setting.component';
import { KioskRequestsComponent } from './kiosk-requests.component';
import { KioskTab, KioskTabBarComponent } from './kiosk-tab-bar.component';
import { SheetComponent } from '../sheet/sheet';

/** Everything the kiosk user sees: header, the New/Requests tabs, and notification settings. */
@Component({
  selector: 'app-kiosk-shell',
  standalone: true,
  imports: [SheetComponent, 
    CreateTransactionComponent,
    KioskRequestsComponent,
    KioskTabBarComponent,
    NotificationSettingComponent,
  ],
  host: { class: 'block' },
  template: `
    <main
      class="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-4 pt-[max(env(safe-area-inset-top),8px)] pb-[calc(env(safe-area-inset-bottom)+92px)]"
    >
      <header class="flex min-h-14 items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <img src="assets/favicon.svg" alt="" class="size-7" />
          <h1 class="type-wide text-[17px] font-bold uppercase tracking-[0.02em] text-ink">Expenses</h1>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="showNotifications.set(true)"
            aria-label="Notification settings"
            title="Notifications"
            class="size-11 flex items-center justify-center rounded-full border border-edge bg-raised text-ink-2 hover:text-ink transition-colors cursor-pointer"
          >
            <svg
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </button>
          <button
            type="button"
            (click)="signOut()"
            class="min-h-11 px-3.5 rounded-xl border border-edge text-[13px] font-medium text-ink-2 hover:border-ink-4 hover:text-ink transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      @if (activeTab() === 'new') {
        <app-create-transaction />
      } @else {
        <app-kiosk-requests />
      }
    </main>

    <app-kiosk-tab-bar
      [activeTab]="activeTab()"
      [requestCount]="requestCount()"
      (tabChange)="activeTab.set($event)"
    />

    @if (showNotifications()) {
      <app-sheet label="Notifications" (closed)="showNotifications.set(false)">
        <h2 class="type-wide text-[18px] font-semibold text-ink">Notifications</h2>
        <div class="mt-2 border-y border-ink/10">
          <app-notification-setting label="New request alerts" />
        </div>
      </app-sheet>
    }
  `,
})
export class KioskShellComponent {
  private readonly authService = inject(AuthService);
  private readonly requestsQuery = inject(TransactionService).getKioskRequestsQuery();

  readonly activeTab = signal<KioskTab>('new');
  readonly showNotifications = signal(false);
  readonly requestCount = computed(() => this.requestsQuery.data()?.length ?? 0);

  constructor() {
    // Tapping a request notification opens (or reloads) the app. Also check when it comes
    // back to the front, in case the phone just focused the open app.
    const openFromNotification = () =>
      void takeOpenTab().then((tab) => tab && this.activeTab.set(tab));
    const onVisible = () => document.visibilityState === 'visible' && openFromNotification();

    openFromNotification();
    document.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
  }

  signOut(): Promise<void> {
    return this.authService.signOut();
  }
}

// Written by public/push-sw.js when a request notification is tapped.
const OPEN_TAB_CACHE = 'app-badge';
const OPEN_TAB_KEY = '/__open-tab';
const OPEN_TAB_MAX_AGE = 2 * 60 * 1000;

/** Reads and clears the tab a tapped notification asked for. Old taps are ignored. */
export async function takeOpenTab(now = Date.now()): Promise<KioskTab | null> {
  if (typeof caches === 'undefined') return null;
  try {
    const cache = await caches.open(OPEN_TAB_CACHE);
    const saved = await cache.match(OPEN_TAB_KEY);
    if (!saved) return null;
    await cache.delete(OPEN_TAB_KEY);

    const { tab, at } = (await saved.json()) as { tab?: string; at?: number };
    const fresh = typeof at === 'number' && now - at < OPEN_TAB_MAX_AGE;
    return fresh && tab === 'requests' ? 'requests' : null;
  } catch {
    return null;
  }
}
