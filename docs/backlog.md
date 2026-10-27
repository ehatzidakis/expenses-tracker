# Expenses Tracker - Improvement Backlog

Reviewed on 2026-09-30 against build `vd8109ad-dirty`. The running app was explored read-only on a mobile viewport (Monthly, SumUp including the Month view, Create including the split, one-off and trip toggles, OneOffs, Charts, Splitzes including Pending review, Settings) and cross-checked against the source. No data was written during the review.

Evidence tags used below:

- **App** - observed in the running app.
- **Code** - taken from reading the source (static analysis). Confirm with a failing test before fixing.

Line numbers in links refer to the reviewed build and may drift; search by symbol name if a link is off.

## How to use this file

- Give an agent the **Context** and **Conventions** sections plus exactly one item. Every item is self-contained: problem, specification, acceptance criteria.
- Items reference each other by ID. Check **Depends on** before starting one.
- Update the Status column in the index when work starts or finishes.
- Personal figures and identifiers from the real data were left out on purpose.
- Security findings (FIX-6) are documented here; remove that item before publishing this repository if it is ever made public.

## Context

- **Stack:** Angular 22 standalone components, zoneless change detection, signals and `computed()`. TanStack Query for reads (`staleTime` 5 min, no refetch on window focus). Tailwind 4. Vitest. Firestore through `firebase/firestore/lite` (no realtime listeners, no offline cache). The service worker is enabled in production builds only. A `.vercel` folder suggests deployment on Vercel.
- **Navigation:** there is no Angular Router. The five tabs (Monthly, SumUp, Create, OneOffs, Charts) are the `ExpenseStateService.activeTab` signal.
- **Firestore collections:**
  - `transactions` - every expense, including split metadata and optional `adjustmentId` (trip link).
  - `expenses` - one document per month with an auto-generated ID, `MonthName` such as "October 2026", 12 category counters and `TotalWage`, mutated with `increment()`.
  - `adjustments` - one-offs and trips. `adjType` true means income, false means expense. Trips have `isTrip` and `isSelectable` (open/closed for new transactions).
  - `adjustments-temp` - the pending queue (kiosk submissions and admin entries dated outside the current month).
  - `users/{uid}` - role and budget settings (`categoryBudgets`, `defaultTotalWage`).
  - A settlement history collection written by the Splitzes flow.
- **Roles:** admin (a hard-coded UID) and kiosk. People for splitting are hard-coded in `PEOPLE` (`src/app/models/splitz.model.ts`).
- **Key services:** `TransactionService`, `ExpenseService`, `ExpenseStateService`, `AdjustmentService`, `SplitzService`, `SplitzSettlementService`, `BudgetSettingsService`, `PrivacyService` (stealth mode), `AuthService`, `ExportService`.

## Conventions for agents

- **Testing:** Vitest through `@angular/build:unit-test` (jsdom). Run `npx ng test --watch=false` (`npm test` also rewrites `src/environments/version.ts`). Specs import from `vitest`. Mock services with TestBed `providers: [{ provide: X, useValue: {...} }]`. Components that use `injectQuery` need `{ provide: QueryClient, useValue: new QueryClient() }`. `vi.mock` with relative paths throws in this builder; bare specifiers such as `firebase/firestore/lite` work.
- **Formatting:** Prettier (`printWidth` 100, single quotes). Files in the working tree are CRLF, so check with `npx prettier --check --end-of-line auto <files>`.
- **Environment files:** `src/environments/environment.ts` and `environment.development.ts` are git-ignored (they hold the Firebase `apiKey`). A fresh clone has to create them locally (see PLAT-1).
- **Production data:** a local `ng serve` talks to the production Firestore project. Until PLAT-1 is done, do not submit forms, accept or decline pending items, settle debts, save or delete while testing manually.
- **Patterns to follow:** standalone components, `inject()`, signals, TanStack Query with `invalidateQueries` after writes, Tailwind classes, money shown as `€` with two decimals.

## Suggested order

1. **PLAT-1** first, so agents and tests never touch production.
2. **FIX-1, FIX-5, FIX-7** - quick and low risk.
3. **FIX-2, FIX-3** (data integrity), then **FIX-4** and **FIX-6**.
4. **FEAT-1**, then **FEAT-3**, then **FEAT-2** - they build on each other and match how Pending review is used today.
5. **PLAT-3** (lint, CI, e2e) can run alongside step 3 and protects everything after it.
6. **UX-1, UX-3, FEAT-4, FEAT-5**, then the rest by preference.

## Decisions needed before implementation

- Scheduled posting (FEAT-1): app-open catch-up only, or also a server-side scheduler (Vercel Cron or Cloud Scheduler with the Firebase Admin SDK)?
- Offline and realtime (FEAT-10, FEAT-14): move to the full Firestore SDK with a persistent cache, or stay on the lite SDK and add an outbox?
- Stealth mode (FIX-4): only a screen-privacy toggle, or a real lock with a hardened PIN?
- Will more people use the app as admins or kiosk users? This changes FIX-6, FEAT-6, FEAT-8 and FEAT-11.
- Should a future-dated purchase count in the purchase month or the event month by default (FEAT-13, FIX-1)?
- Should budgets be versioned per month or stay global (FEAT-8)?

## Index

