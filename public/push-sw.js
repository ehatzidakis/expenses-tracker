// The app's service worker. Angular's worker does everything (caching, updates, showing
// notifications). This file only adds the red count badge on the Home Screen icon, which
// has to be raised here because the app itself isn't running when a push arrives.
importScripts('./ngsw-worker.js');

// Shared with PendingBadgeService in the app. "dirty" tells the app a push arrived since it
// last looked, so it reloads the pending list instead of trusting its cache.
const BADGE_CACHE = 'app-badge';
const BADGE_KEY = '/__app-badge';

self.addEventListener('push', (event) => {
  let kind;
  try {
    kind = event.data?.json()?.notification?.data?.kind;
  } catch {
    return;
  }
  if (kind === 'pending') {
    event.waitUntil(bumpBadge());
  }
});

async function bumpBadge() {
  const cache = await caches.open(BADGE_CACHE);
  const saved = await cache.match(BADGE_KEY);
  const state = saved ? await saved.json().catch(() => ({})) : {};
  const count = (Number(state.count) || 0) + 1;

  await cache.put(BADGE_KEY, new Response(JSON.stringify({ count, dirty: true })));
  if ('setAppBadge' in self.navigator) {
    await self.navigator.setAppBadge(count);
  }
}
