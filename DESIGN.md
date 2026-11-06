---
name: Expenses Tracker
description: A dark, dense household budget for the iPhone home screen, set in walnut, smoked glass and cream.
colors:
  ground: "#120d0a"
  panel: "#1c1511"
  raised: "#261d17"
  raised-hi: "#30251d"
  edge: "#3d2f25"
  ink: "#f1e6d2"
  ink-2: "#d3c6b1"
  ink-3: "#b0a08c"
  ink-4: "#95836f"
  ember: "#e5703a"
  ember-ink: "#ee7d48"
  ember-soft: "#f2ae85"
  ember-deep: "#3a1d10"
  avocado: "#8fa35a"
  avocado-ink: "#a9bc74"
  avocado-deep: "#263016"
  cherry: "#f0566b"
  cherry-fill: "#a8283b"
  cherry-deep: "#3a1418"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
    fontFeature: "'tnum' 1"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.25
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.25
    fontVariation: "'wdth' 125"
  figure:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1
    fontVariation: "'wdth' 125"
    fontFeature: "'tnum' 1"
  brand:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 125"
  section-heading:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    fontVariation: "'wdth' 125"
  body-lg:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 500
  field:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    fontFeature: "'tnum' 1"
  body-sm:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    fontFeature: "'tnum' 1"
  caption:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 400
  micro:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1
rounded:
  segment: "10px"
  control: "12px"
  panel: "16px"
  sheet: "28px"
  full: "9999px"
spacing:
  hairline-gap: "1px"
  tile-gap: "8px"
  stack: "20px"
  gutter: "16px"
  panel-x: "20px"
  row-y: "10px"
  touch: "44px"
  field: "48px"
  column: "512px"
components:
  button-primary:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.ground}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.ember-ink}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.cherry}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.control}"
    height: "48px"
  pill-active:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.ground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  pill-idle:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  segment-active:
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.segment}"
    height: "44px"
  segment-idle:
    backgroundColor: "transparent"
    textColor: "{colors.ink-3}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.segment}"
    height: "44px"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "48px"
  amount-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
  category-tile:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.control}"
    padding: "8px"
    height: "60px"
  summary-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "16px 20px 20px"
  tab-bar:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-3}"
    height: "54px"
  tab-active:
    textColor: "{colors.ember-ink}"
  sheet:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "0 20px 20px"
---

# Design System: Expenses Tracker

## Overview

**Creative North Star: "Teak & Smoked Glass"**

The app is a walnut room at night. The page is near-black wood, the few raised surfaces are smoked glass, and all the writing is in cream. Most of the screen is quiet: lists sit straight on the ground and are split by hairlines. Colour only shows up when it means something. The one recurring signature is the budget bar: a single rounded ember bar on a faint cream track, which turns cherry when a budget is blown and carries a cream notch at today on the month's headline bar.

It is an installed iPhone PWA used one-handed, so it is dark-only and dense. A phone screen shows the month's headline, the bar and most category rows without scrolling, and every control is still at least thumb-sized. Wide, flat-topped figures in Archivo carry the numbers and headings. The system UI face does the reading.

The world was chosen in place of the previous cool indigo-glass dashboard of equal cards, and it leaves that dashboard's habits behind: no gradients on controls, no floating pill tab bar and no coloured status tints on every row.

**Key Characteristics:**
- Dark-only. Walnut ground, two smoked-glass steps, cream ink in four tiers. No ambient light or wash.
- Colour carries meaning: ember for selection and action, avocado for on pace or money kept, cherry for over budget.
- Archivo at 125% width for figures and headings; system UI for body text; tabular figures everywhere.
- One budget bar on one fixed 0–100% scale: ember, cherry when over, cream 4 when muted.
- Rows sit on the ground between hairlines. Panels are kept for period summaries and for chrome.
- Every target is at least 44px; every field is 48px at 16px type. Every text tier is at least 4.5:1 on every surface.

## Colors

A warm, low-light palette: walnut and cream neutrals, one burnt-orange family, and two status hues used sparingly.

