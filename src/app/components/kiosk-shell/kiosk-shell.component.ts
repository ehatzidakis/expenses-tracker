import { Component, computed, inject, signal } from '@angular/core';
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

  readonly activeTab = signal<KioskTab>(readInitialKioskTab());
  readonly showNotifications = signal(false);
  readonly requestCount = computed(() => this.requestsQuery.data()?.length ?? 0);

  signOut(): Promise<void> {
    return this.authService.signOut();
  }
}

/** Tapping a request notification opens `/?tab=requests`. Read it once, then tidy the URL. */
export function readInitialKioskTab(): KioskTab {
  if (typeof window === 'undefined') return 'new';
  const url = new URL(window.location.href);
  if (url.searchParams.get('tab') !== 'requests') return 'new';

  url.searchParams.delete('tab');
  history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  return 'requests';
}
