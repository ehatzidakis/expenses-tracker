---
version: 1
slug: "dal-component-settings-modal-component-ts-4cc05e36"
primary_target: "src/app/components/settings-modal.component/settings-modal.component.ts"
related_targets: ["src/app/components/splitzes-modal.component/splitzes-modal.component.ts","src/app/components/kiosk-shell/kiosk-shell.component.ts"]
---

## Scope

Polish pass (step 4) over the surfaces that only got a colour swap: Settings, Splitzes, the kiosk screens, the shared edit fields and confirm dialog, and the leftovers listed in the plan. Operate mode. Same Teak & Smoked Glass world from DESIGN.md; no new direction. Behaviour, logic and data flow stay as they are.

## Audience and job

The owner managing settings, budgets, debts and incoming kiosk items, and the kiosk user answering requests, on an iPhone. Success: these screens feel like the rebuilt tabs, read and tap the same way, and nothing about how they work changes.

## Confirmed answers (2026-11-06)

- Settings and Splitzes open as the shared bottom sheet. Budgets and wage opens as a sub-view inside the Settings sheet with a Back row, not a second sheet.
- Stealth mode and Notifications stay on/off switches, restyled, with a 44px hit area and switch semantics.
- Docs: PRODUCT.md and docs/backlog.md updated; DESIGN.md through the documenter at the end.

## Direction contract

THESIS: One room, no annexes. Every secondary surface uses the same sheet, rows, switches and buttons as the rebuilt tabs; it refuses the floating card-in-a-card modal and its private styling.

OWN-WORLD: Smoked-glass sheet with the shared grabber and close. Inside it, hairline rows on the panel with a 15px label and a 12px caption. On/off is a palette switch with an ember track. Actions are the shared 48px ember primary, 44px teak-edge secondary and cherry-outline danger buttons. Messages sit in cherry-deep or avocado-deep wells. Confirmations are a centred smoked-glass dialog on the walnut scrim. Amounts are cream, avocado for money owed to me, and never ember-soft.

STORY: Open Settings, flip stealth, step into Budgets and back; open Splitzes, see who owes whom in plain rows, settle with one clear confirmation; the kiosk user reads requests as rows and answers them in the same edit form.

FIRST VIEWPORT: Settings sheet: wide "Settings" title, then the stealth switch row, passcode row, Budgets and wage row with a chevron, notifications row; data export, sign out and the version follow. Splitzes sheet: wide "Splitzes" title, the Balances | Incoming | History segments, then person rows.

FORM: Shared-sheet settings ledger, extended from the confirmed redesign; the roll was taken for the record, the structure was not re-opened. seed:90fa7ede28b7fe1a

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions

- None. Production Firestore: visual checks only through the mocked preview harness.