### Primary
- **Ember** (ember): the selection and action colour. Used for the selected pill, the primary button, the active tab rule, focus outlines and focused field borders, text selection, the caret, and the fill of every budget bar. At 20% it is the well behind an active segment or a picked category tile.
- **Ember Ink** (ember-ink): ember lifted for text and hover. Used for the active tab label, primary button hover, tappable text hints, and the semibold "ahead of pace" caution in rows.
- **Ember Soft** (ember-soft): a pale apricot for small accent text on panels and the hover of ember-ink text links.
- **Ember Deep** (ember-deep): a dark ember well behind the settings avatar while stealth mode is on.

### Secondary
- **Avocado** (avocado): on pace, budget left, money saved. **Avocado Ink** (avocado-ink) is the lighter text form for income figures in lists and the "Saved" confirmation on the Add tab. **Avocado Deep** (avocado-deep) is the dark well behind it.
- **Cherry** (cherry): over budget (including the over-budget bar), errors and destructive actions. **Cherry Fill** (cherry-fill) is the solid cherry for count badges and chart bars that pass the wage, and at 10–30% it tints destructive wells and borders. **Cherry Deep** (cherry-deep) is the dark well behind error messages (at 60%).

### Neutral
- **Walnut Ground** (ground): the page, the theme colour, the status bar and the icon tile. Also the text colour on ember fills, and the knockout ring around the bar's notch.
- **Smoked Glass** (panel): period summaries, the docked tab bar (at 90% with blur), sheets, dialogs and every text field.
- **Raised Glass** (raised) and **Raised Glass High** (raised-hi): dropdown panels, the toast, the settings avatar and pressed or hover wells.
- **Teak Edge** (edge): control, field and tile borders, the amount field's underline, the sheet grabber and the scrollbar.
- **Cream** (ink): primary text and figures, and the bar's notch. At 10% opacity it is the hairline between rows and the border of panels; at 7% it is the empty bar track.
- **Cream 2** (ink-2): secondary text, idle pills, field labels, captions on panels.
- **Cream 3** (ink-3): meta text, idle segments and tabs, budget denominators, the euro sign on the amount field.
- **Cream 4** (ink-4): placeholders, "No budget" on a tile, the names in the collapsed "quiet" line, and the muted bar fill for share-of-total and unbudgeted rows. It still passes 4.5:1 on ground, panel and raised.

### Named Rules
**The Meaning Rule.** A hue appears only when it says something: ember means selected, acting or running ahead of pace; avocado means on pace or money kept; cherry means over or wrong. Everything else is walnut and cream.

**The No Yellow Rule.** No yellow, gold or amber anywhere, including the chart palette, and no neon or saturated glow. Warnings are ember-ink in semibold, not yellow.

**The Cream-Text Floor Rule.** Text uses only the four cream tiers or a status hue, and every pairing clears 4.5:1 on ground, panel and raised. Never create a dimmer text tone with opacity.

## Typography

**Display Font:** Archivo, self-hosted variable (weight 400–800, width 100–125%), with ui-sans-serif and system-ui as fallbacks
**Body Font:** the system UI stack (ui-sans-serif, system-ui, -apple-system, Segoe UI)

**Character:** Archivo stretched to 125% gives wide, flat, low figures with a period-sporty feel; it is only used through the wide-type utility, which also locks tabular numbers. The system face keeps body text native and fast to read on iOS.

### Hierarchy
- **Display** (Archivo wide, 700, 40px, line-height 1, -0.02em): the period headline figure, such as money spent this month or a trip's total, and the amount being typed on the Add tab (line-height 1.1 there). One per screen. The All-time total clamps it between 30px and 40px.
- **Headline** (Archivo wide, 600–700, 26px): the sign-in title, and the cream-3 euro sign beside the Add tab's amount.
- **Title** (Archivo wide, 600, 18–20px): the trip name, the days-to-go count, and secondary panel figures. One-off In and Spent figures sit at 32px bold.
- **Figure** (Archivo wide, 600, 13–16px): inline totals inside panels, such as the saved figure under the month bar and In / Out / Net.
- **Brand** (Archivo wide, 700, 17px, uppercase, 0.02em): the "Expenses" wordmark in the header.
- **Section Heading** (Archivo wide, 600, 13px, uppercase, cream 2): list headings such as Categories and Recent.
- **Field** (system, 16px): the text inside every input, select and textarea, so iOS never zooms. The amount field is the one exception.
- **Body Large** (system, 500, 15px): row labels, primary button labels and the friendly date label in date fields.
- **Body** (system, 400, 14px): transaction descriptions, panel captions and disclosure labels such as "More options".
- **Body Small** (system, 400–500, 13px): row amounts, pills, segment labels, category tile names, field labels, secondary buttons, meta lines.
- **Caption** (system, 12px): row status lines, a tile's "€X left", field errors and the labels under panel figures.
- **Micro** (system, 500, 11px): tab labels and the date caption over the bar's notch ("Fri. 6th").

