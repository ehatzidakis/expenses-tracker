# Budget History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep a dated history of category budgets so each month is judged by the budget that applied then, Charts compare each month with its own budget, and Settings shows each category's budget history.

**Architecture:** `users/{uid}.settings.budgetHistory` holds a sorted list of `BudgetPeriod`s (start month, full budget set, wage). Pure helpers in `src/app/utils/budget-history.ts` do lookup, save-merging and history summaries; `BudgetSettingsService` exposes a month-aware `getCategoryBudget(category, monthName?)`. A one-off script seeds the three real periods.

**Tech Stack:** Angular (standalone, signals), Firestore lite, Vitest via `ng test`, d3-scale (month chart).

**Spec:** `docs/superpowers/specs/2026-11-28-budget-history-design.md`

## Global Constraints

- Work on branch `budget-history`, not `main`. Don't stage the user's own uncommitted `DESIGN.md` / `.impeccable/design.json` changes.
- All time keeps using today's (latest) budget: `overallBudget` and the monthly-average comparison unchanged.
- Never write to `expenses` month records.
- Never delete commented-out code.
- Run tests from PowerShell after `Set-Location 'C:\Users\ehatzidakis\Test\expenses-tracker'` (uppercase C:) with `npx ng test --watch=false`; afterwards `git checkout src/environments/version.ts`.
- Amounts in new UI go through `appSensitive` (privacy mode).
- Month keys are `'YYYY-MM'` strings; month names are `'March 2025'`.

## Review Focus

1. Saving a change, then saving the old values again in the same month → no leftover period; history shows no change (test in Task 1).
2. A settings doc without `budgetHistory` (before seeding, older data) → every lookup returns today's single set, the app behaves as before (test in Task 2).
3. A month before the first period, or an unreadable month name → first period / latest period, never `null` budgets (test in Task 1).
4. Chart range spanning periods: Gym €70 in Feb 2026 (budget €100) is under, €70 in Jul 2026 (budget €62.50) is over; the line steps between them (test in Task 4).
5. Decimal budgets (62.50) compare equal after a round-trip through Firestore/number inputs; no phantom periods from float noise (compare in cents; test in Task 1).

---

### Task 1: Budget history helpers

**Files:**
- Create: `src/app/utils/budget-history.ts`
- Test: `src/app/utils/budget-history.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface BudgetPeriod { from: string; categoryBudgets: Record<string, number>; wage: number }
  export interface CategoryBudgetStep { amount: number; from: string; to: string | null }
  export interface PeriodSummary { from: string; to: string | null; wage: number; budgeted: number; left: number }
  export function monthKey(monthName: string): string | null        // 'March 2025' → '2025-03'
  export function monthKeyOf(date: Date): string                     // local month
  export function formatMonthKey(key: string): string               // '2026-03' → 'Mar 2026'
  export function periodFor(history: BudgetPeriod[], key?: string | null): BudgetPeriod | null
  export function withSavedPeriod(history: BudgetPeriod[], period: BudgetPeriod): BudgetPeriod[]
  export function categoryHistory(history: BudgetPeriod[], category: string): CategoryBudgetStep[] // newest first
  export function periodSummaries(history: BudgetPeriod[]): PeriodSummary[]                        // newest first
  ```
- Must not import `chart-data.ts` or `expense-state.service.ts` (avoids a circular import through `budget-settings.service.ts`).

