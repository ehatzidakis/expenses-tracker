---
name: Expenses Tracker
description: A dark, dense pocket console for one household's monthly budget.
colors:
  signal-indigo: "oklch(58.5% 0.233 277.117)"
  signal-indigo-deep: "oklch(51.1% 0.262 276.966)"
  signal-violet: "oklch(54.1% 0.281 293.009)"
  signal-indigo-text: "oklch(78.5% 0.115 274.713)"
  trip-teal: "oklch(77.7% 0.152 181.912)"
  trip-teal-deep: "oklch(60% 0.118 184.704)"
  saved-emerald: "oklch(76.5% 0.177 163.223)"
  saved-emerald-soft: "oklch(84.5% 0.143 164.978)"
  overspend-red: "oklch(70.4% 0.191 22.216)"
  overspend-red-strong: "oklch(63.7% 0.237 25.331)"
  overspend-red-deep: "oklch(57.7% 0.245 27.325)"
  overspend-rose-deep: "oklch(45.5% 0.188 13.697)"
  pending-amber: "oklch(87.9% 0.169 91.605)"
  night-base: "oklch(13% 0.028 261.692)"
  console-panel: "oklch(21% 0.034 264.665)"
  raised-slate: "oklch(27.8% 0.033 256.848)"
  field-fill: "oklch(27.8% 0.033 256.848 / 0.6)"
  control-edge: "oklch(37.3% 0.034 259.733)"
  ink-white: "#ffffff"
  ink-primary: "oklch(96.7% 0.003 264.542)"
  ink-body: "oklch(87.2% 0.01 258.338)"
  ink-secondary: "oklch(70.7% 0.022 261.325)"
  ink-muted: "oklch(55.1% 0.027 264.364)"
  ink-faint: "oklch(44.6% 0.03 256.802)"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
    fontFeature: "'tnum'"
  headline:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  body-compact:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "0.05em"
  micro:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  tab-clearance: "112px"
components:
  button-primary:
    backgroundColor: "{colors.signal-indigo}"
    textColor: "{colors.ink-white}"
    typography: "{typography.title}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  button-secondary:
    backgroundColor: "{colors.raised-slate}"
    textColor: "{colors.ink-body}"
    typography: "{typography.body-compact}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
  button-danger:
    backgroundColor: "{colors.overspend-red-strong}"
    textColor: "{colors.ink-white}"
    typography: "{typography.body-compact}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
  pill:
    backgroundColor: "{colors.console-panel}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body-compact}"
    rounded: "{rounded.xl}"
    padding: "8px 16px"
  pill-active:
    backgroundColor: "{colors.signal-indigo-deep}"
    textColor: "{colors.ink-white}"
    typography: "{typography.body-compact}"
    rounded: "{rounded.xl}"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.field-fill}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.console-panel}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  category-row:
    backgroundColor: "{colors.night-base}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.xl}"
    padding: "6px 12px"
  tab-bar:
    backgroundColor: "{colors.console-panel}"
    rounded: "{rounded.full}"
    padding: "6px"
  tab-active:
    backgroundColor: "{colors.signal-indigo}"
    textColor: "{colors.ink-white}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    padding: "8px 14px"
  badge-saved:
    textColor: "{colors.saved-emerald-soft}"
    typography: "{typography.body-compact}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
---

# Design System: Expenses Tracker

## Overview

**Creative North Star: "The Pocket Console"**

A compact control panel held in one hand. The app is a dense, dark readout of one household's month: a stack of low-light gray panels, small precise type, and numbers set in tabular figures so columns of euros line up. Controls float above the content as glassy, rounded objects (the pill tab bar, modals) and respond to a press by shrinking slightly, like physical buttons.

Colour is functional. One accent, **Signal Indigo** (blending into violet on gradients), marks what is selected or what will act. Emerald means money kept, red means money over, amber means waiting. Everything else is gray, so the moment a hue appears it carries meaning. The only place colour is used for personality is the category set, where each category gets its own soft tinted circle with an emoji.

The feel is compact and efficient, polished and modern. Density is deliberate: a phone screen should show the whole month's picture with minimal scrolling. Polish comes from consistent radii, translucent layering, hairline borders and small press animations, not from decoration.

**Key Characteristics:**
- Dark-only. Every surface is a step on one cool gray ramp.
- One action colour (Signal Indigo), with semantic colours for saved, over-budget and pending.
- Small type: most text is 10 to 12px; the month's headline figure is the largest thing on screen at 30px.
- Tabular numbers for every amount.
- Rounded, tactile controls (12px corners) that scale down on press.
- Floating, blurred chrome (tab bar, modals) over tonally layered content.