### Named Rules
**The Wide For Figures Rule.** Money headlines, panel figures and headings are set in wide Archivo. Running text, labels and list rows stay in the system face, and amounts in rows stay in the system face with tabular numbers.

**The Tabular Rule.** Every amount uses tabular figures, written as € with two decimals, so columns line up and numbers do not jitter.

**The Sixteen Rule.** Every form field is set at 16px so iOS does not zoom into it. Only the display-size amount field is exempt.

## Layout

There is one centred column with a maximum width of 512px. It has 16px side gutters and stacks its sections with 20px gaps. The column pads for the iOS status bar (the safe area, at least 8px) and leaves the safe area plus 92px at the bottom so the docked tab bar never covers content. On desktop the same column stays centred on the walnut ground and does not widen.

The Budget page always runs in the same order: the Month / Trips / One-offs switch, the period pills, the summary panel, the breakdown, then the transactions. Category rows are sorted by amount spent, largest first. Categories with nothing spent fold into a single "quiet" line at the end. The transactions list starts collapsed behind a Show / Hide header and loads only when opened.

The Add tab runs as a till, top to bottom on the ground with no wrapping card: the Transaction / Trip / One-off switch, the amount, the 3-column category grid, a horizontally scrolling row of recurring pills, description, date, split, the "More options" disclosure, the Add button, then the after-save impact line. Fields stack with 20px gaps; a label sits 6px above its field.

Rows are at least 56px tall with 10px of vertical padding. Transaction rows are at least 48px. Panels use 20px of horizontal padding.

There is no ambient light: the ground is flat walnut from top to bottom.

## Elevation & Depth

The page is mostly flat and gets its depth from tone: ground, then panel, then raised. In-flow surfaces take no drop shadow. A panel is lifted only by a 10% cream border and a 1px cream highlight along its top inside edge, as if light were catching the glass. Real shadows belong only to things that float over the page.

### Shadow Vocabulary
- **Glass top edge** (`box-shadow: inset 0 1px 0 rgb(241 230 210 / 0.06)`): every summary panel.
- **Dropdown** (`box-shadow: 0 18px 40px -12px rgb(0 0 0 / 0.7)`): the "More" picker panel.
- **Sheet** (`box-shadow: 0 -24px 60px -20px rgb(0 0 0 / 0.8)`): the bottom sheet, cast upward.
- **Toast** (`box-shadow: 0 10px 30px -10px rgb(0 0 0 / 0.8)`): the update notice.
- **Notch ring** (`box-shadow: 0 0 0 2px var(--color-ground)`): cuts the cream notch out of the bar. This is a ground-coloured knockout, not a glow.

### Named Rules
**The Float Earns The Shadow Rule.** Only sheets, dialogs, dropdowns and the toast cast a shadow, and it is always black. Nothing in the page flow casts one, and no shadow, halo or wash is ever coloured.

## Shapes

Corners are softly rounded and consistent: 12px on every control (pills, buttons, fields, category tiles, date chevrons, the segmented frame), 10px on segments inside that frame, 16px on panels and dropdowns, and 28px on the top corners of the bottom sheet. Fully round shapes are reserved for the budget bar and its track, the notch, the sheet grabber, avatar and close buttons. Borders are 1px: teak edge on controls, fields and tiles, and 10% cream on panels and hairlines. The amount field has no box, only a 1px bottom rule. The "More" picker is the only dashed border.

## Components

### Buttons
Flat and solid, with no gradient or lift.
- **Shape:** gently rounded (12px).
- **Primary:** ember fill, walnut text, 15px semibold, at least 48px tall in forms (44px inline). Hover lifts to ember ink. Pressing scales it to 0.99. Disabled is 40% opacity.
- **Secondary:** transparent with a teak-edge border, cream 2 text at 13px medium, at least 44px tall. Hover brightens the border to cream 4 and the text to cream.
- **Destructive:** transparent with a cherry border at 35%, cherry text. Hover adds a cherry-deep well at 50%.
- **Focus:** a 2px ember outline with a 2px offset, applied globally.