| ID      | Title                                          | Type     | Priority | Depends on       | Status |
| ------- | ---------------------------------------------- | -------- | -------- | ---------------- | ------ |
| FIX-1   | "Current month" is the newest month document   | Fix      | P1       | -                | Open   |
| FIX-2   | Editing a split transaction rewrites its total | Fix      | P1       | -                | Open   |
| FIX-3   | Multi-step writes are not atomic               | Fix      | P1       | -                | Open   |
| FIX-4   | Stealth mode hides only some amounts           | Fix      | P2       | -                | Open   |
| FIX-5   | One-off end date can be before its start date  | Fix      | P1       | -                | Open   |
| FIX-6   | Access control relies on client-side logic     | Fix      | P2       | -                | Open   |
| FIX-7   | Small defects and polish                       | Fix      | P1       | -                | Open   |
| FEAT-1  | Recurring and scheduled transactions           | Feature  | P2       | FIX-1, FIX-3     | Open   |
| FEAT-2  | Budget pace and month-end forecast             | Feature  | P2       | FIX-1, FEAT-1, 3 | Open   |
| FEAT-3  | Income as a first-class concept                | Feature  | P2       | FIX-1            | Open   |
| FEAT-4  | Global search and filters                      | Feature  | P2       | -                | Open   |
| FEAT-5  | Faster entry                                   | Feature  | P2       | FEAT-4           | Open   |
| FEAT-6  | Splitzes v2                                    | Feature  | P2       | FIX-2, FIX-3     | Open   |
| FEAT-7  | Trips v2                                       | Feature  | P3       | UX-3, FIX-3      | Open   |
| FEAT-8  | Category and budget management                 | Feature  | P3       | PLAT-2           | Open   |
| FEAT-9  | Insights                                       | Feature  | P3       | FIX-4, FEAT-1    | Open   |
| FEAT-10 | Notifications and freshness                    | Feature  | P3       | -                | Open   |
| FEAT-11 | Kiosk v2                                       | Feature  | P3       | FIX-6            | Open   |
| FEAT-12 | Import, backup and reconcile                   | Feature  | P3       | PLAT-2           | Open   |
| FEAT-13 | Richer transaction data                        | Feature  | P3       | FEAT-5, PLAT-1   | Open   |
| FEAT-14 | Offline-first entry                            | Feature  | P3       | -                | Open   |
| UX-1    | Router and deep links                          | UX       | P2       | -                | Open   |
| UX-2    | Month navigation and category list             | UX       | P3       | FIX-1            | Open   |
| UX-3    | Editing experience                             | UX       | P2       | FIX-2            | Open   |
| PLAT-1  | Environment separation and read-only mode      | Platform | P1       | -                | Open   |
| PLAT-2  | Data model and query efficiency                | Platform | P3       | FIX-6            | Open   |
| PLAT-3  | Quality gates and documentation                | Platform | P2       | PLAT-1           | Open   |

---

## A. Fixes

### FIX-1 - "Current month" is the newest month document, not today's month

**Type:** Fix - **Priority:** P1 - **Evidence:** App, Code - **Depends on:** none

**Problem**

