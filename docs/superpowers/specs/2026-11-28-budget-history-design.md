# Budget history

Date: 2026-11-28 · Status: awaiting approval

## Why

Category budgets are stored as one set. Changing a budget today silently re-judges every past
month: a month that was over a €40 Cats budget looks fine once Cats is €50. The user wants each
month judged by the budget that applied at the time, and wants to see how each category's budget
has changed over time.

## Goals

- A budget change applies to the **current calendar month and every later month**; earlier months
  keep the budget they had.
- Seed the real history as three periods (they line up with the wage already stored on every month
  record):

  | Category      | 1400 (Mar 2025–Feb 2026) | 1540 (Mar 2026–Jul 2026) | 1600 (Aug 2026–) |
  | ------------- | -----------------------: | -----------------------: | ---------------- |
  | Supermarket   | 280.00 | 280.00 | as saved in the app today |
  | Medical       | 210.00 | 200.00 | 〃 |
  | Personal      | 150.00 | 200.00 | 〃 |
  | EatingOut     | 140.00 | 140.00 | 〃 |
  | Utilities     | 100.00 | 100.00 | 〃 |
  | Takeaway      |  90.00 |  90.00 | 〃 |
  | Tickets       |  80.00 |  75.00 | 〃 |
  | Gaming        |  70.00 |  75.00 | 〃 |
  | Cats          |  40.00 |  50.00 | 〃 |
  | Travel        |  25.00 |  30.00 | 〃 |
  | Subscriptions |  15.00 |  15.00 | 〃 |
  | Gym           | 100.00 |  62.50 | 〃 |
  | **Total**     | 1300.00 (save 100.00) | 1317.50 (save 222.50) | |

- Single months (Budget tab, month mode) show and compare against that month's own budget.
- Charts compare each month with its own budget.
- Settings shows the history of each category's budget.

## Non-goals

- **All time stays on today's budget.** It is an aggregate the user reads to decide whether today's
  budgets need correcting. `overallBudget` and the monthly-average comparison are unchanged.
- No editing or deleting of past periods in the app. History changes only by saving the editor
  (which affects this month onward) or by a script.
- The editor's wage still only sets the default wage for new month records; it does not rewrite
  any month's stored `TotalWage`.
- Trips and one-offs have no budgets; nothing changes there.

## Anti-goals

- Any past month's over/under result changing because of a budget edit made later.
- Touching the `expenses` month records (they were just reconciled, see 2026-11-23).

## Approaches considered

- **A. Dated list of budget sets in the user's settings — chosen.** `users/{uid}.settings` gains a
  list of entries, each with a start month, a full set of budgets and the wage. A month uses the
  latest entry starting on or before it. One small document the app already loads; seed once;
  per-category history is a diff between neighbouring entries.
- B. Copy the budget onto each month record. Easy lookup, but backfills every month record, makes a
  budget save rewrite the current month record (which transactions also update), and history needs a
  scan of all months.
- C. One record per change ("Gym → €65 from Aug 2026"). Mirrors the mental model, but a month's full
  budget has to be reassembled from many records; more reads, no gain over A.

Chosen: A (user and Claude agreed).

## Design

### Data

`users/{uid}.settings`:

```ts
interface BudgetPeriod {
  from: string;                          // 'YYYY-MM', first month this set applies to
  categoryBudgets: Record<string, number>; // full set, every CATEGORY_NAMES key
  wage: number;
}

interface BudgetSettings {
  categoryBudgets: Record<string, number>; // kept: mirror of the latest period
  defaultTotalWage: number;                // kept: mirror of the latest period's wage
  budgetHistory: BudgetPeriod[];           // new, sorted by `from` ascending
}
```

The mirrored fields stay so anything still reading them keeps working, and so a settings doc
without `budgetHistory` still loads.

### Lookup

`BudgetSettingsService.getCategoryBudget(category, monthName?)`:

- No month given → latest period (today's budget). Used by All time and the editor.
- Month given (e.g. `'March 2025'`) → the latest period with `from <= that month`. A month before
  the first period uses the first period.
- Missing `budgetHistory` → behave exactly as today (single set).

### Saving

Saving the editor writes a period starting at the **current calendar month** (device date):

- If the latest period already starts this month, replace it (saving twice in a month keeps the
  last save).
- If nothing changed compared to the latest period, write nothing new.
- Otherwise append. Then update the mirrored `categoryBudgets` / `defaultTotalWage`.

### Where each screen gets its budget

| Place | Budget used |
| --- | --- |
| Budget tab, month mode (`buildCategoryBreakdown` for a month) | that month's period |
| Budget tab, All time | latest period (unchanged) |
| Add/edit transaction category picker ("€x left / over") | period of the transaction date's month |
| Charts, per-month totals (`monthTotals`) | each month's own total budget |
| Charts, month chart budget line | steps per month instead of one flat line; over-budget colouring per month |
| Charts, category averages vs budget | average of the budgets of the months in the selected range |
| Settings editor and "Left to save" | latest period |

`chart-data.ts` takes a month-aware `budgetFor(category, monthName)`.

### Settings: history view

The budget list in Settings (read mode) lets each category open a short history, newest first.
Categories that never changed show none. Proposed text sketch:

```
Gym                                   €65.00
  ▸ History
      €65.00     since Aug 2026
      €62.50     Mar 2026 – Jul 2026
      €100.00    Mar 2025 – Feb 2026
```

Below the list, a compact period summary:

```
Periods
  Aug 2026 –           wage €1,600   budgeted €1,330.00   left €270.00
  Mar 2026 – Jul 2026  wage €1,540   budgeted €1,317.50   left €222.50
  Mar 2025 – Feb 2026  wage €1,400   budgeted €1,300.00   left €100.00
```

Amounts go through `appSensitive` like the rest of the screen, so privacy mode hides them. The
visual treatment follows DESIGN.md (Teak & Smoked Glass); the builder decides details.

### Seeding

A one-off script in `scripts/` (same pattern as `scripts/data-fix/`: signs in with the client SDK,
backs up `users/{uid}` to `../expenses-backups/` first, prints the plan, asks for confirmation)
writes `budgetHistory`:

1. `from: '2025-03'`, the 1400 set, wage 1400
2. `from: '2026-03'`, the 1540 set, wage 1540
3. `from: '2026-08'`, the budgets and wage currently saved in the app

It refuses to run if `budgetHistory` already exists.

## Constraints

- Angular + signals, Firestore lite, existing `BudgetSettingsService` as the single source.
- Run tests from uppercase `C:\` in PowerShell (Vitest runner path issue).
- Don't delete commented-out code.
- PWA zoom lock stays as is.

## Left to the builder

- Exact markup and motion of the history view within DESIGN.md.
- Month-key parsing helpers (reuse `parseMonthName` in `chart-data.ts` where it fits).
- Test coverage: lookup boundaries (first month of a period, month before first period, no history),
  save replace/append/no-op, chart per-month budgets.

## Calls Claude made (check these)

1. The period summary also shows the wage and what was left to save, because the user quoted
   "left to save" for each period.
2. Charts' category averages compare against the average of the in-range months' budgets.
3. Saving twice in one month replaces that month's entry rather than adding a second one.
4. The category picker when adding a transaction uses the budget of the transaction's month.
5. Seeding is a one-off script with a backup and confirmation, not code that ships in the app.
6. The mirrored current-budget fields stay in settings so nothing reading them breaks.
