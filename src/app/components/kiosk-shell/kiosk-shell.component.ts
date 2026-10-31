import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction-service';
import { CreateTransactionComponent } from '../create-transaction.component/create-transaction.component';
import { NotificationSettingComponent } from '../settings-modal.component/notification-setting.component';
import { KioskRequestsComponent } from './kiosk-requests.component';
import { KioskTab, KioskTabBarComponent } from './kiosk-tab-bar.component';

/** Everything the kiosk user sees: header, the New/Requests tabs, and notification settings. */
@Component({
  selector: 'app-kiosk-shell',
  standalone: true,
  imports: [
    CreateTransactionComponent,
    KioskRequestsComponent,
    KioskTabBarComponent,
    NotificationSettingComponent,
  ],
  host: { class: 'block' },
  template: `
    <main
      class="min-h-screen bg-gray-950 text-gray-100 p-4 pb-28 max-w-md mx-auto md:max-w-3xl md:p-8 md:pb-28 flex flex-col gap-4"
    >
      <header class="flex items-center justify-between pt-2">
        <div class="flex items-center gap-3">
          <img src="assets/favicon.svg" alt="Logo" class="w-10 h-10" />
          <div>
            <h1 class="text-xl font-bold tracking-tight text-white">Expenses Tracker</h1>
            <p class="text-xs text-gray-400">Kiosk mode</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="showNotifications.set(true)"
            aria-label="Notification settings"
            title="Notifications"
            class="h-9 w-9 flex items-center justify-center rounded-full border border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-600 transition-colors cursor-pointer"
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
            class="px-3 py-2 rounded-full border border-gray-700 bg-gray-900 text-xs font-medium text-gray-200 hover:border-gray-600 transition-colors cursor-pointer"
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
      <div
        class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        (click)="showNotifications.set(false)"
      >
        <div
          role="dialog"
          aria-label="Notifications"
          class="bg-gray-900 border border-gray-800 rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4 text-gray-100"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-white">Notifications</h2>
            <button
              type="button"
              (click)="showNotifications.set(false)"
              aria-label="Close"
              class="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <app-notification-setting />
        </div>
      </div>
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