- [ ] **Step 1: Write the failing tests** with fixture `H` = the three spec periods (`'2025-03'` 1400 set wage 1400, `'2026-03'` 1540 set wage 1540, `'2026-08'` Gym 65 / Supermarket 280 … wage 1600; full sets copied from the spec table, 1600 set = current `CATEGORY_BUDGETS` defaults).
  - `monthKey('March 2025')` → `'2025-03'`; `monthKey('nonsense')` → `null`; `formatMonthKey('2026-03')` → `'Mar 2026'`; `monthKeyOf(new Date(2026, 10, 28))` → `'2026-11'`.
  - `periodFor(H, '2026-02')!.categoryBudgets['Gym']` → 100; `'2026-03'` → 62.5; `'2026-07'` → 62.5; `'2026-08'` → 65; `'2024-01'` → 100 (before first → first); `null`/`undefined` → 65 (latest); `periodFor([], '2026-01')` → `null`.
  - `withSavedPeriod(H, {...latest, from: '2026-11', categoryBudgets: {...latest, Gym: 70}})` → length 4, last `from` `'2026-11'`.
  - Saving again in `'2026-11'` with Gym 75 → still length 4, last Gym 75 (replace).
  - Saving again in `'2026-11'` with Gym 65 (back to the Aug values) → length 3 (Review Focus 1).
  - Saving identical values to latest → returns an array deep-equal to `H` (no-op).
  - Saving Gym `62.50000000001` against a latest of 62.5 → no new period (Review Focus 5).
  - `categoryHistory(H, 'Gym')` → `[{amount:65, from:'2026-08', to:null}, {amount:62.5, from:'2026-03', to:'2026-07'}, {amount:100, from:'2025-03', to:'2026-02'}]`; `categoryHistory(H, 'Supermarket')` → one step `{amount:280, from:'2025-03', to:null}` (consecutive equal amounts merged).
  - `periodSummaries(H)` → 3 rows newest first; the 1400 row `{from:'2025-03', to:'2026-02', wage:1400, budgeted:1300, left:100}`; the 1540 row budgeted 1317.5, left 222.5.

- [ ] **Step 2: Run tests, expect FAIL** (module not found).
  Run: `npx ng test --watch=false --include src/app/utils/budget-history.spec.ts`

- [ ] **Step 3: Implement** in `src/app/utils/budget-history.ts`. Equality of two periods = same wage and same budget per category, compared in whole cents. `withSavedPeriod`: drop any existing period with `from >= period.from`, append `period`, then drop it again if it equals the period now before it. `to` of a period = month before the next period's `from`.

- [ ] **Step 4: Run tests, expect PASS.**

- [ ] **Step 5: Commit** — `git add src/app/utils/budget-history.ts src/app/utils/budget-history.spec.ts && git commit -m "Add budget history helpers"` (also add the spec + plan docs in this first commit).

---

### Task 2: Month-aware BudgetSettingsService

**Files:**
- Modify: `src/app/services/budget-settings.service.ts`
- Test: `src/app/services/budget-settings.service.spec.ts`

**Interfaces:**
- Consumes: Task 1 helpers.
- Produces:
  ```ts
  interface BudgetSettings { categoryBudgets: Record<string, number>; defaultTotalWage: number; budgetHistory: BudgetPeriod[] }
  normalizeBudgetSettings(value?): BudgetSettings   // history sorted by from, each entry filled to every CATEGORY_NAMES key; mirrors = latest period when history non-empty
  getCategoryBudget(category: string, monthName?: string): number | null
  readonly history: Signal<BudgetPeriod[]>          // computed from settings()
  saveSettings({ categoryBudgets, defaultTotalWage }, now?: Date): Promise<BudgetSettings>
  ```

- [ ] **Step 1: Write failing tests**
  - `normalizeBudgetSettings({ categoryBudgets: {...}, defaultTotalWage: 1600 })` → `budgetHistory` is `[]`, and a service with those settings returns the flat value for `getCategoryBudget('Gym', 'March 2025')` (Review Focus 2).
  - With history `H` set on `settings`: `getCategoryBudget('Gym', 'July 2026')` → 62.5; `getCategoryBudget('Gym')` → 65; `getCategoryBudget('Gym', 'garbage')` → 65 (Review Focus 3); unknown category → `null`.
  - `normalizeBudgetSettings` with an out-of-order, partial history → sorted, missing keys filled from `CATEGORY_BUDGETS`, `categoryBudgets` mirrors the latest.
  - `saveSettings({ categoryBudgets: {...latest, Gym: 70}, defaultTotalWage: 1600 }, new Date(2026, 10, 28))` without a signed-in user → resolved settings have 4 periods, last `from '2026-11'`, mirror Gym 70.

- [ ] **Step 2: Run, expect FAIL.** `npx ng test --watch=false --include src/app/services/budget-settings.service.spec.ts`

- [ ] **Step 3: Implement.** `getCategoryBudget` with a month: `periodFor(history, monthKey(monthName))`, falling back to `categoryBudgets` when history is empty. `saveSettings` builds `{ from: monthKeyOf(now), categoryBudgets, wage: defaultTotalWage }`, runs `withSavedPeriod`, and writes `settings.categoryBudgets`, `settings.defaultTotalWage` and `settings.budgetHistory` with `{ merge: true }`. `getDefaultTotalWage()` unchanged.

