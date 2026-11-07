---
target: Budget tab (Month, Trips, One-offs), with Add and Charts scored alongside
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:C:\\Users\\ehatzidakis\\Test\\expenses-tracker\\src\\app\\app.html"
target_fingerprint: "sha256:47c56a2d611970c8fe93a7adff767e179520267ddf4f25cbc01d6f20481fe9bd"
target_path: "C:\\Users\\ehatzidakis\\Test\\expenses-tracker\\src\\app\\app.html"
timestamp: 2026-11-07T00-31-47Z
slug: src-app-app-html
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent). Browser overlay skipped: no browser automation exposed.

Target: Budget tab (Month | Trips | One-offs) in src/app/app.html, the successor of the Monthly + OneOffs views scored 19/40 on 2026-11-06. Add (26/40) and Charts (27/40) were scored alongside for the first time.

## Design Health Score (Budget)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | No total budget / left figure; Incoming invisible; no feedback after an edit saves |
| 2 | Match System / Real World | 3 | "ahead of pace", "quiet" are app words; "saved this month" reads as final mid-month |
| 3 | User Control and Freedom | 3 | No undo after delete; sheet grabber not draggable |
| 4 | Consistency and Standards | 3 | One-offs still breaks the page contract |
| 5 | Error Prevention | 2 | Editable trip amount disagrees with breakdown; no end ≥ start check; Delete under Save |
| 6 | Recognition Rather Than Recall | 3 | Must remember budget and wage to judge the hero |
| 7 | Flexibility and Efficiency | 2 | No month swipe; Recent collapsed each visit; 3-step edit |
| 8 | Aesthetic and Minimalist Design | 3 | Orange "ahead of pace" noise on tiny amounts |
| 9 | Error Recovery | 3 | Transaction-list error has no retry button |
| 10 | Help and Documentation | 1 | Nothing explains the notch, pace or what saved includes |
| **Total** | | **26/40** | **Good** |

Add 26/40 (prevention 2, consistency 2, control 2). Charts 27/40 (flexibility 2, error recovery 2, help 2).

## Design Specificity
Mostly authored. Add's category tiles with room left and the after-save impact line are the most product-specific; Charts' wage marks show wage-based saving; Budget's notch, days to go and quiet fold are specific, but the hero layout is the category default; One-offs is generic. Detector: 4 advisory findings, 0 true positives (20px and 32px are documented steps; the toast colour reading is a token-resolution false positive).

## Priority Issues
1. [P1] Trip creation trap (Add): new trip defaults Closed; "Open one from the One-off tab" points to a tab that no longer exists; no last day ≥ first day check. Fix: default Open, rename to "Accepting expenses", correct the copy, validate dates. /impeccable harden
2. [P1] Trip total disagrees with its breakdown: headline is the editable stored amount, rows sum the transactions; Edit trip exposes Amount, Type and Trip. Fix: derive the headline from transactions or show "€X not itemised"; Edit trip keeps name, dates and Open/Closed. /impeccable harden, /impeccable distill
3. [P1] Pending (Splitzes › Incoming) invisible on Budget: no badge on Splitz, no line in the month panel. Fix: count badge plus a "N waiting for review · €X" line. /impeccable harden
4. [P1] Charts typical costs show "No bills yet" while loading or after failure. Fix: skeleton rows and an error line with Try again. /impeccable harden
5. [P2] "Ahead of pace" over-triggers on fixed bills (no threshold). Fix: a 10% / €5 threshold, or paid/due for fixed bills. /impeccable clarify

## User decisions the review pushed back on (not counted as issues)
No "left of budget" figure on Budget (commented out by the user); saved = wage − spent excludes one-offs and trips and reads as final; zoom locked; Recent collapsed by default; categories sorted by amount.

## Persona Red Flags
- Owner at home: computes "left" from the bar; saved ignores one-offs; pending invisible; false orange flags; Charts shows "left to spend" but Budget doesn't.
- Casey: Add button below the fold; switches at the top; sheet dismiss only at the top; Delete under Save.
- Alex: no month swipe; required description with a mute disabled button; Recent collapses; no undo.
- Sam: aria-pressed vs DESIGN.md's role="tab"; verdict only in the bar's aria-label; "under" rows in Charts have no text status.

## Minor Observations
Add: description required with no reason shown; trip toggle clears the category; duplicate subcategory and recurring pills; add and edit forms differ. One-offs: summary above filters; negative Net in cherry. All time: avocado display figure and status lines; two different "saved" figures. Charts: Title Case "Supermarket Visit"/"Takeaway Order". Raw amounts ("108.4") in edit fields; generic delete confirmation.

## Questions to Consider
- Should the big number be "€X left" with spent as the caption?
- Should fixed bills be judged paid/due rather than on pace?
- Should tapping a Charts column open that month in Budget?
