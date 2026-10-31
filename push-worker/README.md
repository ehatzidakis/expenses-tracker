# Push worker

A small Cloudflare Worker that sends push notifications between the admin and the kiosk. Firebase stays as it is. This only delivers notifications.

```
Kiosk saves pending transaction ──► Firestore (as before)
                                └─► POST /notify  ──► Apple push ──► admin's phone
Admin sends a request          ──► Firestore
                                └─► POST /request ──► Apple push ──► kiosk's phone
```

## Routes

"Known users" are `ADMIN_UID` and the kiosk accounts in `NOTIFY_UIDS`. Everyone else gets 403.

| Route | Who | What |
|---|---|---|
| `GET /` | anyone | Health check |
| `GET /vapid-public-key` | anyone | Public push key the app needs to subscribe |
| `POST /subscribe` | known users | Saves this phone's push subscription under the caller |
| `POST /unsubscribe` | known users | Removes it (only your own, unless you're admin) |
| `POST /test` | known users | Sends a test notification to the caller's own phones |
| `POST /notify` | known users | To the admin: "New pending transaction", or "Kiosk couldn't fill a request" with `type: 'request-declined'` |
| `POST /request` | admin | To the kiosk: "New request". Tapping opens the Requests tab (via `public/push-sw.js`) |

Every POST needs `Authorization: Bearer <Firebase ID token>`. The Worker checks the token against Google's public keys, so nobody else can subscribe or send notifications.

Pushes carry `data.kind` (`pending`, `request` or `test`). The app's service worker (`public/push-sw.js`) raises the Home Screen badge for `pending` and `request`.

## Config

- `wrangler.jsonc` holds public settings (`vars`) and the storage binding.
- The private push key is a Cloudflare secret. Locally it lives in `.dev.vars`, which is git-ignored. **Don't lose it and don't commit it.** If it's lost, run `npm run vapid-keys` again and every phone has to re-enable notifications.

## First-time setup

Run these from this folder (`push-worker/`):

```bash
npx wrangler login                                # opens the browser, free Cloudflare account
npx wrangler kv namespace create SUBSCRIPTIONS    # paste the printed id into wrangler.jsonc
npm run deploy                                    # prints the Worker URL
npx wrangler secret bulk .dev.vars                # uploads the private push key
```

Then open `https://expenses-push.<your-subdomain>.workers.dev/` in a browser. It should show `{"ok":true}`.

## Changing things later

- Edit `src/index.ts` or `wrangler.jsonc`, then `npm run deploy`.
- After editing `wrangler.jsonc`, run `npm run types` to refresh the TypeScript types.
- Logs: `npx wrangler tail`, or the Cloudflare dashboard → Workers → expenses-push → Logs.

## Cost

Free plan: 100,000 requests a day and 1,000 storage writes a day. This app uses a handful.
