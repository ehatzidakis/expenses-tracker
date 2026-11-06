---
target: monthly view and one-offs view
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\ehatzidakis\\Test\\expenses-tracker\\src\\app\\app.html"
target_fingerprint: "sha256:4fb21b4e3d724a56edb7013c1f38cce73f8f980090ee1de8de12237a9851d459"
target_path: "C:\\Users\\ehatzidakis\\Test\\expenses-tracker\\src\\app\\app.html"
timestamp: 2026-11-06T09-46-40Z
slug: src-app-app-html
---
Method: dual-agent (A: design-review sub-agent · B: detector sub-agent). Source-only: no browser tool; app requires authenticated production data.

Target: Monthly tab and OneOffs tab (shell src/app/app.html plus month-selector, overview-card, category-breakdown, recent-transactions, transaction-list, adjustment-selector, singles-view, adjustment-card, trip-breakdown, edit-adjustment).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | No total budget and no "on track" signal. A trip's total is never shown as a number. |
| 2 | Match System / Real World | 2 | OneOffs/Singles/Adjustment/Additions/Subtractions/Bonus all name one idea. "Saved" on day 2 reads as fact. |
| 3 | User Control and Freedom | 3 | Back, Escape, Clear filters work. No undo after delete, edit placement varies. |
| 4 | Consistency and Standards | 2 | 3 edit placements, 2 transaction-row designs, 2 category-row designs, colours contradict. |
| 5 | Error Prevention | 3 | Delete confirm, validation. No end-date ≥ start-date check; no "close to budget" warning. |
| 6 | Recognition Rather Than Recall | 2 | Trip pills truncate at 6-7 chars; categories unsorted. |
| 7 | Flexibility and Efficiency | 1 | No month swipe, no "this month", Recent rows not tappable, Recent always starts collapsed. |
| 8 | Aesthetic and Minimalist Design | 2 | Nested cards, 12 rows incl. empty ones, repeated metadata. |
| 9 | Error Recovery | 1 | "Unable to load expenses data." with no retry or cause. |
| 10 | Help and Documentation | 1 | Nothing explains Saved, %, or 🔓/🔒. |
| **Total** | | **19/40** | **Poor** |

## Design Specificity Verdict

Design review: category-interchangeable. Indigo-violet gradient, glass panels, indigo-tinted hero card and tinted emoji chips are the default dark-dashboard look; the product's real nouns (month, wage, days left, trip, saved) don't shape the visuals. "N days left" is a 10px caption. Header subtitle "Breakdown & Analysis" is placeholder copy.

Detector: 0 errors, 31 advisory. 30 design-system-font-size (23×11px, 6×9px, 1×13px; most in overview-card-breakdown.component.ts), 1 design-system-color on "Updating..." (false positive: scanner had no Tailwind CSS). With --no-design-system, ai-color-palette flags the indigo→violet budget bar gradient (category-breakdown-item.ts:105). Coverage gap: .ts inline templates are regex-scanned only, so contrast/tiny-text element rules did not run; contrast measured manually in the design review.

Visual overlays: none (no browser).

## Overall Impression

Solid building blocks (tabular numbers, shared pill selectors, stealth blur, over/under in words), but the screen leads with the wrong number and OneOffs, which is also "a period with money in it", uses a completely different layout. Biggest opportunity: one shared period page with a visible pace as its signature.

## What's Working

- Shared selector vocabulary in utils/pill-styles.ts, keyboard accessible, Escape/outside-click, only offers periods with data.
- Category rows state over/under in text, tabular amounts, real buttons with aria-expanded.
- Unification started: shared TransactionListComponent, EditFormShellComponent, appSensitive everywhere.

## Priority Issues

1. [P1] Monthly doesn't answer "am I on budget?", and "Saved" misleads. Hero shows spent + saved (wage − category spend, overview-card.component.ts:94), excluding the month's one-offs and trips. No total budget, remaining or pace. Categories unsorted incl. empty; bars only in/over. Fix: "€X left of €Y · N days left" hero with pace bar + today tick; Saved includes one-offs and is labelled a projection; sort over → close (≥80%) → rest, fold empty categories; amber close state and today tick on each bar. Command: /impeccable layout.
2. [P1] Monthly and OneOffs are two different products. Summary: gradient hero vs 11px gray line (Singles) / list card that doubles as edit trigger (Trip). Breakdown rows: emoji avatar, h-2 indigo→violet bar, button vs no avatar, h-1.5 sky→indigo bar, rounded-2xl, div(click) (trip-breakdown.ts:93). Edit: replaces breakdown vs replaces whole tab (Singles) vs stacks above breakdown (Trip). Singles filter pills look like nav pills (7 look-alike pills). Loading/empty states differ. Fix: one period page (selector → summary → breakdown rows → transaction rows); "Trips | One-offs" segmented control; summary variants for month/trip/one-offs; one breakdown row and one transaction row, tappable; one edit pattern (bottom sheet preserving scroll). Command: /impeccable shape then /impeccable layout.
3. [P2] Colour semantics contradict. Trip spend in emerald (adjustment-card.component.ts:68); "€X left" in trip teal; action indigo used for data bars, trips use a different gradient; up to 3 solid indigo pills active. Fix: spend neutral; emerald/red only for net and over; one bar scheme neutral/amber/red; filter pills outlined. Command: /impeccable colorize.
4. [P2] Small faint text and small targets. gray-500 at 3.5–4.2:1 on its backgrounds, used at 9–11px (transaction-list.ts:63, recent-transactions.ts:65, adjustment-card.component.ts:55, singles-view.ts:105, trip-breakdown.ts:123). Pills ~34px, Back/Show more ~16px. div(click) adjustment cards and trip rows; no aria-current on tabs. Fix: gray-400, ≥11–12px, 44px targets, buttons, aria-current. Command: /impeccable harden.
5. [P2] Terminology sprawl: OneOffs, Singles, Adjustment, Additions, Subtractions, Bonus, One-Off Expense, Total Actual Spend. Fix: "One-offs" (income/expense) and "Trips"; "Spent". Command: /impeccable clarify.

## Persona Red Flags

- The Owner at month-end: Saved ignores one-offs and trips; no total budget vs spent; must tally 12 rows; no month-end verdict or last-month comparison.
- Alex: Recent collapsed every visit; edit requires category → expand → tap; 10-at-a-time nested scroller; no month swipe; older trips via year stepping.
- Sam: gray-500 9–11px fails contrast; trip cards/rows not keyboard/VoiceOver reachable; tabs lack aria-current; 🔓/🔒 no text; user-scalable=0 blocks zoom.
- Casey: selectors all at top; Back smallest target top-left; Recent ~1,200px down; opening a transaction loses scroll position.

## Minor Observations

- text-white-40 invalid class (category-breakdown-item.ts:39).
- budgetTitle computed but never rendered; topCategory input unused; trip chevron commented out.
- "over" 10px vs "left" 11px; two load-more styles; two date formats.
- Recent rows repeat month name and Added timestamp in month mode.
- Monthly blank when no months exist.
- black-translucent status bar without viewport-fit=cover or safe-area insets.
- Header ~56px on every tab for logo + generic subtitle.

## Questions to Consider

- One number on open: "left to spend" or "saved"?
- Swap labels to steps/calories: would anything look wrong?
- A trip is a period like a month: why not the same page?
- Should the 30px ceiling survive?
- Should one-offs live inside the month they happened in?

Proposed direction: "the month as a ruler" — day-ruler with today tick per period and on every bar; one large verdict hero; SF Pro Rounded or SF Mono figures; warm graphite surfaces with hairline ledger rows; colour only for verdicts.