- [ ] **Step 4: Run, expect PASS.** Also run `budget-settings`, `expense-state` and `category-budget-cards` specs to see nothing else broke.

- [ ] **Step 5: Commit** — "Keep budget history in settings".

---

### Task 3: Budget tab months and transaction picker use each month's budget

**Files:**
- Modify: `src/app/services/expense-state.service.ts:370` (`buildCategoryBreakdown`)
- Modify: `src/app/components/create-transaction.component/create-transaction-form.component.ts:391` (`roomIn`)
- Test: `src/app/services/expense-state.service.spec.ts`

**Interfaces:**
- Consumes: `getCategoryBudget(category, monthName?)` from Task 2.

- [ ] **Step 1: Write failing test** in `expense-state.service.spec.ts`: replace the mock `getCategoryBudget: () => 280` in a new `describe` with `(name, month) => month === 'March 2025' ? 100 : 65`. Selecting the March 2025 record → `categoryBreakdown()` Gym budget 100; selecting `'ALL'` → `allTimeCategoryBreakdown()` Gym budget 65 (All time on today's budget).

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement.** In `buildCategoryBreakdown`: `isAllTime ? getCategoryBudget(name) : getCategoryBudget(name, expense.MonthName)`. In `roomIn(monthName)`: `getCategoryBudget(name, monthName)`.

- [ ] **Step 4: Run, expect PASS** (also the full `expense-state` and `create-transaction` specs).

- [ ] **Step 5: Commit** — "Judge each month by its own budget".

---

### Task 4: Charts compare each month with its own budget

**Files:**
- Modify: `src/app/utils/chart-data.ts` (`MonthTotal.budget` doc comment, `monthTotals`, `categoryAverages`)
- Modify: `src/app/components/charts-page/charts-page.ts:355`
- Modify: `src/app/components/charts-page/month-chart.ts` (budget line, bars, y-domain, legend)
- Test: `src/app/utils/chart-data.spec.ts`, `src/app/components/charts-page/month-chart.spec.ts`

**Interfaces:**
- Consumes: Task 2.
- Produces: `type BudgetFor = (category: string, monthName?: string) => number | null`; `monthTotals(expenses, budgetFor, now?)` and `categoryAverages(expenses, months, budgetFor)` take it. `MonthTotal.budget` = that month's total budget. `CategoryAverage.budget` = mean of the budgets of the averaged months (null if none of them has one).
- In `MonthChart`: `readonly budgetSegments: Signal<{ x1: number; x2: number; y: number }[]>` (one per run of consecutive months with equal budget, spanning their slots) replaces the flat budget line in spent mode; saved mode keeps the single zero line.

- [ ] **Step 1: Write failing tests**
  - `chart-data.spec.ts`: a month-aware `budgetFor` (Gym 100 for `'February 2026'`, 62.5 otherwise) over Feb and Jul 2026 records with Gym 70 → `monthTotals` gives different `budget` per month; `categoryAverages` Gym budget = 81.25.
  - `month-chart.spec.ts`: months Feb 2026 (budget 1300, spent 1310) and Jul 2026 (budget 1317.5, spent 1310) → Feb bar has an over segment, Jul doesn't; `budgetSegments()` has 2 entries with different `y` (Review Focus 4). Equal budgets → 1 segment.

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement.** `charts-page.ts`: `budgetFor = (name, month?) => this.budgets.getCategoryBudget(name, month)`. In `month-chart.ts`, replace each use of `budget()` in bars, `anyNegative`, the label lift and the y-domain with the month's own `m.budget` (y-domain includes every month's budget). Draw `budgetSegments` as horizontal `<line>`s with the same classes as today's budget line. The legend shows the **selected month's** budget (`Budget €1,318`). Update the `budget` doc comment.

- [ ] **Step 4: Run, expect PASS** (whole `charts-page` folder + `chart-data`).

- [ ] **Step 5: Commit** — "Chart each month against its own budget".

---

### Task 5: Budget history in Settings

