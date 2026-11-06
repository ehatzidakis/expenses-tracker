---
version: 1
slug: "component-create-transaction-component-ts-8bb96fdb"
primary_target: "src/app/components/create-transaction.component/create-transaction.component.ts"
related_targets: []
---

## Scope

The Add tab (admin and kiosk): new transaction, new one-off or trip. Operate mode. Extends the existing app surface (`src/app/app.html`) inside the Teak & Smoked Glass world in DESIGN.md; no new visual world.

## Audience and job

The owner logging a purchase on the iPhone right after paying, one-handed; the kiosk user submitting a shared cost for review. Success: saved in seconds, and the owner sees what it did to the month.

## Confirmed answers (2026-11-06)

- Amount leads the form; categories become a button grid, not a dropdown.
- Always visible: split with people, recurring quick-picks. Folded behind "More options": link to trip, comment, send to kiosk.
- After save: stay on Add, clear the form (keep the date), show the month impact.

## Direction contract

THESIS: Logging is a till, not a form. The amount is the headline and the category grid is the keyboard; it refuses the stacked label-over-dropdown form with a card around it.

OWN-WORLD: Walnut ground, no wrapping card. Amount in wide Archivo at display size with a cream-3 euro sign. Category tiles sit on the ground in a 3-column grid with teak-edge borders, a muted emoji, a cream label and a 12px "€X left" (cherry "€X over"); the picked tile takes the ember well with an inset ember ring. Split people and recurring picks are 44px pills from the shared pill styles. One solid ember Save.

STORY: Type the amount, tap the category while seeing what is left in it, adjust split if needed, save; the confirmation line says where that category now stands this month.

FIRST VIEWPORT: Transaction | Trip | One-off switch at the top, in the Budget page's Month | Trips | One-offs order; the amount figure under it; the 12-tile grid filling the middle with its left-this-month figures; recurring picks begin below the fold edge. Save sits at the end of the always-visible block.

FORM: Amount-led till with a category keyboard, the user's confirmed shape (first on the list; the roll was taken for the record, the structure was not re-opened). seed:ca58494279fae177

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions

- None open. Keypad cannot auto-open on iOS without a tap; accepted.