## Colors

A cool, near-black gray ramp carries the whole interface; saturated colour is reserved for action and money states.

### Primary
- **Signal Indigo** (`signal-indigo`, Tailwind indigo-500): the action and selection colour. Start of the indigo-to-violet gradient on the active tab, primary Save/Submit buttons and in-budget progress bars. Also the 2px focus ring at 60% opacity on every field, and the small unread dot on the header avatar.
- **Signal Indigo Deep** (`signal-indigo-deep`, indigo-600): solid fill for the selected pill (month, trip, filter) and for solid secondary actions like the stealth unlock button.
- **Signal Violet** (`signal-violet`, violet-600): end stop of the action gradient. Never used on its own.
- **Indigo Readout** (`signal-indigo-text`, indigo-300): text on indigo-tinted chips and badges (e.g. the "remaining" budget badge).

### Secondary
- **Trip Teal** (`trip-teal`, teal-400; `trip-teal-deep`, teal-600): trips and shared-cost entry points. The Splitzes button in the header, the dashed "More" picker for older months and trips, and the trip-link toggle. Used as a translucent tint (teal-600 at 20%, teal-500 border at 30%), not a solid fill.

### Tertiary (semantic)
- **Saved Emerald** (`saved-emerald`, emerald-400; `saved-emerald-soft`, emerald-300): money kept. The "Total Saved" figure when positive, "under budget" badges, accepted states.
- **Overspend Red** (`overspend-red`, red-400): money over and errors. A negative "Total Saved", over-budget amounts, field validation text. `overspend-red-strong` (red-500) and the deep red-600 to rose-800 pair form the danger button and over-budget progress bar gradients.
- **Pending Amber** (`pending-amber`, amber-300): waiting items such as pending review and kiosk requests.

### Neutral
- **Night Base** (`night-base`, gray-950): the page background, the app's theme colour and the base of inset wells (segmented controls at 80%).
- **Console Panel** (`console-panel`, gray-900): cards, modals, idle pills and the tab bar (at 70% with blur).
- **Raised Slate** (`raised-slate`, gray-800): the hairline border on almost every container, secondary button fill, progress-bar track, and (at 60%) the fill of every input as `field-fill`.
- **Control Edge** (`control-edge`, gray-700): stronger borders on interactive controls and hover edges.
- **Ink White** (`#ffffff`): hero figures, headings, text on accent fills.
- **Ink Primary** (`ink-primary`, gray-100): default body text and input values.
- **Ink Body** (`ink-body`, gray-300): row names and secondary values.
- **Ink Secondary** (`ink-secondary`, gray-400): the most common text colour. Labels, captions, idle tabs.
- **Ink Muted** (`ink-muted`, gray-500): helper text, empty states, minor metadata.
- **Ink Faint** (`ink-faint`, gray-600): placeholders only.

### Category tints
The twelve categories each map to one Tailwind hue (emerald, rose, violet, amber, yellow, orange, sky, cyan, pink, indigo, fuchsia, teal, with slate as fallback), always applied the same way: hue-500 at 15% fill, hue-200 text, hue-400 at 20% border. The mapping lives in `CATEGORY_META` (`src/app/services/expense-state.service.ts`); add to it rather than styling categories inline.

### Named Rules
**The One Signal Rule.** Indigo means "selected" or "this will act". Do not use it for decoration, headings or data series that are not selectable.

**The Money Colour Rule.** Emerald and red are claims about money (kept vs over) or validity (ok vs error). Never use them for anything else, and never show a money figure in emerald or red unless its sign or budget status warrants it.

**The Tint, Don't Fill Rule.** Status and category colour appears as a translucent tint (500 at 10 to 20% fill, 200 or 300 text, 400 or 500 at 20 to 30% border). Solid saturated fills are reserved for the active tab, primary and danger buttons, and the selected pill.

## Typography