**Files:**
- Modify: `src/app/components/category-budgets-grid/category-budget-cards.ts` (read mode: expandable history per category)
- Create: `src/app/components/category-budgets-grid/budget-periods.ts` (period summary list)
- Modify: `src/app/components/category-budgets-grid/category-budgets-grid.ts` (pass history; render `<app-budget-periods>` below the cards when not editing)
- Test: `src/app/components/category-budgets-grid/category-budget-cards.spec.ts`, create `budget-periods.spec.ts`

**Interfaces:**
- Consumes: `categoryHistory`, `periodSummaries`, `formatMonthKey` (Task 1); `BudgetSettingsService.history` (Task 2).
- Produces: `CategoryBudgetCardsComponent` input `history = input<BudgetPeriod[]>([])`; `BudgetPeriodsComponent` (`app-budget-periods`) input `history = input.required<BudgetPeriod[]>()`.

Copy (fixed):
- Toggle on a category row with more than one step: `History`; step lines `€65.00  since Aug 2026` / `€62.50  Mar 2026 – Jul 2026`.
- Period section heading `Periods`; row: range (`Aug 2026 –` for the open one), `Wage €1,600.00`, `Budgeted €1,330.00`, `Left €270.00` (left in `text-avocado` when ≥ 0, `text-cherry` when < 0, as in `category-budget-summary`).

- [ ] **Step 1: Write failing tests**
  - cards: with history `H`, not editing → Gym row has a `History` button; clicking it shows `since Aug 2026` and `Mar 2026 – Jul 2026`; Supermarket row has no `History` button; editing mode shows no history.
  - periods: with `H` → 3 rows, first contains `Aug 2026`, last contains `€100.00`; every amount element carries `appSensitive`.
  - periods: with a single-period history → section not rendered.

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement.** The history toggle is a real `<button>` with `aria-expanded`, min 44px target, styling from the existing rows (`text-ink-3`, `text-[12px]`, `tabular-nums`) per DESIGN.md. Expansion inline under the row; no new modal. Amounts use `appSensitive="xs"`.

- [ ] **Step 4: Run, expect PASS.** Then start the app (`npm start`) and check Settings in read mode, edit mode and privacy mode at a phone width.

- [ ] **Step 5: Commit** — "Show budget history in Settings".

---

### Task 6: Seed the three periods

**Files:**
- Create: `scripts/data-fix/seed-budget-history.mjs`

**Interfaces:**
- Consumes: `connect()`, `ask()`, `BACKUP_ROOT`, `backupFolderName()`, `CATEGORY_NAMES` from `scripts/data-fix/common.mjs`; `doc`, `getDoc`, `setDoc` from `firebase/firestore/lite`.

Behaviour (fixed):
1. Read `users/{uid}`. If `settings.budgetHistory` is a non-empty array → print "Budget history already exists, nothing to do" and exit.
2. Save the whole `users/{uid}` doc to `BACKUP_ROOT/<backupFolderName()>-budget-history/user.json`.
3. Build: `{from:'2025-03', wage:1400, categoryBudgets: <1400 set from the spec>}`, `{from:'2026-03', wage:1540, categoryBudgets: <1540 set>}`, `{from:'2026-08', wage: settings.defaultTotalWage, categoryBudgets: settings.categoryBudgets}` (fall back to the app defaults when missing, and say so). Every set must contain every `CATEGORY_NAMES` key, or abort.
4. Print each period with its total and left to save (1300.00 / 100.00, 1317.50 / 222.50, …), ask `Write this budget history? (yes/no)`, write only on `yes` with `setDoc(ref, { settings: { budgetHistory } }, { merge: true })`.

- [ ] **Step 1: Write the script.** `node --check scripts/data-fix/seed-budget-history.mjs` passes.
- [ ] **Step 2: Commit** — "Add one-off budget history seed script".
- [ ] **Step 3: Hand over to the user to run** `node scripts/data-fix/seed-budget-history.mjs` (it signs in interactively). After it runs, confirm in the app: Feb 2026 Gym shows `/ €100.00`, Jul 2026 shows `/ €62.50`, Settings → Gym shows its history.

---

### Task 7: Full verification

- [ ] **Step 1:** Full test run from PowerShell (`C:\`): `npx ng test --watch=false` → all specs pass. `git checkout src/environments/version.ts`.
- [ ] **Step 2:** `npx ng build` → succeeds with no new warnings.
- [ ] **Step 3:** Whole-branch review (superpowers:requesting-code-review), fix findings, commit.
