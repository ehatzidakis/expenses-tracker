# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: the owner (admin role).** One person tracking their own household spending. They log expenses, watch the month against category budgets and their wage, review what others submitted, and settle shared costs.
- **Secondary: one kiosk user (Stavi).** Uses a reduced kiosk shell (`src/app/components/kiosk-shell/`) to submit shared expenses into the pending queue, see their balance, and answer requests the admin sends them.
- **Split contacts without accounts.** Harry and Alex (and Stavi) appear in `PEOPLE` (`src/app/models/splitz.model.ts`) as people costs can be split with. They never open the app.

The current setup is the owner plus one kiosk user. Whether more admins or kiosk users will ever be added is undecided (see `docs/backlog.md`, "Decisions needed").

## Product Purpose

A private, installable expenses tracker for one household. Its main job is helping the owner **stay on budget each month**: see where the current month stands against per-category budgets and the month's wage, and how much is being saved. Logging, one-offs and trips, and splitting costs all serve that monthly picture.

Success: at any moment the owner can open the app and trust what it says about this month: spent, remaining per category, and saved.

## Positioning

Built around one household's real routine rather than generic finance software: fixed category set, monthly wage-based saving, a kiosk role so a second person can feed shared costs into the owner's review queue, and splitting with a known, small circle of people. It is not a bank-sync or multi-tenant product.

## Operating Context

- Used mostly as the installed home-screen PWA on iPhone, at home and in private.
- Mobile-first, single-column layout; larger screens are a secondary concern.
- Admin navigation is five tabs: Monthly, SumUp, Create, OneOffs, Charts. Settings and Splitzes open as modals.
- The kiosk user submits from their own phone; items land in Pending review for the admin to accept, edit or decline. The admin can also send requests to the kiosk.
- Push notifications go through a Cloudflare Worker (`push-worker/`) so the phones get notified of kiosk submissions and requests; the Home Screen badge shows the pending count.
- Deployed on Vercel; data in Firebase (Firestore lite SDK, Auth).

## Capabilities and Constraints

- **Money:** euros, shown as `€` with two decimals.
- **Categories:** a fixed set stored as counters on one document per month (Supermarket, Medical, Personal, EatingOut, Utilities, Takeaway, Tickets, Gaming, Cats, Travel, Subscriptions, Gym), plus `TotalWage`.
- **Terminology used in the product:** transactions; one-offs and trips (stored as "adjustments"; trips can be open or closed for new transactions); Splitzes (split debts and settlements); Pending review (queue of kiosk submissions and out-of-month admin entries); kiosk; requests (admin to kiosk); stealth mode (hides amounts, optional passcode); budgets; wage; saved.
- **Stack:** Angular 22 standalone components, signals, zoneless; TanStack Query; Tailwind 4; Vitest. No Angular Router: tabs are a signal.
- **Roles:** admin is a hard-coded UID; everyone else is kiosk. Access control is currently client-side (backlog FIX-6).
- **Data safety:** a local dev server talks to the production Firestore project; do not submit, accept, settle, save or delete while testing manually until backlog PLAT-1 lands.
- **Open product decisions** (from `docs/backlog.md`): scheduled posting approach; offline/realtime strategy; whether stealth mode is a privacy toggle or a real lock; whether future-dated purchases count in purchase month or event month; whether budgets are versioned per month.

## Brand Commitments

- Name: "Expenses Tracker" (manifest: "expenses tracker", short name "expenses").
- App icons and favicons exist in `public/icons/` and `public/assets/`.
- No voice, tagline or wider brand identity has been defined.

## Evidence on Hand

- Real personal financial data lives in production Firestore; it must not be copied into docs, screenshots for sharing, or design fixtures.
- `docs/backlog.md` holds a reviewed list of fixes, features and open decisions.
- There are no users beyond the household, no testimonials, and no marketing material. Do not invent any.

## Product Principles

1. **The month is the unit.** Every screen should make it easy to answer "how am I doing this month?" before anything else.
2. **Numbers must be trustworthy.** Correct totals, correct current month, and clear distinction between pending, planned and posted money outrank new features.
3. **Logging stays quick.** Entry on a phone should take seconds, because a missing transaction breaks the monthly picture.
4. **Two roles, one record.** The kiosk user contributes; the owner reviews and owns the books. Keep that hand-off clear on both sides.
5. **Private by default.** This is personal financial data for one household; nothing leaks into shared artifacts.