### Chips (pills)
- **Style:** at least 44px tall, 12px corners, 13px medium, 16px horizontal padding, from the shared pill styles. Idle pills are transparent with a teak-edge border and cream 2 text; hover brightens to cream 4 and cream.
- **State:** the selected pill is a solid ember fill with walnut text. Recent period pills share their row equally; a selected trip pill grows to keep its full name (at most 60%). The "More" picker is dashed until an older item is picked, then it takes the selected style.
- **Other uses:** subcategory choices, recurring quick-picks, and the split row ("Just me" followed by one pill per person; "Paid by" uses the same pills once someone is added).

### Segmented switch
- A 12px teak-edge frame with 2px of inner padding holds equal segments, each at least 44px tall with 10px corners and 13px medium labels. The active segment is a 20% ember well with an inset 1px ember ring at 60% and cream text. Idle segments are cream 3, cream on hover. Built from the shared segment styles. Used for Month / Trips / One-offs, Transaction / Trip / One-off, Categories / Months, the one-offs filter, and two-way choices in forms (No trip / Add to a trip, Evenly / Custom amounts, No / Yes).

### Cards / Containers (summary panel)
- **Corner Style:** 16px.
- **Background:** smoked glass (panel), with a 10% cream border.
- **Shadow Strategy:** the glass top edge only (see Elevation & Depth).
- **Internal Padding:** 20px horizontal, 16px top, 20px bottom.
- **Use:** only for a period's summary (month, trip, one-offs, all time). A divider inside the panel is a 10% cream hairline. Never nest a card inside it, and never wrap list rows in one.

### Inputs / Fields
- **Style:** smoked glass fill, a 1px teak-edge border, 12px corners, 14px horizontal padding, at least 48px tall, 16px cream text, cream 4 placeholders. Labels are 13px medium cream 2, 6px above the field, from the shared field styles.
- **Focus:** the border turns ember; the global outline is suppressed on fields.
- **Error:** a 12px cherry line under the field. A form-level error is a cherry-deep well at 60% with a cherry border at 30% and cherry text.
- **Date field:** the native date input keeps its picker but its text is transparent; a friendly 15px cream label sits over it ("Today · Fri. 6th", "Yesterday · …", otherwise "Fri. 6th Nov"). It is flanked by 44px square chevron buttons with a teak-edge border and 12px corners that step one day back or forward.

### Amount field (signature)
The amount is the headline of the Add tab, not a boxed input. It is set in wide Archivo at 40px bold with -0.02em tracking, cream, with a cream-4 "0.00" placeholder. A 26px bold cream-3 euro sign sits on its baseline. The only frame is a 1px teak-edge bottom rule with 8px below the figure, and the rule turns ember while the field has focus. A tappable ember-ink hint ("Last month €X · tap to use") may sit under it.

### Category picker (signature)
The category keyboard: a 3-column grid of tiles with 8px gaps, sitting on the ground. Each tile is at least 60px tall with 12px corners, a teak-edge border and 8px padding. The top line is the 13px medium cream name. The second line holds the muted emoji at 11px and a 12px figure for the month being logged: "€X left" in cream 3, "€X over" in semibold cherry, or "No budget" in cream 4. Without figures (kiosk, trips) the emoji sits above the name. Hover brightens the border to cream 4. The picked tile takes the segment's active look: a 20% ember well with an inset 1px ember ring at 60%.

### More options disclosure
Rarely needed settings fold behind one 48px row between two 10% cream hairlines. The label is 14px medium cream 2; on the right a 12px cream-3 summary names what is set ("Comment · To kiosk") beside a chevron that turns over when open. Its contents stack with 16px gaps.

### After-save impact line
After a transaction posts, the form clears (keeping the date) and, below a 10% cream hairline, two 13px cream-2 lines appear: "Saved" in semibold avocado ink with the category name, then what that category has spent of its budget this month, ending in avocado "€X left" or semibold cherry "€X over". Under them sits the small budget bar for that category, growing in.

