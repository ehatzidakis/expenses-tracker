---
version: 1
slug: "src-app-app-html"
primary_target: "src/app/app.html"
related_targets: ["src/app/app.ts"]
---

# Surface brief: whole app, centred on the Budget page

Mode: Operate. Built code-led.

## Scope
- All admin screens: Budget (months, trips and one-offs merged), All time, Add, Charts, header, docked tab bar, modals (Settings, Splitzes, confirm, edit), sign-in, kiosk shell.
- The redesign is visual and structural only. Data, calculations, Firestore, stealth behaviour and the kiosk flow stay as they are.

## Audience and task
- The owner, at home in the evening, on the iPhone home-screen PWA.
- They want to know, at a glance, whether this month is on budget, what a trip cost, and what one-offs did to the year.

## Decisions
- Tabs: Budget, All time, Add, Charts. A "Month | Trips | One-offs" switch sits inside Budget.
- "Saved from monthly budget" keeps the current maths: wage minus category spend.
- Pace = budget × day ÷ days in month. "Ahead of pace" means spent above pace but still under budget.
- Trip summary shows the total, the number of days and the spend per day, plus an Edit trip button.
- One-offs summary shows In / Out / Net, with an income/expense filter as a separate control.
- Category emoji stay, small and muted.
- Copy uses "Spent", "Month / Trips / One-offs". "Adjustment", "Singles", "Additions" and "Subtractions" are retired from the UI.

## Direction contract
THESIS: A household budget read like a 70s living room after dark. The month is one warm, lamplit summary and a quiet list ranked by trouble. This refuses the category default: an indigo-glass fintech dashboard of equal cards.

OWN-WORLD:
- Grounds: near-black walnut #120D0A. Smoked-glass panels #1C1511 / #261D17, used only for the summary and the tab bar.
- Ink: cream #F1E6D2.
- Colour: burnt orange #E5703A is selection. Avocado #8FA35A means on pace. Cherry #F0566B means over.
- Type: Archivo Expanded for figures and headings, system UI for text.
- Rows sit straight on the ground with hairlines between them. No cards inside cards, no yellow, no glow.

STORY: You open the app and read "€412 left · 12 days to go". The racing stripe shows how far through the budget you are against today's notch. Then you see which categories are over or ahead, and tap one to see its spending.

FIRST VIEWPORT:
- Compact header: EXPENSES in wide caps, with Splitz and ME on the right.
- The Month | Trips | One-offs switch, then the period pills.
- A smoked-glass summary: "€412 left" at about 40px wide, days to go, the triple stripe notched at today, the pace caption, and "Saved from monthly budget".
- Category rows sorted over → ahead → on pace.
- The docked tab bar.
- Signature: the 70s triple racing stripe (orange / rust / umber) as every budget bar, drawn on one fixed scale with a cream notch at pace.

FORM: Teak & Smoked Glass. The user chose it from the safer re-roll lineup (candidate 1 of 3), with the steer "darker". seed:35cc468a570bedda

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
