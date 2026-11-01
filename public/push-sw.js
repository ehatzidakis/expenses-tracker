// The app's service worker. Angular's worker does everything (caching, updates, showing
// notifications). This file adds two things the app can't do itself, because it isn't
// running when a push arrives: the red count badge on the Home Screen icon, and
// remembering which screen a tapped notification should open.
importScripts('./ngsw-worker.js');

// Shared with PendingBadgeService in the app. "dirty" tells the app a push arrived since it
// last looked, so it reloads the pending list instead of trusting its cache.
const BADGE_CACHE = 'app-badge';
const BADGE_KEY = '/__app-badge';
// Shared with KioskShellComponent.
const OPEN_TAB_KEY = '/__open-tab';

// Every notification opens the app at '/'. Opening a different address (like '/?tab=requests')
// left the kiosk iPhone on a blank screen, so the wanted tab is passed through the cache instead.
self.addEventListener('notificationclick', (event) => {
  if (event.notification?.data?.kind === 'request') {
    event.waitUntil(saveOpenTab('requests'));
  }
});

async function saveOpenTab(tab) {
  const cache = await caches.open(BADGE_CACHE);
  await cache.put(OPEN_TAB_KEY, new Response(JSON.stringify({ tab, at: Date.now() })));
}

self.addEventListener('push', (event) => {
  let kind;
  try {
    kind = event.data?.json()?.notification?.data?.kind;
  } catch {
    return;
  }
  // 'pending' reaches the admin, 'request' reaches the kiosk. Test pushes don't count.
  if (kind === 'pending' || kind === 'request') {
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