### Navigation
- **Header:** at least 56px tall, with the icon tile, the wide uppercase wordmark, a Splitz outline button and a 44px round "ME" avatar. In stealth mode the avatar shows an ember border on an ember-deep fill with an ember dot.
- **Tab bar:** docked full-width to the bottom edge, panel at 90% with a strong backdrop blur and a 10% cream top hairline. Four equal tabs, each at least 54px tall, with a 22px line icon (1.7 stroke) over an 11px label. The active tab has ember-ink text and a 2px ember rule along its top edge. Idle tabs are cream 3.

### Month summary
The panel leads with money spent: the display figure in cream (cherry once the month is over budget), captioned "spent this month", or "spent in October" for any other month. On the right, the days-to-go count in wide 20px ("Final" for a closed month). Under them, the large budget bar with its notch at today. Below the bar, a 13px line gives wage minus spent: the figure in wide semibold avocado labelled "saved this month", or in cherry with a minus sign and "more than the wage this month" when spending passes the wage.

### Breakdown row (signature list item)
The same row is used for months, trips and all time. It sits on the ground with hairlines between rows. The top line has a small emoji (grayscale 40%, opacity 60%), a 15px cream label, and the amount with a cream-3 "/ budget" after it. The small bar sits under that line, without a notch. The bottom line holds a 12px status in its colour (cherry semibold for over, ember-ink semibold for ahead of pace, avocado for left, cream 2 for full) and a cream-3 count with a chevron. When one row is expanded, its siblings dim (label to cream 2, emoji to 25%, bar to 35% opacity).

### The budget bar (signature)
One rounded bar fills to spent ÷ budget on a fixed 0–100% scale over a 7% cream track. The large bar is 8px tall with 6px of space above and below; the small bar is 4px with 4px. The fill is ember, turns cherry once spending passes the budget, and is cream 4 for share-of-total and unbudgeted rows. On bars that show pace (the month summary and the Add tab's after-save bar, current month only) a 2px cream notch, cut out by a ground-coloured ring, marks today. Only the month summary captions it, with today's date in micro type ("Fri. 6th"), kept inside the bar near either end. Category rows show no notch.

### Bottom sheet
Edits open in a sheet over the page, so the list keeps its scroll position. It is smoked glass with 28px top corners, a teak-edge border, a 40px grabber, a 44px close button, and safe-area padding underneath. The backdrop is walnut-black at 72% with a 3px blur. It rises 24px in 380ms on the expo-out curve.

### Motion
Motion uses one curve, expo-out (`cubic-bezier(0.16, 1, 0.3, 1)`). The only authored entrance on page content is a budget bar growing in from the left over 700ms. It is opt-in, and only the month summary's bar and the Add tab's after-save bar use it. Row bars stay still, and a bar's fill eases to new data over 500ms. Overlays settle in: the sheet rises in 380ms, and dialogs lift and fade in 240ms. State changes are colour transitions of 150ms, chevrons turn in 200ms, and row dimming takes 300ms. Under reduced motion every animation and transition collapses to an instant.

## Do's and Don'ts

### Do:
- **Do** draw every budget bar with the shared bar on the fixed 0–100% scale: ember, cherry when over, cream 4 when muted.
- **Do** put list rows straight on the walnut ground, split by 10% cream hairlines.
- **Do** keep every tappable thing at least 44px in its smallest dimension, and every field 48px.
- **Do** set money headlines and panel figures in wide Archivo, and every amount in tabular figures as € with two decimals.
- **Do** mark every amount that stealth mode should hide with the sensitive directive.
- **Do** use the shared pill, segment and field styles for selectors and fields instead of restyling them.
- **Do** sort category rows by amount spent, largest first, and fold categories with nothing spent into the quiet line.
- **Do** give a new surface a black shadow only if it floats over the page.

### Don't:
- **Don't** use yellow, gold, amber, neon, or any coloured glow, halo or ambient wash.
- **Don't** use ember, avocado or cherry for decoration, category identity or headings.
- **Don't** wrap rows or forms in cards, or put a card inside a panel. Panels are for period summaries, chrome and overlays.
- **Don't** add a light theme or light surfaces.
- **Don't** use a gradient fill on a button, tab, pill or bar.
- **Don't** add an entrance animation to in-flow content other than an opted-in headline bar, and never animate row bars.
- **Don't** set a form field below 16px, except the display-size amount.
- **Don't** set a text colour below cream 4, or dim text with opacity, except for the dimming of sibling rows behind an expanded one.