**Body Font:** the system UI stack (Tailwind's default `ui-sans-serif, system-ui, sans-serif` plus emoji fonts), which renders as SF Pro on the iPhone.
**Label/Mono Font:** none. Numbers use the same family with tabular figures.

**Character:** native and unbranded. The type stays out of the way so numbers read cleanly; hierarchy comes from weight and size steps, not from a display face.

### Hierarchy
- **Display** (800, 1.875rem / 30px, tight tracking, tabular): the month's hero figure in the overview card ("spent", "saved"). One or two per screen at most.
- **Headline** (700, 1.25rem / 20px, tight tracking): the app title in the header. Rare.
- **Title** (600, 0.875rem / 14px): modal titles, primary button labels, card titles.
- **Body** (400, 0.875rem / 14px): input values, category names, list item primary text.
- **Body Compact** (500, 0.75rem / 12px): the workhorse size. Pills, secondary buttons, field labels, most list text.
- **Label** (500, 0.75rem / 12px, uppercase, 0.05em tracking): section headings on cards ("Total Spent"). Some smaller badges and toasts use 10px uppercase with wider tracking (0.12 to 0.22em).
- **Micro** (500, 0.625rem / 10px; also 11px): tab labels, meta lines, transaction counts, validation messages.

### Named Rules
**The Tabular Rule.** Every money figure uses tabular numbers (`tabular-nums`), so amounts align in rows and do not jitter as they change.

**The 30px Ceiling Rule.** Nothing is larger than the Display figure. If a new screen needs emphasis, use weight or colour, not a bigger size.

## Layout

A single centred column, mobile-first. The admin shell is `max-w-md` (448px) with a 16px gutter (`p-4`); from the `md` breakpoint (768px) it widens to `max-w-3xl` (768px) with 32px padding. Content stacks vertically with 16px gaps between major blocks.

Spacing follows Tailwind's 4px base, and the app lives at the small end of it: 8px and 12px are the common gaps and paddings inside components, 16 to 20px inside cards, 24px between overview columns. Rows and controls are compact (8 to 10px vertical padding).

The tab bar floats 16px above the bottom edge, so the page reserves 112px of bottom padding (`tab-clearance`, `pb-28`). Long forms also use `scroll-mb-32` so focused fields scroll clear of it.

Horizontal pill rows (months, trips, filters) do not wrap: pills keep their width and the row scrolls, or quick pills share the row equally with a 1.5x-wide "More" picker at the end (`src/app/utils/pill-styles.ts`).

## Elevation & Depth

Depth is mostly tonal. Surfaces step up the gray ramp (night base, then console panel, then raised slate) and are separated by 1px hairline borders in raised slate, often at 60 to 80% opacity. Translucent fills over the dark base give a layered, glassy feel without shadows.

Shadows appear only on things that float above the page: the tab bar, modals, toasts, the overview card, and primary/active accent elements.

### Shadow Vocabulary
- **Floating chrome** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.5)`, Tailwind `shadow-2xl shadow-black/50`): the tab bar and modals.
- **Hero card** (`shadow-xl`): the overview card.
- **Accent lift** (`shadow-lg`, on the active tab tinted `shadow-indigo-950/40`): primary buttons, the active tab, danger confirm buttons.
- **Inset well** (`shadow-inner`): category emoji circles.

Blur accompanies floating chrome: `backdrop-blur-xl` on the tab bar, `backdrop-blur-sm` on overlays and toasts, and modal backdrops are black at 75% with a light blur.

### Named Rules
**The Float Earns the Shadow Rule.** Content sitting in the page flow is separated by tone and borders, never by shadow. Only elements that float over content (or the single hero card) get a shadow.

## Shapes

Soft, consistent rounding with three working radii:

- **12px** (`rounded-xl`) is the default for anything you touch: inputs, buttons, pills, list rows, segmented controls.
- **16px** (`rounded-2xl`) for containers: cards, modals, the sign-in panel.
- **Full** (`rounded-full`) for the tab bar and its tabs, avatars, the header Splitzes button, status dots and progress bars.
- **8px** (`rounded-lg`) for buttons nested inside a 12px well (segmented control options), and **6px** (`rounded-md`) for small inline badges.

Borders are 1px hairlines. A dashed border marks the "More" picker as a different kind of control from the plain pills. Icons are inline SVG line glyphs, 24px viewBox with a 1.75px stroke, rounded caps and joins.

## Components

### Buttons
Tight and tactile: compact, rounded, and they shrink on press.
- **Shape:** 12px corners (`rounded-xl`).
- **Primary:** full-width, indigo-500 to violet-600 gradient, white 14px semibold text, 12px vertical padding, `shadow-lg`. Used for Save / Submit on forms.
- **Secondary:** raised slate fill, ink-body text, control-edge border at 80%, 12px semibold.
- **Danger:** red-500 to rose-600 gradient, white text, `shadow-lg`. Confirm dialogs pair it 50/50 with a secondary Cancel.
- **States:** press scales to 0.98 (`active:scale-[0.98]`; small round controls use 0.95). Disabled drops to 40% opacity with a not-allowed cursor. Transitions are 150 to 200ms.
- **Ghost-tint (header):** pill-shaped teal tint (teal-600 at 20% fill, teal-500 at 30% border, teal-400 text) for the Splitzes entry point.

### Chips and Pills
- **Selector pill:** console-panel fill, ink-secondary 12px text, raised-slate border, 8px x 16px padding; hover strengthens the border. Selected: solid indigo-600 with white medium text and an indigo-500 border.
- **More picker:** dashed teal border at 50%, teal tint at 10%, ink-body text and a calendar glyph; looks like a selected pill once an older item is chosen.
- **Status badge:** 6px corners, semantic tint (e.g. emerald-500 at 15% fill, emerald-300 text, emerald-500 at 30% border), 12px semibold tabular text.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** console panel; the overview card adds a diagonal gradient that drifts into indigo-950 at 50% in the bottom-right corner.
- **Shadow Strategy:** none in flow; `shadow-xl` on the overview card only (see Elevation).
- **Border:** 1px raised slate.
- **Internal Padding:** 20px (cards), 12px (smaller containers and list rows).

### Inputs / Fields
- **Style:** field-fill (raised slate at 60%), 1px raised-slate border, 12px corners, 10px x 12px padding, 14px ink-primary text, ink-faint placeholder. Date inputs use `scheme-dark`.
- **Label:** 12px medium ink-secondary, 6px above the field.
- **Focus:** native outline removed, 2px Signal Indigo ring at 60% (trip select uses sky at 60%).
- **Error:** 11px overspend-red message under the field.
- **Segmented control:** a night-base well at 80% with a 4px inset, holding two 8px-radius options.

### Navigation
- **Tab bar:** a floating pill centred 16px above the bottom edge. Console panel at 70% with `backdrop-blur-xl`, raised-slate border at 70%, `shadow-2xl` in black at 50%. Five tabs (Monthly, SumUp, Create, OneOffs, Charts), each an 18px line icon above a 10px medium label.
- **Active tab:** indigo-500 to violet-600 gradient pill, white text, indigo-tinted `shadow-lg`. Idle tabs are ink-secondary, lightening on hover. All tabs scale to 0.95 on press.
- **Header:** logo, 20px bold title and a 12px ink-secondary subtitle on the left; the teal Splitzes pill and a 36px round avatar button (with an indigo unread dot) on the right.

### Category Row (signature)
The main readout of the Monthly tab. A 12px-radius row with a faint warm wash (amber-50 at 5%) and a raised-slate border at 60%. Left: a 32px round emoji avatar in its category tint with an inner shadow, the category name in 14px medium, and a 10px count. Right: tabular amounts with budget context. Below: an 8px progress track in raised slate, filled with the indigo-to-violet gradient while in budget and the red-600 to rose-800 gradient once over.

### Overview Card (signature)
The month at a glance: two columns (spent and saved) separated by 24px. Each column starts with an uppercase 12px label, then a 30px extra-bold tabular hero figure (white for spent; emerald or red for saved), then 10 to 11px breakdown lines. Expands to show more detail behind a chevron that rotates over 400ms.

## Do's and Don'ts

### Do:
- **Do** use tabular numbers for every amount, and show money as `€` with two decimals.
- **Do** mark every amount that stealth mode should hide with the `appSensitive` directive.
- **Do** build new surfaces from the gray ramp: night base for the page, console panel for cards, raised slate for borders and fields.
- **Do** use the indigo-to-violet gradient only for the primary action on a screen and the active tab.
- **Do** apply status and category colour as tints (500 at 10 to 20%, 200 or 300 text, 400 or 500 border at 20 to 30%).
- **Do** use 12px corners on controls and 16px on containers.
- **Do** give every pressable element press feedback (`active:scale-[0.98]` or `0.95` for small round controls) and a 150 to 200ms transition.
- **Do** keep 112px of bottom clearance on any scrolling page so the floating tab bar never covers content.
- **Do** use the shared pill styles in `src/app/utils/pill-styles.ts` and category tints from `CATEGORY_META` instead of restyling them per component.

### Don't:
- **Don't** add light surfaces or a light theme; the system is dark-only.
- **Don't** use emerald or red for anything other than saved/over-budget money and valid/invalid states.
- **Don't** introduce new action colours. The cyan on the sign-in button and the "Updating..." toast predates Signal Indigo; don't extend it.
- **Don't** set any text larger than the 30px Display figure.
- **Don't** put shadows on in-flow cards and rows; separate them with tone and hairline borders.
- **Don't** use solid saturated fills for status or category; tint them.