- On a fresh load (today is 30 Sep 2026) the dashboard opens on October 2026, a month that has not started. "Total Saved" shows most of the wage because it is wage minus spend so far.
- The "N days left in this month" label in the overview card only renders when the selected month is the real current month, so it never shows by default.
- `latestMonthExpense` ([expense-state.service.ts](../src/app/services/expense-state.service.ts#L308)) picks the month document with the highest numeric `id`. For auto-generated Firestore IDs `Number(id)` is `NaN`, so it silently falls back to the first document in date order, which is the newest month and can be in the future (future-dated transactions create future month documents).
- The All-Time averages exclude that same "latest" document ([expense-state.service.ts](../src/app/services/expense-state.service.ts#L353)). When a future month exists, the real partial current month is counted in the average and the future month is excluded.
- SumUp, Month view ([month-breakdown.component.ts](../src/app/components/month-breakdown/month-breakdown.component.ts)) hides the real current calendar month but lists future months as if they were completed. Its empty state reads "No completed months yet".

**Specification**

- Add an injectable clock (so tests can fix the date) and derive a `currentMonthKey` from today's date.
- Default selection: the current month. If no document exists for it, the newest month dated on or before today. Keep the user's manual selection afterwards.
- Month pills: highlight the current month, mark future months "Upcoming" (muted), and add a "Today" chip that jumps back to the current month.
- All-Time averages and the Month view: exclude only the real current month. List future months in a separate "Upcoming" group.
- Overview card for a future month: show "Planned" instead of "Total Saved". The current month is handled by FEAT-2.
- Stop using `Number(id)` for ordering.

**Acceptance criteria**

- [ ] With documents for September and October and the clock at 30 Sep, the app opens on September.
- [ ] With the clock at 1 Oct the app opens on October. The 31 Dec to 1 Jan boundary works.
- [ ] With only future documents the app falls back to the nearest month without errors.
- [ ] All-Time averages are unchanged when no future month exists, and exclude the real current month when one does.
- [ ] Unit tests cover the cases above with the injectable clock.

### FIX-2 - Editing a split transaction rewrites its total

**Type:** Fix - **Priority:** P1 - **Evidence:** Code (static analysis; confirm with a test first) - **Depends on:** none

**Problem**

- `updateTransaction` ([transaction-service.ts](../src/app/services/transaction-service.ts#L683-L686)) sets `totalAmount = round(amount * (splitBy.length + 1))` on every save, even when only a comment or description changed.
- "Me" absorbs the remainder cent (`computeSplit`), so `amount * participants` does not equal the original total. Example: EUR 10.00 split 3 ways stores my share as 3.34, and any later save turns the total into 10.02.
- For `splitType: 'custom'`, `customSplitAmounts` is not updated, so shares no longer add up to the new total and the debts (derived from `customSplitAmounts`) are stale.
- For partially settled splits (`splitPaidPersonIds` not empty) the debt amounts can change after people have already paid, with no warning.
- The edit form shows split details read-only: paid by, split with and mode cannot be changed.

**Specification**

- Touch split fields only when the amount actually changed.
- Even splits: let the user edit the total and re-derive shares with the same rounding as `computeSplit`. Store `amount` (my share) and `totalAmount` consistently.
- Custom splits: require re-entering the per-person shares (validated to sum to the total), or lock the amount.
- Before editing amount, category or date, or deleting a transaction that has at least one settled participant, show who already paid what and require explicit confirmation.
- Allow editing paid by, split with and mode by reusing the split fields from the create form.
- Keep the month counter and trip total logic in `updateTransaction` intact.

**Acceptance criteria**

- [ ] Comment-only and description-only edits leave `amount`, `totalAmount`, `customSplitAmounts` and the Splitzes balances unchanged.
- [ ] Tests cover odd-cent totals with 2, 3 and 4 participants, custom splits, settled participants, and "paid by someone else".
- [ ] Editing the total re-derives shares with the same rounding used at creation.

### FIX-3 - Multi-step writes are not atomic

**Type:** Fix - **Priority:** P1 - **Evidence:** Code - **Depends on:** none

**Problem**

- Accepting a pending item: `commitPendingTransaction` runs `createTransaction(input)` and then a separate `deleteDoc(pendingRef)` ([transaction-service.ts](../src/app/services/transaction-service.ts#L531-L532)). A failure between the two leaves the pending document in place, so accepting it again creates a duplicate and double-counts the month. The in-flight guard only protects against concurrent calls in the same session.
- Settling debts: `confirmSettlement` runs `markDebtsSettled` (one `updateDoc` per transaction through `Promise.all`) and then `recordSettlements` ([splitzes-modal.component.ts](../src/app/components/splitzes-modal.component/splitzes-modal.component.ts#L185-L186)). If the second call fails, the UI says "Unable to record settlement" although the debts are already marked settled and the history entry is missing.
- Declining: `onDeclinePending` hard-deletes the pending document immediately ([splitzes-modal.component.ts](../src/app/components/splitzes-modal.component/splitzes-modal.component.ts#L421)). There is no confirmation and no way back.

**Specification**

- Accept: a single `writeBatch` (or transaction) that creates the transaction, updates the month counter or trip total, and deletes the pending document. Store `sourcePendingId` on the created transaction and check for an existing one first, so a retry is idempotent.
- Settlement: a single batch that updates every affected `splitPaidPersonIds` and writes the history records.
- Decline: a soft state (`status: 'declined'`, `declinedAt`) purged after a retention period, or keep the delete but show an Undo snackbar for a few seconds before committing it.
- Let `createTransaction` accept an optional batch so flows can compose their writes.

**Acceptance criteria**

- [ ] A simulated failure at any step leaves all data unchanged (tests with a failing `commit`).
- [ ] Accepting the same pending item twice, including after a simulated partial failure, creates exactly one transaction.
- [ ] A settlement either fully applies (flags and history) or not at all.
- [ ] A decline can be undone within the undo window.

### FIX-4 - Stealth mode hides only some amounts

**Type:** Fix - **Priority:** P2 - **Evidence:** Code - **Depends on:** none

**Problem**

- The blur (`blur-md` and `select-none` keyed to `PrivacyService.isPrivacyMode()`) is applied only in the overview card (spend, saved, breakdown), the budget summary, the bar and pie charts, the adjustment card and the edit-amount field.
- Not masked: per-category amounts and "left / over" values on Monthly, the transaction grid, Latest transactions, the trip breakdown, the Month view (spend, saved, wage, one-off amounts), yearly category sums, Utility and Transaction averages, category budget cards, every amount in the Splitzes modal (balances, pending items, history), and the kiosk balance.
- The PIN is an unsalted SHA-256 hash of a short PIN in `localStorage`, which is trivially brute-forced. A commented-out hard-coded PIN also sits in [privacy.service.ts](../src/app/services/privacy.service.ts#L13).
- The blur is CSS only, so values stay in the DOM. It protects against shoulder-surfing, not against inspection.

**Specification**

- One shared presentational component or directive (for example `<app-money [value]>` or an `appMask` directive) that renders a euro value and applies the blur and `select-none` when stealth is on. Use it for every monetary value, including chart labels and modal content.
- Add a Vitest check that scans component templates (or renders the key screens with stealth on) and fails on raw `€{{` outside the shared component.
- Optional: enable stealth automatically when the page becomes hidden or after N seconds of inactivity (configurable in Settings).
- If the PIN should be a real lock: per-device random salt, a PBKDF2-style derived hash, attempt throttling with backoff, and a minimum length. If it is only a screen-privacy toggle, say so in the Settings copy.
- Delete the commented-out PIN.

**Acceptance criteria**

- [ ] With stealth on, no readable euro amount appears on Monthly, SumUp, OneOffs, Charts, Create, the Splitzes modal or Settings.
- [ ] An automated check prevents regressions.
- [ ] The commented-out PIN is removed.

### FIX-5 - One-off end date can be before its start date

**Type:** Fix - **Priority:** P1 - **Evidence:** App, Code - **Depends on:** none

**Problem**

- App: the Singles list contains a one-off displayed as "From 26/06/2026 To 10/06/2026" (end before start).
- Code: the create form ([create-adjustment-form.component.ts](../src/app/components/create-transaction.component/create-adjustment-form.component.ts)) and the edit form ([edit-adjustment.component.ts](../src/app/components/edit-adjustment.component/edit-adjustment.component.ts)) only require both dates. The Month view assigns one-offs to months by `endDate`, so a bad range puts the amount in the wrong month.

**Specification**

- Add an `endDate >= startDate` validator with an inline message to both forms. When the start date is moved past the end date, move the end date with it.
- Add a Settings, "Data health" list that flags adjustments with `endDate < startDate`, each with an "Open" action. FEAT-12 later adds month-counter mismatches to the same list.

**Acceptance criteria**

- [ ] Both forms block invalid ranges.
- [ ] The existing invalid record appears in Data health and can be fixed from there.
- [ ] Unit tests cover the validator.

### FIX-6 - Access control relies on client-side logic

**Type:** Fix - **Priority:** P2 - **Evidence:** Code - **Depends on:** none

**Problem**

- `getFallbackRole` returns `'kiosk'` for any UID that is not the hard-coded admin UID ([auth.service.ts](../src/app/services/auth.service.ts#L48)). An unknown signed-in user lands in the kiosk UI instead of a "no access" screen.
- `createAccount()` ([auth.service.ts](../src/app/services/auth.service.ts#L91)) is unused and defaults to role `admin`.
- The repository contains no `firestore.rules`, `firebase.json`, `.firebaserc` or indexes file, so the real access rules are invisible to code review and agents. The web API key is public by design, so the rules are the only real gate. They may exist in the Firebase console; that was not verified.
- The kiosk UI computes its balance by reading every split transaction (`fetchAllSplitTransactions`), which needs read access to `transactions`.

**Specification**

- Commit `firestore.rules`, `firestore.indexes.json` and `firebase.json`, and deploy them from CI.
- Default-deny: a signed-in user without a `users/{uid}` role document sees a "no access" screen. Remove the `kiosk` fallback.
- Rules: admin (by UID or custom claim) has full access. A kiosk user may only `create` documents in `adjustments-temp` whose shape is validated (amount is a number within a sensible range, description length up to 60, category from an allow-list, `sourceRole == 'kiosk'`, `createdByUid == request.auth.uid`) and may read only its own balance document.
- Maintain `balances/{personId}`, written by the admin client whenever split data changes, so the kiosk never reads `transactions`.
- Verify in the Firebase console that Email/Password sign-up is disabled, and enable App Check.
- Remove `createAccount`. Write rules tests with the emulator.

**Acceptance criteria**

- [ ] Rules and indexes live in the repository and are tested with the emulator.
- [ ] A user with no role document gets "no access" and cannot read any collection.
- [ ] A kiosk token cannot read `transactions`, `expenses`, `adjustments` or other users' data, and can only create valid pending documents.

### FIX-7 - Small defects and polish

**Type:** Fix - **Priority:** P1 - **Evidence:** App, Code - **Depends on:** none

Each line below is an independent task.

- [ ] **One-off form:** the Description placeholder literally reads "Placeholder". Replace it with a real hint. The default adjustment type is "Addition" (income) ([create-adjustment-form.component.ts](../src/app/components/create-transaction.component/create-adjustment-form.component.ts#L73)); default to Expense or require an explicit choice.
- [ ] **Over-budget state uses colour only** (a red number with no "over" text). Add explicit wording ("over by €X") and an icon. Budget bars need `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and a label. Raise the minimum text size; much secondary text is 10px.
- [ ] **Zoom is disabled** by the viewport meta ([index.html](../src/index.html#L9)): remove `maximum-scale=1, user-scalable=0` and use 16px inputs to avoid the iOS focus-zoom instead.
- [ ] **Latest transactions:** rows are not tappable, the list is capped at 10 and cannot load more. Make rows open the edit view, add "Load more", and offer sorting by transaction date or by added date.
- [ ] **Profile button:** its `title` says "Toggle Stealth Mode" but it opens Settings. Change the title and aria-label to "Settings".
- [ ] **Debug logging:** [transaction-grid.component.ts](../src/app/components/transaction-grid.component/transaction-grid.component.ts#L98) logs transaction data, and [category-budgets-chart.ts](../src/app/components/category-budgets-chart/category-budgets-chart.ts#L139-L141) logs the user role. Remove both.
- [ ] **`topCategory`** ([expense-state.service.ts](../src/app/services/expense-state.service.ts#L404)) is computed and passed to the overview card but never rendered, and it returns the first category rather than the largest. Render "Top category" (largest spend) or delete it.
- [ ] **Budget defaults:** code defaults in `CATEGORY_BUDGETS` (for example Medical 200, Utilities 110, Gym 65) differ from the saved budgets, and the 1600 wage fallback is repeated in several places (`DEFAULT_TOTAL_WAGE`, the chart fallback). Keep a single source of truth.
- [ ] **Dead branch:** `resolvePendingCategoryOptions` returns the same value on both ternary branches ([transaction-service.ts](../src/app/services/transaction-service.ts#L128)), and its hard-coded lists duplicate `TRIP_CATEGORY_NAMES` and `CATEGORY_NAMES`.
- [ ] **Formatting (optional):** amounts use en-US formatting ("€1,313.60") while the data is Greek. Decide whether to use `el-GR` formatting.

---

## B. New features

### FEAT-1 - Recurring and scheduled transactions

**Type:** Feature - **Priority:** P2 - **Evidence:** App, Code - **Depends on:** FIX-1, FIX-3 - **Enables:** FEAT-2, FEAT-9

**Problem**

- App: Pending review holds six future-dated entries created by the admin (gym, internet, mobile, a utilities bill and two game purchases). The pending queue is being used as a manual scheduler, and it sits inside the Splitzes modal although most items are not splits.
- App: Utility Averages show the same bills recurring monthly (energy 19 records, mobile 18, common charges 17, internet 9, water 7).
- Code: admin transactions dated outside the current month and not linked to a trip are diverted to `adjustments-temp` by `shouldSaveTransactionForApproval` ([create-transaction.models.ts](../src/app/components/create-transaction.component/create-transaction.models.ts)) and must then be accepted one by one.
- App: admin-created items are labelled "Incoming From -> `<admin name>`", which reads oddly for entries the admin created.

**Specification**

- New collection `recurringRules`. Suggested shape:

  ```ts
  interface RecurringRule {
    id: string;
    title: string; // becomes the transaction description
    category: string;
    subCategoryId?: number;
    amount: number; // fixed amount, or the estimate for variable bills
    amountType: 'fixed' | 'estimated';
    cadence:
      | { type: 'monthly'; dayOfMonth: number }
      | { type: 'weekly'; every: number; weekday: number }
      | { type: 'yearly'; month: number; day: number };
    startDate: string; // YYYY-MM-DD
    endDate?: string;
    autoPost: boolean; // true: post without asking (fixed bills); false: create a confirm card
    split?: {
      paidBy: 'me' | number;
      splitBy: number[];
      splitType: 'split' | 'custom';
      customSplitAmounts?: Partial<Record<'me' | number, number>>;
    };
    adjustmentId?: string; // optional trip link
    nextDue: string; // advanced after each occurrence
    pausedUntil?: string;
  }
  ```

- Generated transactions carry `recurringRuleId` and `dueDate`. Use `${ruleId}_${dueDate}` as the document ID so the pair is an idempotency key.
- Scheduling: on app open, catch up every rule whose `nextDue` is on or before today. Fixed and `autoPost` rules post. Estimated rules create a "confirm amount" card prefilled with the trailing average for that merchant or subcategory. If the app should not depend on being opened, add a scheduled server job (Vercel Cron or Cloud Scheduler) that uses the Firebase Admin SDK.
- UI: an "Upcoming (next 30 days)" list on Monthly with due date, amount and Skip, Edit and Post now actions. Manage rules in Settings. Offer "Repeat monthly" on any existing transaction.
- Editing: "this occurrence" versus "this and all future"; pause and resume; end date.
- Keep Pending review for kiosk submissions only, and migrate the admin's existing future-dated pending items into rules or scheduled entries. Rename the admin source label.
- An occurrence dated in a future month must not create that month's document until it is posted, to avoid the side effects described in FIX-1.

**Acceptance criteria**

- [ ] A monthly rule creates exactly one transaction per month, even if the app is opened many times or after a gap of several months (catch-up posts each missed month once, with the correct date).
- [ ] Estimated bills never auto-post; they create a confirm card prefilled from history.
- [ ] Split settings on a rule are applied to generated transactions and produce correct debts.
- [ ] The Upcoming list matches the rules, and Skip advances `nextDue` without posting.
- [ ] Tests cover cadence math (31st of the month, February, leap years, DST) and idempotency.

### FEAT-2 - Budget pace and month-end forecast

**Type:** Feature - **Priority:** P2 - **Evidence:** App - **Depends on:** FIX-1; works best with FEAT-1 and FEAT-3

**Problem**

- The Monthly overview card shows two numbers: "Total Actual Spend" and "Total Saved" (wage minus spend so far). On the first day of a month it reads as if nearly the whole wage was saved.
- There is no sense of pace, daily allowance or how the month will end. The "days left" label exists only when the current month is selected.

**Specification**

- For the current month: "Budget left" (sum of category budgets minus spent, clamped per category), days left, and "Safe to spend per day" (remaining budget divided by days left).
- Per-category pace: compare the percentage of budget used with the percentage of the month elapsed. Amber when ahead of pace, red when over budget, with "over by €X" text.
- Delta chips against the previous month (overall and per category).
- Projected month-end spend: spent so far, plus scheduled upcoming items (FEAT-1), plus the run-rate of variable categories (average daily spend over the trailing 3 full months times the remaining days, per category). "Projected saved" is the expected wage (FEAT-3) minus projected spend.
- Relabel "Total Saved" for the current month to "Saved so far" or "Projected saved". Past months keep "Total Saved".
- State the forecast's assumptions in a short note.

**Acceptance criteria**

- [ ] The current-month card shows days left, daily allowance and projection. Tests with a fixed clock cover the first day, mid-month, the last day, and 28-day versus 31-day months.
- [ ] Past months are unchanged. Future months show "Planned".
- [ ] All amounts respect stealth mode (FIX-4).

### FEAT-3 - Income as a first-class concept

**Type:** Feature - **Priority:** P2 - **Evidence:** App, Code - **Depends on:** FIX-1 - **Enables:** FEAT-2

**Problem**

- Code: `TotalWage` is written only when a month document is created, from the default wage ([transaction-service.ts](../src/app/services/transaction-service.ts#L559), [transaction-service.ts](../src/app/services/transaction-service.ts#L647)). The budget "Edit" only changes the default wage for future months. No UI changes an existing month's wage (raises, unpaid leave, extra salaries).
- App: bonuses and other income are "Addition" one-offs. Their status is encoded in titles (one bonus title ends with "(Upcom)" and is dated in the past), yet forecast income is counted in SumUp "One-Off Bonuses" and "Total Saved" as if it had been received. `oneOffBonuses` sums every `adjType` adjustment regardless of status.
- App: the Singles list mixes income (up arrow) and expenses (down arrow) with no filters or totals.

**Specification**

- A per-month wage override in the month view, writing `TotalWage` for that month only, with a small "edited" badge.
- Income entries (extend `adjustments` or add an `income` collection) with:

  ```ts
  interface IncomeFields {
    kind: 'salary' | 'bonus' | 'tax-return' | 'other';
    status: 'expected' | 'received';
    expectedOn?: string; // YYYY-MM-DD
    receivedOn?: string;
  }
  ```

- Expected income is excluded from actual totals ("Total Saved", SumUp) and included in forecasts (FEAT-2). A "Mark received" action moves it into actuals, optionally adjusting amount and date.
- Savings rate per month and all-time. Optional savings goals with a target amount and date, a progress bar and a projected completion date.
- Singles filters: type (income or expense), year and status, with totals for the current filter.
- Migration: existing one-offs default to `status: 'received'`. Detect titles containing "(Upcom" and offer to convert them.

**Acceptance criteria**

- [ ] Editing a month's wage changes only that month and its totals.
- [ ] An expected bonus does not change "Total Saved" until it is marked received.
- [ ] SumUp and Month view totals reflect status, with tests for mixed statuses.
- [ ] Singles filters show correct totals.

### FEAT-4 - Global search and filters

**Type:** Feature - **Priority:** P2 - **Evidence:** App, Code - **Depends on:** none (benefits from the `/search` route in UX-1)

**Problem**

- Volume: Charts, Transaction Averages shows 420 supermarket, 125 restaurant and 146 takeaway entries in 20 months.
- Browsing is 10 per page inside one category and month (`fetchPage`), or exact-description paging from Charts (`fetchPageByDescription`). Latest transactions is capped at 10 and read-only. There is no way to find "that pharmacy purchase in March" or every transaction above EUR 100.

**Specification**

- A Search screen (header icon or tab) with: free text; category and subcategory; date range; amount range; flags (split, linked to a trip, has a comment, pending); sort by date or amount.
- Text matching is case- and accent-insensitive and folds the Greek final sigma, so "σκλαβενιτης" matches "Σκλαβενίτης".
- Results show a count and a total. Tapping a row opens the edit view (as a sheet, see UX-3). Bulk actions: recategorise, link to a trip, delete (with confirmation and Undo).
- "Export filtered results" as CSV or JSON through the existing `ExportService`.
- Implementation options: (a) cache all transactions in IndexedDB (about 1,500 documents today) with incremental sync by `createdAt` and `updatedAt`, and filter in memory; (b) add a normalised `searchKey` plus a token array and use `array-contains`. Avoid reading the full collection on every open.

**Acceptance criteria**

- [ ] Queries combining text, category, date range and amount range return correct results across months.
- [ ] Greek accents and case are ignored, including the final sigma (tests for the normaliser).
- [ ] After the first sync a search returns in under a second on a mid-range phone, and later syncs read only new or changed documents.

### FEAT-5 - Faster entry

**Type:** Feature - **Priority:** P2 - **Evidence:** App - **Depends on:** FEAT-4 (shared merchant normaliser)

**Problem**

- The Create form has a plain Description input, an unselected Category dropdown and a date that defaults to today. Most entries repeat earlier ones, and the split setup has to be redone each time.

**Specification**

- Merchant autocomplete from history (normalised as in FEAT-4). Selecting a suggestion prefills category, subcategory, typical amount (median of the last N) and split setup.
- "Recent" and "Favourite" chips above the form, plus user-defined templates (name, category, amount, split).
- A "Duplicate" action on any transaction (Monthly, search results, Latest transactions).
- Quick date chips (Today, Yesterday, Pick date), a numeric-first amount keypad, the last used category remembered per merchant, and "Add another" after saving.
- A PWA shortcut that opens the Create tab directly (manifest `shortcuts`, needs the routes from UX-1).
- Optional smart capture: typed text such as "20 sklavenitis" parsed into amount and merchant, or a receipt photo (FEAT-13), prefilling the form for confirmation.

**Acceptance criteria**

- [ ] Logging a repeat purchase takes at most 3 taps (merchant suggestion, confirm amount, save).
- [ ] Suggestions are built from existing transactions without extra writes and keep working offline once cached.
- [ ] Tests cover merchant normalisation and prefill logic.

### FEAT-6 - Splitzes v2

**Type:** Feature - **Priority:** P2 - **Evidence:** App, Code - **Depends on:** FIX-2, FIX-3

**Problem**

- App: each person shows a single net number, and "Mark debt settled" settles everything at once. The confirmation dialog lists the transactions but offers no selection or partial amount.
- Code: people are hard-coded in `PEOPLE`, so adding someone needs a deploy. Pending review lives inside this modal and the header button has no pending badge. The history section is a flat list of settled debts.

**Specification**

- A per-person ledger: the transactions behind the balance with direction, date and running total, opened from the person card.
- Selective and partial settlement: tick transactions, or enter an amount that is allocated to the oldest unsettled debts first (split a debt if needed and record the remainder).
- "Request payment": generate an itemised message and share it with the Web Share API (fallback: copy to clipboard).
- Manage people (add, rename, archive, colour) in Firestore instead of code, and migrate the `PEOPLE` ids.
- Per-trip group settlement ("who owes whom for this trip") using debt simplification across participants.
- Reminders for balances older than N days, and undo of the last settlement.
- Move Pending review out of the Splitzes modal into its own Inbox with a count badge on the header.

**Acceptance criteria**

- [ ] Settling 1 of 3 open transactions updates only that one, records history, and leaves the other two open, atomically.
- [ ] Partial amounts allocate oldest-first and balances recompute correctly (tests including rounding).
- [ ] Adding a person in Settings makes them selectable in Create without a deploy.
- [ ] The Inbox badge shows the pending count.

### FEAT-7 - Trips v2

**Type:** Feature - **Priority:** P3 - **Evidence:** App, Code - **Depends on:** UX-3 (Move to trip), FIX-3

**Problem**

- App: the trip view shows each category's share of the trip total. The bars show share-of-total, not progress against a budget. A trip shows only From and To dates and a total.
- Code: `Adjustment` has no budget field. Linking a transaction to a trip happens only at creation, because `updateTransaction` keeps `adjustmentId` and the edit form has no trip field. Trips already have an "Accept New Transactions" open/closed lock.

**Specification**

- A trip budget (total and optional per category) with remaining amount and progress. Per-day average and days left while the trip is running.
- In Create, suggest the trip automatically when the transaction date falls inside an open trip's date range.
- Link, unlink or move existing transactions to or from a trip from the edit form. Adjust the month counters and the trip total in one batch.
- Optional foreign-currency amounts with a stored exchange rate for non-EUR trips.
- A trip summary that can be shared or exported, and per-person totals for split items.

**Acceptance criteria**

- [ ] Moving a transaction between a trip and a normal month keeps the month counter and the trip total correct (tests).
- [ ] Budget progress and remaining amount update when transactions change.
- [ ] The auto-suggestion only offers open trips whose range contains the date.

### FEAT-8 - Category and budget management

**Type:** Feature - **Priority:** P3 - **Evidence:** App, Code - **Depends on:** PLAT-2 (month document shape)

**Problem**

- Code: categories are hard-coded (`CATEGORY_BUDGETS`, `CATEGORY_NAMES`, the 12-field `Expense` model, hard-coded lists in `resolvePendingCategoryOptions`). Subcategories exist only for Tickets, Gaming and Utilities. Budgets are a single global set, so changing a budget changes how all history is judged. The budget editor sits at the top of the Charts tab.
- App: "Personal" mixes very different things (for example a gift and a clothing item) and cannot be broken down.

**Specification**

- Settings, Categories: add, rename, archive, emoji and colour, monthly budget, and optional subcategories for any category.
- Budgets versioned by effective month (`budgetHistory`) with an optional per-month override. History is judged against the budget that applied at the time.
- Threshold alerts (80% and 100%) as in-app banners (push notifications in FEAT-10). Optional rollover of unused budget. A zero-based indicator (income minus budgets equals unallocated).
- A one-tap "apply suggested budget from the trailing 3-month average".
- Migration: turn `expenses` documents into `{ categories: { [categoryId]: amount } }` (keep the old fields until verified) and map the existing names to stable category ids.

**Acceptance criteria**

- [ ] Adding a category needs no code change and appears in Create, edit, Monthly, SumUp and Charts.
- [ ] Changing a budget from next month leaves earlier months judged against the old budget.
- [ ] The migration script is idempotent and verified with Reconcile (FEAT-12).

### FEAT-9 - Insights

**Type:** Feature - **Priority:** P3 - **Evidence:** App - **Depends on:** FIX-4 (masking), FEAT-1 (recurring detection)

**Problem**

- Charts shows a monthly spend-versus-wage bar or pie and two average lists. SumUp is always all-time (20 months). Nothing compares months, years or merchants.

**Specification**

- A range selector on SumUp: year to date, 3, 6 and 12 months, custom.
- Month-over-month and year-over-year deltas, overall and by category.
- A budget line overlaid on the monthly trend chart.
- A cumulative savings timeline (wage plus bonuses minus spend) across all months.
- Top merchants by total and by frequency, and the largest transactions per month.
- Unusual-spend flags (a category total above its trailing mean plus two standard deviations), recurring-charge detection that feeds FEAT-1 suggestions, a weekday or calendar heatmap, and a yearly review.

**Acceptance criteria**

- [ ] Each insight handles empty and low-data states.
- [ ] All amounts respect stealth mode.
- [ ] The range selector recalculates totals and averages correctly (tests).

### FEAT-10 - Notifications and freshness

**Type:** Feature - **Priority:** P3 - **Evidence:** App, Code - **Depends on:** none (pairs with FEAT-11)

**Problem**

- The admin learns about a kiosk submission only by opening Splitzes, then Pending review, then pressing Refresh.
- TanStack Query uses `staleTime` of 5 minutes and `refetchOnWindowFocus: false` ([app.config.ts](../src/app/app.config.ts#L15-L16)), so a PWA resumed from the background can show stale numbers.

**Specification**

- A pending-count badge on the header. Refetch on `visibilitychange` (app resume) and support pull-to-refresh.
- Optional web push (FCM) for: a new kiosk submission, a bill due tomorrow, a budget threshold reached, and a month-end summary. Server-side triggers need Cloud Functions or another serverless function. iOS requires the PWA to be installed to the home screen (iOS 16.4 or later).
- For true realtime, use the full Firestore SDK with `onSnapshot` on `adjustments-temp` and `expenses`. The app currently uses `firebase/firestore/lite`, which has no listeners.

**Acceptance criteria**

- [ ] A kiosk submission shows up on the admin device without a manual refresh (badge and list).
- [ ] Resuming the PWA refreshes stale queries.
- [ ] Notification opt-in and opt-out live in Settings.

### FEAT-11 - Kiosk v2

**Type:** Feature - **Priority:** P3 - **Evidence:** Code - **Depends on:** FIX-6 (rules and balance document)

**Problem**

- The kiosk view is the create form plus a balance card hard-coded to the person named "Stavi" ([kiosk-balance.component.ts](../src/app/components/create-transaction.component/kiosk-balance.component.ts#L65)).
- Kiosk-sourced pending items are force-normalised to "paid by person 1, split with person 1" (`normalizePendingSplitOverride` in `transaction-service.ts`), so every kiosk user is effectively that one person.
- The submitter cannot see whether items were accepted or declined; after submitting they see only a short success toast.

**Specification**

- A `users/{uid}.personId` mapping. The balance card and the default split derive from it. Support several kiosk users.
- A "My submissions" list with status (pending, accepted, declined with an optional reason) and cancel or edit while pending.
- An optional note to the admin, and a limit on pending items per kiosk user.

**Acceptance criteria**

- [ ] A second kiosk user (different `personId`) sees their own balance and submissions, and the forced-split defaults use their id.
- [ ] Declined items show up with the reason. Accepted items leave the pending list and show as accepted.
- [ ] Rules (FIX-6) allow reading only the user's own submissions and balance.

### FEAT-12 - Import, backup and reconcile

**Type:** Feature - **Priority:** P3 - **Evidence:** App, Code - **Depends on:** PLAT-2

**Problem**

- Export exists (transactions and one-offs as CSV or JSON) but there is no import or restore. Months (`expenses`), budgets and settlement history are not exported.
- Month totals are hand-maintained `increment()` counters. Any failed or partial write (see FIX-3) can make `expenses` drift from `transactions` with no way to detect it.

**Specification**

- A CSV import wizard: upload, column mapping (date, description, amount, optional category), Greek date and number formats, a preview with duplicates highlighted, dedupe on date plus amount plus normalised description, reusable rules ("description contains X sets category Y"), and commit in batches using the same counter logic as `createTransaction`.
- A full JSON backup and restore covering months, adjustments, budgets, settlement history and pending items.
- A "Reconcile" tool that recomputes every month's category totals and every trip's total from `transactions`, shows a diff table and offers "Repair". Surface the result in Settings, Data health (FIX-5).
- A backup reminder (for example every 30 days) with the last-backup timestamp.

**Acceptance criteria**

- [ ] Importing the same file twice adds nothing the second time.
- [ ] Reconcile reports zero drift on healthy data, lists each mismatch with expected and actual values, and Repair fixes them.
- [ ] Backup followed by restore into an empty emulator reproduces identical totals.

### FEAT-13 - Richer transaction data

**Type:** Feature - **Priority:** P3 - **Evidence:** App, Code - **Depends on:** FEAT-5 (capture), PLAT-1 (Storage emulator)

**Problem**

- App: several ticket purchases were added on 30/09 for events on 22/10 and 25/10, so the spend is counted in the event month rather than the purchase month.
- There are no receipts, tags or payment method. `storageBucket` is configured in `firebase.config.ts` but unused. The only note field is a 250-character comment.

**Specification**

- An optional `eventDate`, or a "count in purchase month / event month" switch for Tickets and Travel. The transaction's `date` stays the counted date and the other date is informational.
- A receipt photo in Firebase Storage: client-side compression, a thumbnail in the edit form, deletion together with the transaction.
- Tags (for example #gift, #work) independent of categories, with a tag filter in search (FEAT-4).
- Payment method (cash, card, account) for reconciling with bank statements, and a "reimbursable" flag with an outstanding reimbursable total.
- Optional OCR or LLM receipt capture that prefills amount, merchant and date for confirmation.

**Acceptance criteria**

- [ ] A ticket bought in September for an October show can be counted in either month deliberately, and both dates are visible.
- [ ] Receipts upload, display and are removed with their transaction. Storage rules restrict access to the admin.
- [ ] Tags and payment method are searchable.

### FEAT-14 - Offline-first entry

**Type:** Feature - **Priority:** P3 - **Evidence:** Code - **Depends on:** none

**Problem**

- The app uses `firebase/firestore/lite`, which has no persistent cache. The service worker ([ngsw-config.json](../ngsw-config.json)) caches only the app shell and assets, and is enabled only in production builds. Nothing loads or saves without a connection.

**Specification**

- Option A: switch to the full Firestore SDK with `persistentLocalCache` (multi-tab). This enables offline reads and queued writes, and realtime listeners for FEAT-10.
- Option B: keep the lite SDK and add an IndexedDB outbox that queues new transactions (client-generated IDs for idempotency) and replays them on reconnect through the existing services.
- UI: an offline banner, a "queued (n)" badge, and the last-viewed month available offline.

**Acceptance criteria**

- [ ] A transaction created in airplane mode appears after reconnect exactly once, with the month counters updated once.
- [ ] The offline banner and queue badge appear and clear correctly.
- [ ] Tests cover outbox replay: failure, retry and duplicate protection.

---

## C. UX and navigation

### UX-1 - Router and deep links

**Type:** UX - **Priority:** P2 - **Evidence:** Code - **Depends on:** none

**Problem**

- There is no `provideRouter` ([app.config.ts](../src/app/app.config.ts)); tabs are the `activeTab` signal. The back button or gesture leaves the app or does nothing, a refresh loses the selected month, expanded category and trip, and no screen can be linked or bookmarked.

**Specification**

- Routes: `/monthly/:yyyy-mm`, `/sumup`, `/create`, `/oneoffs/:tripId?`, `/charts` and `/search` (FEAT-4), lazy-loaded where sensible.
- Keep the selected month, expanded category and search filters in the URL or query params.
- Back closes edit sheets and modals before leaving a screen.
- Add manifest `shortcuts` for "Add expense" and "This month". Keep the existing tab bar UI.
- Keep `ExpenseStateService` as the source of truth, or derive its state from the route.

**Acceptance criteria**

- [ ] Refreshing on any screen restores the same view, and shared links open the right month or trip.
- [ ] The back button sequence is: modal or sheet, then expanded item, then previous screen.
- [ ] Existing tests are updated and tab switching does not regress.

### UX-2 - Month navigation and category list

**Type:** UX - **Priority:** P3 - **Evidence:** App - **Depends on:** FIX-1

**Problem**

- The month selector is a horizontal scroller with 20 pills, growing monthly. The category list is in fixed code order with 10px secondary labels.

**Specification**

- A month and year picker with previous and next arrows and swipe, year grouping, the current month highlighted and future months marked (FIX-1).
- Category list: sort by spend, percentage of budget used, or remaining; an "over budget only" filter; a compact or expanded density; a 6-month sparkline per category; long-press to quick-add in that category with the category prefilled.
- Explicit "over by €X" wording (FIX-7).
- Optional `el-GR` number and date formatting.

**Acceptance criteria**

- [ ] Jumping to any month takes at most two taps.
- [ ] Sort and filter choices persist per device.
- [ ] Sparklines respect stealth mode.

### UX-3 - Editing experience

**Type:** UX - **Priority:** P2 - **Evidence:** App, Code - **Depends on:** FIX-2

**Problem**

- App: the edit form opens inside the expanded category card (a card inside a card) and is cramped on mobile.
- Code: there is no Duplicate, no Move to trip, no Undo and no change history. Delete is a hard delete with the counters decremented.

**Specification**

- A bottom sheet or full-screen editor with an unsaved-changes guard.
- Actions: Duplicate, Move to trip (see FEAT-7), and editing split settings (see FIX-2).
- An Undo snackbar for delete, decline and settle (a soft-delete window).
- A per-transaction change history in a subcollection (`updatedAt`, `updatedBy`, previous values). It also helps diagnose counter drift (FEAT-12).

**Acceptance criteria**

- [ ] Editing no longer nests inside the category card, and closing with unsaved changes asks for confirmation.
- [ ] Deleting shows Undo for several seconds and restores the transaction and the counters.
- [ ] History entries are written for updates and deletes.

---

## D. Platform and quality

### PLAT-1 - Environment separation and read-only mode

**Type:** Platform - **Priority:** P1 - **Evidence:** App, Code - **Depends on:** none

**Problem**

- [firebase.config.ts](../src/app/firebase.config.ts) hard-codes the production project (only the `apiKey` comes from `environment`), so `ng serve` reads and writes production data.
- The environment files are git-ignored and nothing in the repository documents their expected shape. `README.md` is the default Angular CLI text. A fresh clone cannot build.
- App: production already contains a transaction named "test" (Supermarket, EUR 1.00, split, dated 08/10/2026), most likely from testing the accept flow. Delete it manually.
- The Settings footer shows only a git hash (`vd8109ad-dirty`) and no environment indicator. A `.vercel` folder suggests the app is deployed on Vercel; preview deployments should not use production data either.
- The local seed utility (`src/app/utils/seed-transactions.ts`) is git-ignored and commented out.

**Specification**

- Create a separate Firebase project for development, or use the Emulator Suite, selected through the Angular environment files (`connectFirestoreEmulator` and `connectAuthEmulator` when `environment.useEmulator` is set).
- Add `environment.example.ts` with every required key, and README setup steps: install, create the environment files, start the emulator, seed, run, test.
- A seed script that loads realistic data into the emulator: Greek descriptions, 12 or more months, trips, splits, pending items, a kiosk user.
- An environment label (DEV or PROD) next to the version in Settings, and a coloured top border in development.
- A `readOnly` switch (environment flag or query param) that makes every write method throw or no-op with a visible banner. It covers `TransactionService`, `AdjustmentService`, `BudgetSettingsService`, the settlement service and the auth profile writes, so production data can be browsed safely.
- Point CI and preview deployments at the development project.

**Acceptance criteria**

- [ ] A default `ng serve` cannot write to production (emulator or read-only).
- [ ] A fresh clone builds and runs following only the README.
- [ ] The emulator seed reproduces every screen described in this backlog (months, trips, splits, pending, kiosk).
- [ ] The DEV or PROD indicator is visible in Settings.

### PLAT-2 - Data model and query efficiency

**Type:** Platform - **Priority:** P3 - **Evidence:** Code - **Depends on:** FIX-6 (indexes file) - **Enables:** FEAT-8, FEAT-12

**Problem**

- `expenses` documents have auto IDs and a free-text `MonthName` ("October 2026"). Every write first queries by that name, and two concurrent creations for a new month can create duplicates. Month selection logic uses `Number(id)` (FIX-1).
- `fetchRecentTransactions` downloads every document for the month (or trip) and then keeps 10. `countTransactionsByCategory` downloads the whole month just to count. The export downloads the whole collection. The Charts averages page through documents.
- Transaction-to-domain mapping is duplicated in four places in [transaction-service.ts](../src/app/services/transaction-service.ts) (`fetchPagedTransactions`, `mapTransaction`, `fetchAllByAdjustmentId`, `fetchAllSplitTransactions`).
- Dates are stored as strings (`YYYY-MM-DD`) in transactions and adjustments, while some adjustment documents may hold Timestamps (the mapper handles both).

**Specification**

- Stable month IDs (`YYYY-MM`) written with `setDoc(..., { merge: true })` plus `increment()`. Migrate existing documents (keep `MonthName` as a field) and remove the lookup query.
- Replace the download-and-slice patterns with `orderBy('createdAt', 'desc')` plus `limit(10)` and composite indexes committed in `firestore.indexes.json` (FIX-6).
- Use Firestore aggregation queries (count, sum, average) for counts and averages instead of reading documents.
- One shared `mapTransaction`, and one date convention (ISO date strings for calendar dates, Timestamps for instants).
- Keep the counters and add Reconcile (FEAT-12), or derive totals from transactions through aggregation if read costs allow.

**Acceptance criteria**

- [ ] Opening Monthly reads a bounded number of aggregates or one month document, not every transaction of the month.
- [ ] No duplicate month documents can be created. The migration is idempotent and verified by Reconcile.
- [ ] A single mapper is used by all fetch paths, and existing tests pass.

### PLAT-3 - Quality gates and documentation

**Type:** Platform - **Priority:** P2 - **Evidence:** Code - **Depends on:** PLAT-1 (emulator for e2e)

**Problem**

- Unit tests exist for several services and components, but there is no ESLint, no CI workflow and no end-to-end test. `README.md` is the default Angular text. Debug leftovers exist: console logs, a commented-out PIN and the unused `createAccount`.

**Specification**

- Add `angular-eslint` (including rules against unused code and `console`) and fix the findings.
- CI (GitHub Actions or Vercel build checks) that runs install, lint, `ng test --watch=false` and `ng build` on pull requests.
- Playwright end-to-end tests against the emulator (PLAT-1) covering: create, edit and delete; split and settle; pending accept and decline; kiosk submit and balance; stealth masking (FIX-4); the default month (FIX-1).
- Regression tests for FIX-1 to FIX-5.
- Replace the README with a project overview, an architecture summary (collections, roles, data flows), setup, scripts and testing notes. Move the Context and Conventions sections of this file into it.
- Remove the dead code: `createAccount`, the commented-out PIN and the console logs.

**Acceptance criteria**

- [ ] CI is green on a clean clone.
- [ ] The e2e suite runs locally and in CI against the emulator with seeded data.
- [ ] The README lets a new contributor (or agent) run, test and deploy without asking questions.

---

## Not verified during the review

- Kiosk mode UI (needs a kiosk account): assessed from code only.
- Stealth mode rendering (the toggle was not used): assessed from code only.
- The one-off edit screen, and the drill-downs from SumUp categories and the Charts averages.
- Firestore security rules and Firebase Auth settings, which live in the Firebase console and not in this repository.
- Behaviour on desktop widths (the layout is a single column with a maximum width of `3xl`) and on real devices.
