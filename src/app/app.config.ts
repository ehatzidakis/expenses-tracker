import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
// import { withDevtools } from '@tanstack/angular-query-experimental/devtools';
import { provideServiceWorker } from '@angular/service-worker';
import { QueryPersistenceService } from './services/query-persistence';
import { SyncMarkerService } from './services/sync-marker.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideTanStackQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            // Data only changes when someone saves. Saves on this device refresh the cache
            // straight away, and SyncMarkerService refreshes it after saves on other devices.
            // Queries that change outside those saves set a shorter staleTime themselves.
            staleTime: 1000 * 60 * 60 * 24, // 24 hours
          },
        },
      }),
      // withDevtools(() => ({ loadDevtools: 'auto' })),
    ),
    // Restore the saved cache before any query runs, then start watching for remote changes.
    provideAppInitializer(async () => {
      const persistence = inject(QueryPersistenceService);
      const syncMarker = inject(SyncMarkerService);
      await persistence.restore();
      syncMarker.watch();
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerImmediately',
    }),
  ],
};
