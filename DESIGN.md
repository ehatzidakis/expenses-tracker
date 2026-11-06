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
  column-top: "4px"
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
    padding: "0 16px"
    height: "44px"
  button-secondary-lg:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "48px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.cherry}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "48px"
  button-danger-sm:
    backgroundColor: "transparent"
    textColor: "{colors.cherry}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
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
  switch-on:
    backgroundColor: "{colors.ember}"
    rounded: "{rounded.full}"
    width: "48px"
    height: "28px"
  switch-off:
    backgroundColor: "{colors.raised-hi}"
    rounded: "{rounded.full}"
    width: "48px"
    height: "28px"
  setting-row:
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
    padding: "10px 0"
    height: "56px"
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
  dialog:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "20px"
    width: "384px"
  chart-column:
    backgroundColor: "{colors.ember}"
    rounded: "{rounded.column-top}"
    width: "24px"
  chart-column-over:
    backgroundColor: "{colors.cherry-fill}"
    rounded: "{rounded.column-top}"
    width: "24px"
  chart-column-over-selected:
    backgroundColor: "{colors.cherry}"
  typical-row:
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
    padding: "10px 0"
  cost-row:
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
    padding: "10px 0"
    height: "56px"
---

# Design System: Expenses Tracker

## Overview

**Creative North Star: "Teak & Smoked Glass"**

The app is a walnut room at night. The page is near-black wood, the few raised surfaces are smoked glass, and all the writing is in cream. Most of the screen is quiet: lists sit straight on the ground and are split by hairlines. Colour only shows up when it means something. The one recurring signature is the budget bar: a single rounded ember bar on a faint cream track, which turns cherry when a budget is blown and carries a cream notch at today on the month's headline bar. Looking back, the same materials become a ledger: ember columns on hairline € gridlines, with the budget as one cream line.

It is an installed iPhone PWA used one-handed, so it is dark-only and dense. A phone screen shows the month's headline, the bar and most category rows without scrolling, and every control is still at least thumb-sized. Wide, flat-topped figures in Archivo carry the numbers and headings. The system UI face does the reading.

The world was chosen in place of the previous cool indigo-glass dashboard of equal cards, and it leaves that dashboard's habits behind: no gradients on controls, no floating pill tab bar and no coloured status tints on every row.

**Key Characteristics:**
- Dark-only. Walnut ground, two smoked-glass steps, cream ink in four tiers. No ambient light or wash.
- Colour carries meaning: ember for selection and action, avocado for on pace or money kept, cherry for over budget.
- Archivo at 125% width for figures and headings; system UI for body text; tabular figures everywhere.
- Budget bars sit on one fixed 0–100% scale: ember, cherry when over, cream 4 when muted. Comparisons across months or categories share one € scale instead.
- Rows sit on the ground between hairlines. Panels are kept for period summaries and for chrome.
- Every target is at least 44px; every field is 48px at 16px type. Every text tier is at least 4.5:1 on every surface.

## Colors

A warm, low-light palette: walnut and cream neutrals, one burnt-orange family, and two status hues used sparingly.

### Primary
- **Ember** (ember): the selection and action colour. Used for the selected pill, the primary button, the active tab rule, focus outlines and focused field borders, text selection, the caret, the fill of every budget bar, the month chart's columns (at 50% unless selected) and the typical-month bars, and the track of a switch that is on. At 20% it is the well behind an active segment or a picked category tile.
- **Ember Ink** (ember-ink): ember lifted for text and hover. Used for the active tab label, primary button hover, tappable text hints ("Add amount" on a kiosk request), and the semibold "ahead of pace" caution in rows and in notification notices.
- **Ember Soft** (ember-soft): a pale apricot used only as the hover of ember-ink text links. Never an amount.
- **Ember Deep** (ember-deep): a dark ember well behind the settings avatar while stealth mode is on.

### Secondary
- **Avocado** (avocado): on pace, budget left, money saved, "Left to save", and each month's 2px wage mark on the month chart. **Avocado Ink** (avocado-ink) is the lighter text form for income figures in lists, money owed to me in Splitzes ("Owes me", "Owes you"), success text, the "Saved" confirmation on the Add tab, and the month chart's "Wage €X" label. **Avocado Deep** (avocado-deep) is the dark well behind success messages (at 60%, with an avocado border at 30%).
- **Cherry** (cherry): over budget (including the over-budget bar, the over-budget typical-month bar and the selected over-budget month column), errors and destructive actions. **Cherry Fill** (cherry-fill) is the solid cherry for count badges (such as Incoming's count on the Splitzes segments), unselected over-budget month columns and the chart's status-key swatch, and at 10–30% it tints destructive wells and borders. **Cherry Deep** (cherry-deep) is the dark well behind error messages (at 60%).

### Neutral
- **Walnut Ground** (ground): the page, the theme colour, the status bar and the icon tile. Also the text colour on ember fills, the knockout ring around the bar's notch and the typical-month budget tick, the 3px stroke behind labels drawn inside a chart, and the fade over the month chart's left edge once older months scroll off.
- **Smoked Glass** (panel): period summaries, the docked tab bar (at 90% with blur), sheets, dialogs and every text field.
- **Raised Glass** (raised) and **Raised Glass High** (raised-hi): dropdown panels, the toast, the settings avatar, the neutral person avatar in Splitzes, loading placeholders, pressed or hover wells, and (raised-hi) the track of a switch that is off.
- **Teak Edge** (edge): control, field, tile, sheet and dialog borders, the off switch track's border, the amount field's underline, the sheet grabber and the scrollbar.
- **Cream** (ink): primary text and figures, the bar's notch and the typical-month budget tick. At 10% opacity it is the hairline between rows, the border of panels and the month chart's € gridlines; at 7% it is the empty bar track.
- **Cream 2** (ink-2): secondary text, idle pills, field labels, captions on panels and under setting rows, and a one-off expense in the All time month view.
- **Cream 3** (ink-3): meta text, idle segments and tabs, budget denominators, the euro sign on the amount field and money fields, row and select chevrons, the off switch's thumb, the version line, a "Settled" balance, and in the month chart the budget line, its "Budget €X" label, the € ticks and the month labels.
- **Cream 4** (ink-4): placeholders, "No budget" on a tile, the names in the collapsed "quiet" line, and the muted bar fill for share-of-total and unbudgeted rows. It still passes 4.5:1 on ground, panel and raised.

### Named Rules
**The Meaning Rule.** A hue appears only when it says something: ember means selected, acting or running ahead of pace; avocado means on pace or money kept; cherry means over or wrong. Everything else is walnut and cream.

**The No Yellow Rule.** No yellow, gold or amber anywhere, including charts, and no neon or saturated glow. Warnings are ember-ink in semibold, not yellow.

**The Cream-Text Floor Rule.** Text uses only the four cream tiers or a status hue, and every pairing clears 4.5:1 on ground, panel and raised. Never create a dimmer text tone with opacity.

## Typography

**Display Font:** Archivo, self-hosted variable (weight 400–800, width 100–125%), with ui-sans-serif and system-ui as fallbacks
**Body Font:** the system UI stack (ui-sans-serif, system-ui, -apple-system, Segoe UI)

**Character:** Archivo stretched to 125% gives wide, flat, low figures with a period-sporty feel; it is only used through the wide-type utility, which also locks tabular numbers. The system face keeps body text native and fast to read on iOS.

### Hierarchy
- **Display** (Archivo wide, 700, 40px, line-height 1, -0.02em): the period headline figure, such as money spent this month or a trip's total, and the amount being typed on the Add tab (line-height 1.1 there). One per screen. The All-time total and the Charts tab's average month clamp it between 30px and 40px.
- **Headline** (Archivo wide, 600–700, 26px): the sign-in title, and the cream-3 euro sign beside the Add tab's amount.
- **Title** (Archivo wide, 600, 18–20px): sheet titles (Settings, Splitzes, Budgets and wage), dialog titles, the trip name, the days-to-go count, secondary panel figures, and the 18px saved figure beside the average month. One-off In and Spent figures sit at 32px bold.
- **Figure** (Archivo wide, 600, 13–16px): inline totals inside panels, such as the saved figure under the month bar, In / Out / Net, and the Wage · Budgeted · Left to save summary.
- **Brand** (Archivo wide, 700, 17px, uppercase, 0.02em): the "Expenses" wordmark in the header.
- **Section Heading** (Archivo wide, 600, 13px, uppercase, cream 2): list headings such as Categories, Recent, Month by month, Typical month, Typical costs and the kiosk's Requests. Only real list headings; never a kicker over a title or inside a list.
- **Field** (system, 16px): the text inside every input, select and textarea, so iOS never zooms. The amount field is the one exception.
- **Body Large** (system, 500, 15px): row labels, setting and switch labels, the labels of primary, large secondary and destructive buttons, the friendly date label in date fields, the selected month's name on Charts, and sub-section titles such as Bills and Per purchase.
- **Body** (system, 400, 14px): transaction descriptions, panel captions and disclosure labels such as "More options".
- **Body Small** (system, 400–500, 13px): row amounts, pills, segment labels, category tile names, field labels, secondary buttons, meta lines.
- **Caption** (system, 12px): row status lines, captions under setting rows, a tile's "€X left", field errors, the labels under panel figures and the version line.
- **Micro** (system, 500, 11px): tab labels, the date caption over the bar's notch ("Fri. 6th"), and every label inside the month chart: € ticks, month names and years, the selected column's cap value, and the Budget and Wage labels.

### Named Rules
**The Wide For Figures Rule.** Money headlines, panel figures and headings are set in wide Archivo. Running text, labels and list rows stay in the system face, and amounts in rows stay in the system face with tabular numbers.

**The Tabular Rule.** Every amount uses tabular figures, written as € with two decimals, so columns line up and numbers do not jitter.

**The Sixteen Rule.** Every form field is set at 16px so iOS does not zoom into it. Only the display-size amount field is exempt.

## Layout

There is one centred column with a maximum width of 512px. It has 16px side gutters and stacks its sections with 20px gaps. The column pads for the iOS status bar (the safe area, at least 8px) and leaves the safe area plus 92px at the bottom so the docked tab bar never covers content. On desktop the same column stays centred on the walnut ground and does not widen.

The Budget page always runs in the same order: the Month / Trips / One-offs switch, the period pills, the summary panel, the breakdown, then the transactions. Category rows are sorted by amount spent, largest first. Categories with nothing spent fold into a single "quiet" line at the end. The transactions list starts collapsed behind a Show / Hide header and loads only when opened.

The Add tab runs as a till, top to bottom on the ground with no wrapping card: the Transaction / Trip / One-off switch, the amount, the 3-column category grid, a horizontally scrolling row of recurring pills, description, date, split, the "More options" disclosure, the Add button, then the after-save impact line. Fields stack with 20px gaps; a label sits 6px above its field.

The Charts tab stacks its sections 32px apart: the 6M / 12M / All switch with the average month under it, then "Month by month" (the selected month's readout above the chart), then "Typical month", then "Typical costs" (Bills, then Per purchase, 24px apart). A section heading may carry a 12px cream-3 note on its right ("Monthly average vs budget", "All time"). The range scopes the first two sections only; typical costs are all-time.

Rows are at least 56px tall with 10px of vertical padding. Transaction rows are at least 48px. Panels use 20px of horizontal padding.

There is no ambient light: the ground is flat walnut from top to bottom.

## Elevation & Depth

The page is mostly flat and gets its depth from tone: ground, then panel, then raised. In-flow surfaces take no drop shadow. A panel is lifted only by a 10% cream border and a 1px cream highlight along its top inside edge, as if light were catching the glass. Real shadows belong only to things that float over the page.

### Shadow Vocabulary
- **Glass top edge** (`box-shadow: inset 0 1px 0 rgb(241 230 210 / 0.06)`): every summary panel.
- **Dropdown** (`box-shadow: 0 18px 40px -12px rgb(0 0 0 / 0.7)`): the "More" picker panel.
- **Sheet** (`box-shadow: 0 -24px 60px -20px rgb(0 0 0 / 0.8)`): the bottom sheet, cast upward.
- **Dialog** (`box-shadow: 0 24px 60px -20px rgb(0 0 0 / 0.8)`): the centred dialog, cast downward.
- **Toast** (`box-shadow: 0 10px 30px -10px rgb(0 0 0 / 0.8)`): the update notice.
- **Notch ring** (`box-shadow: 0 0 0 2px var(--color-ground)`): cuts the cream notch out of the bar and the cream budget tick out of a typical-month row. This is a ground-coloured knockout, not a glow.
- **Label knockout** (SVG `stroke: var(--color-ground); stroke-width: 3; paint-order: stroke`): lifts the month chart's Budget and Wage labels off the lines they sit on. Also a knockout, not a glow.
- **Scroll fade** (a 28px ground-to-transparent overlay): covers the month chart's left plot edge only while older months are scrolled out of view. It marks hidden content; it is not ambient light.

### Named Rules
**The Float Earns The Shadow Rule.** Only sheets, dialogs, dropdowns and the toast cast a shadow, and it is always black. Nothing in the page flow casts one, and no shadow, halo or wash is ever coloured.

## Shapes

Corners are softly rounded and consistent: 12px on every control (pills, buttons, fields, category tiles, date chevrons, the segmented frame), on message wells and on the toast, 10px on segments inside that frame, 16px on panels, dropdowns and centred dialogs, and 28px on the top corners of the bottom sheet. Chart columns have 4px rounded tops and square feet on the baseline; the chart's status-key swatch is a 10px square with 2px corners. Fully round shapes are reserved for the budget bar and its track, the typical-month bar and its budget tick, the notch, the sheet grabber, the switch track and thumb, count badges, avatars and close buttons. Borders are 1px: teak edge on controls, fields, tiles, sheets and dialogs, and 10% cream on panels and hairlines. The amount field has no box, only a 1px bottom rule. The "More" picker is the only dashed border.

## Components

### Buttons
Flat and solid, with no gradient or lift. Every button comes from the shared button styles, and each size is its own named style.
- **Shape:** gently rounded (12px), 16px horizontal padding.
- **Primary:** ember fill, walnut text, 15px semibold, at least 48px tall. Hover lifts to ember ink. Pressing scales it to 0.99.
- **Secondary:** transparent with a teak-edge border, cream 2 text at 13px medium, at least 44px tall. Hover brightens the border to cream 4 and the text to cream. Used for row actions (Settle up, Set passcode, data export, Try again).
- **Secondary large:** the same outline at 48px with 15px medium text, for a Cancel beside a 48px primary or destructive button.
- **Destructive:** transparent with a cherry border at 35%, cherry text at 15px medium, at least 48px tall. Hover adds a cherry-deep well at 50%. **Destructive small** is the same at 44px and 13px, beside a 44px secondary in a setting row.
- **Pairs:** Cancel comes first, as the large secondary, and the two share a 2-column grid with 12px gaps.
- **Disabled:** 40% opacity with a not-allowed cursor.
- **Focus:** a 2px ember outline with a 2px offset, applied globally.

**The Own Constant Rule.** A sized variant is its own named style. Never append a class to a shared button style to override its height, type size or padding; add a variant instead. Appending layout only (full width, a margin) is fine.

### Chips (pills)
- **Style:** at least 44px tall, 12px corners, 13px medium, 16px horizontal padding, from the shared pill styles. Idle pills are transparent with a teak-edge border and cream 2 text; hover brightens to cream 4 and cream.
- **State:** the selected pill is a solid ember fill with walnut text. Recent period pills share their row equally; a selected trip pill grows to keep its full name (at most 60%). The "More" picker is dashed until an older item is picked, then it takes the selected style.
- **Other uses:** subcategory choices, recurring quick-picks, and the split row ("Just me" followed by one pill per person; "Paid by" uses the same pills once someone is added).

### Segmented switch
- A 12px teak-edge frame with 2px of inner padding holds equal segments, each at least 44px tall with 10px corners and 13px medium labels. The active segment is a 20% ember well with an inset 1px ember ring at 60% and cream text. Idle segments are cream 3, cream on hover. Built from the shared segment styles. Used for Month / Trips / One-offs (on Budget and All time), Transaction / Trip / One-off, Category / Month, 6M / 12M / All, Per bill / Per month, Food / Tickets / Games, the one-offs filter, the three edit options of a one-off, Balances / Incoming / History in Splitzes, and two-way choices in forms (No trip / Add to a trip, Evenly / Custom amounts, No / Yes). Segments that switch panels keep `role="tab"`. A count rides inside its segment as an 11px semibold cream figure on a round cherry-fill badge.

### Cards / Containers (summary panel)
- **Corner Style:** 16px.
- **Background:** smoked glass (panel), with a 10% cream border.
- **Shadow Strategy:** the glass top edge only (see Elevation & Depth).
- **Internal Padding:** 20px horizontal, 16px top, 20px bottom.
- **Use:** only for a period's summary (month, trip, one-offs, all time). A divider inside the panel is a 10% cream hairline. Never nest a card inside it, and never wrap list rows in one.

### Inputs / Fields
- **Style:** smoked glass fill, a 1px teak-edge border, 12px corners, 14px horizontal padding, at least 48px tall, 16px cream text, cream 4 placeholders. Labels are 13px medium cream 2, 6px above the field, from the shared field styles.
- **Focus:** the border turns ember; the global outline is suppressed on fields.
- **Error:** a 12px cherry line under the field.
- **Message wells:** a form-level error is a 12px-cornered cherry-deep well at 60% with a cherry border at 30% and 13px cherry text; a success message is the same well in avocado deep with an avocado border and avocado-ink text.
- **Money field:** in edit forms, a 48px field with a cream-3 € prefix inside the frame and tabular figures; the frame's border turns ember on focus.
- **Select:** the shared field with the native arrow removed and an authored 16px cream-3 chevron 14px from the right edge. Category options read as names ("Eating out"), never as stored keys.
- **Everywhere:** add, edit, kiosk, settle-up, passcode and sign-in fields all use the shared field, label and error styles at 48px.
- **Date field:** in add and edit forms alike, the native date input keeps its picker but its text is transparent; a friendly 15px cream label sits over it ("Today · Fri. 6th", "Yesterday · …", otherwise "Fri. 6th Nov"). It is flanked by 44px square chevron buttons with a teak-edge border and 12px corners that step one day back or forward.

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

### Ledger rows
All time's month view, paged entry lists, yearly sums, the split summary, Splitzes history and incoming, and kiosk requests use the plain hairline row: on the ground or the sheet between 10% cream hairlines, a 14–15px cream label over a 12px cream-3 meta line, and a 13–14px tabular amount on the right. Income and money owed to me are avocado ink, a one-off expense is cream 2, and a settled split is avocado ink. Rows that open something end in a 16px cream-3 chevron; other icons (scissors for a split, a speech bubble for a comment) are line SVGs, never glyphs. Loading is a pulsing list of raised bars, an empty list is one 13px cream-3 line, and a failed load is a 13px cherry line with a secondary "Try again". The month and trip pickers step with SVG chevrons too.

### The budget bar (signature)
One rounded bar fills to spent ÷ budget on a fixed 0–100% scale over a 7% cream track. The fixed scale is for budget bars only; typical-month rows share one € scale instead. The large bar is 8px tall with 6px of space above and below; the small bar is 4px with 4px. The fill is ember, turns cherry once spending passes the budget, and is cream 4 for share-of-total and unbudgeted rows. On bars that show pace (the month summary and the Add tab's after-save bar, current month only) a 2px cream notch, cut out by a ground-coloured ring, marks today. Only the month summary captions it, with today's date in micro type ("Fri. 6th"), kept inside the bar near either end. Category rows show no notch.

### Month chart (signature)
Spending per month as columns on one € axis, drawn as plain SVG with d3-scale (pinned 4.0.2), the only chart dependency. The 206px plot sits on the walnut ground with no card.
- **Columns:** ember, at most 24px wide (62% of each month's slot, never under 6px), with 4px rounded tops and square feet. Unselected columns sit at 50% opacity and the selected one is solid. An over-budget month stays solid cherry-fill so it never reads as ember, and turns cherry when selected. Opacity changes take 150ms.
- **Axis:** three hairline € gridlines at 10% cream. Their 11px cream-3 € ticks sit in a fixed 44px column on the left that does not scroll with the months.
- **Budget and wage:** the total budget is one 1px cream-3 line across the plot. Each month's wage is a short 2px round-capped avocado mark across its slot. Both are labelled in place at the right end in 11px ("Budget €X" in cream 3, "Wage €X" in avocado ink for the newest month) over the ground label knockout.
- **Labels:** the selected month's value sits on its column cap in 11px medium cream 2. Month names run along the foot in 11px cream 3 (cream semibold when selected), with a two-digit year ('25) under January, the first month, and any month name that repeats in range.
- **Picking:** one transparent pointer surface covers the plot. A tap picks the nearest month; in 6M and 12M a deliberate sideways slide scrubs, and a page scroll that starts on the plot picks nothing. It is a single keyboard stop with role="slider": arrows step, Home and End jump to the ends, and focus shows a 2px ember stroke.
- **All:** once the months no longer fit at 24px per slot, the chart scrolls sideways. It opens at the newest month on the right, and the scroll fade covers the left edge once older months are hidden.
- **Key and access:** the only status key is a cherry-fill swatch with "Red months went over budget" in 12px cream 3, shown only when a month went over. A screen-reader table lists every month's spent, budget and wage.
- **Readout:** above the chart sit the selected month's 15px name ("so far" in cream 3 for the current month) and "€X of €Y" on the right. Under them a 13px line gives left to spend or under budget in cream 3, or "over budget" in semibold cherry, then "€X saved" in avocado or cherry.

### Average month
The Charts tab's headline, under the range switch: the display figure in cream (clamped 30–40px), captioned "spent in an average month" in 14px cream 2. On the right is the saved figure in wide 18px semibold, avocado (cherry with a minus sign when negative), captioned "saved" in 12px cream 3. A 12px cream-3 line under them says how many finished months it averages. The month in progress never counts.

### Typical-month row
A ranked list of categories by monthly average, largest first, on the ground between hairlines. The top line is the Budget row's: muted emoji, 15px medium cream label, and the 13px amount with a cream-3 "/ €budget". Under it, inset to the label, is a 4px rounded bar over a 7% cream track. Every row shares one € scale (the largest average or budget in range), so lengths compare across categories. The bar is ember, or cherry when the average passes the budget. A 2px by 12px cream budget tick, cut out by the ground knockout ring, marks the budget. Over-budget rows add a 12px semibold cherry line ("€X over budget on average"). Bars and ticks ease to a new range over 500ms on expo-out. Categories with nothing spent fold into one cream-3 "Nothing spent · …" line.

### Typical-cost row
The Budget page's row language for what things usually cost, over all time. Each group has a 15px medium cream title on the left and its segmented switch on the right. Rows are at least 56px tall, between hairlines. Each has a 20px cream-3 line icon (1.5 stroke) for a bill or the muted emoji for a purchase, a 15px medium label over a 12px cream-3 count, and the 13px tabular amount over a 12px cream-3 qualifier ("a month", "each, on average", "Varies"). A 14px cream-3 chevron turns over in 200ms when the row opens its transactions.

### Bottom sheet
Edits and secondary surfaces (Settings, Splitzes, the kiosk's notifications, edit forms) open in a sheet over the page, so the list keeps its scroll position. It is smoked glass with 28px top corners, a teak-edge border, a 40px grabber, a 44px close button, and safe-area padding underneath, and it opens with a wide 18px title. The backdrop is walnut-black at 72% with a 3px blur. It rises 24px in 380ms on the expo-out curve. A sheet whose content changes length between tabs (Splitzes) holds a steady minimum height, the smaller of 560px and 72% of the viewport.

### Setting row
The Settings ledger: hairline rows on the sheet, each at least 56px with 10px vertical padding, a 15px medium cream label over a 12px cream-2 caption, and the control on the right (a switch, small secondary and destructive buttons, or a cream-3 chevron for a row that navigates). An open passcode form replaces its row in place: a 13px label, a 48px field, then Cancel and the action, whose tone is primary or destructive and never a solid red fill.

### Switch
An on/off setting where the whole row is the control (`role="switch"` with its checked state), so the hit area is the full 56px row with its label and caption. The track is 48 by 28px and fully round: ember with an ember border when on, raised-hi with a teak edge when off. The 22px round thumb is cream when on and cream 3 when off, and slides 20px in 150ms. Disabled is 40% opacity.

### Settings sheet
Under the "Settings" title, one hairline group: the stealth switch, the passcode row, a "Budgets and wage" row with a chevron, and notifications. Data export follows (a 15px title, a 12px caption and four 44px secondary buttons in a 2-column grid), then a full-width 48px destructive "Sign out" and a centred 12px cream-3 version line.

### Budgets and wage
Opens inside the Settings sheet as a sub-view, never as a second sheet. A 44px "Back" row with a left chevron sits beside the wide 18px title. Changing view scrolls the sheet to the top and moves focus to Back, or back to the row on return. The view leads with a three-column Wage · Budgeted · Left to save summary: 12px cream-3 labels over wide 16px semibold figures, with Left to save in avocado or cherry. Categories follow as hairline rows sorted by budget, largest first: muted emoji, 15px cream label and the 13px tabular budget. The secondary "Edit budgets and wage" button is hidden in stealth mode, and turning stealth on closes editing. In edit mode the monthly wage field comes first. Every field is a 48px smoked-glass field with a cream-3 € prefix and right-aligned tabular figures, and each budget has a 12px cream-3 "Suggested €X" caption under it. Cancel (outline) and Save (primary), both 48px, share a sticky bar at the sheet's foot, on panel above a 10% cream hairline.

### Centred dialog
Confirmations (delete, decline, settle up) are a centred smoked-glass dialog, at most 384px wide with 16px side margins, on the same walnut scrim as the sheet. It has 16px corners, a teak-edge border, 20px padding and the black dialog shadow, and settles in with the 240ms fade. A wide 18px title leads, with a 14px cream-2 message under it. Cancel comes first as the large secondary and takes the focus; the confirm is destructive (cherry outline) or primary (ember). It opens in the top layer, so it stacks above an open sheet. The settle-up dialog adds a display-tier figure (clamped 30–40px) with a 13px "owes you" line (avocado ink) or "You owe" line (cream 2), a 48px "Transactions included" disclosure with a turning chevron over hairline debt rows reading "Owes you" or "You owe", and an optional note field.

### Splitzes
Under the "Splitzes" title and a 13px cream-2 line sit the Balances / Incoming / History segments, then person rows on hairlines: a 36px neutral avatar (raised, teak edge, 12px semibold cream-2 initials), the 15px medium name, and the balance on the right: "Owes me €X" in medium avocado ink, "I owe €X" in medium cream, or "Settled" in cream 3. Debts between other people sit indented in 12px. A secondary "Settle up" opens the settle-up dialog.

### Kiosk requests
Requests are hairline rows at least 56px tall: a 14px description over a 12px cream-3 meta line (an attached comment in italic cream 2), and on the right the amount or, while it is missing, "Add amount" in 13px semibold ember ink, then a chevron. A request opens in the shared edit form. Declining replaces the form's own actions with a decline area under a hairline (a reason field, then Cancel and a destructive "Send reason"), so only one set of actions shows at a time.

### Update toast
A small notice on raised glass with 12px corners, a 10% cream border, 12px medium cream text and the toast shadow.

### Motion
Motion uses one curve, expo-out (`cubic-bezier(0.16, 1, 0.3, 1)`). The only authored entrance on page content is a budget bar growing in from the left over 700ms. It is opt-in, and only the month summary's bar and the Add tab's after-save bar use it. Row bars stay still, and a bar's fill eases to new data over 500ms; typical-month bars and budget ticks do the same on expo-out when the range changes. Overlays settle in: the sheet rises in 380ms, and dialogs lift and fade in 240ms. State changes are colour and opacity transitions of 150ms (including the month chart's columns and the switch's thumb), chevrons turn in 200ms, and row dimming takes 300ms. Under reduced motion every animation and transition collapses to an instant.

## Do's and Don'ts

### Do:
- **Do** draw every budget bar with the shared bar on the fixed 0–100% scale: ember, cherry when over, cream 4 when muted.
- **Do** put rows or columns that compare across categories or months on one shared € scale, with the budget as a cream tick or line.
- **Do** put list rows straight on the walnut ground, split by 10% cream hairlines.
- **Do** keep every tappable thing at least 44px in its smallest dimension, and every field 48px.
- **Do** set money headlines and panel figures in wide Archivo, and every amount in tabular figures as € with two decimals.
- **Do** mark every amount that stealth mode should hide with the sensitive directive.
- **Do** use the shared pill, segment, field, button, well and dialog styles instead of restyling them; when a new size is needed, add it as its own named style.
- **Do** make an on/off setting the shared switch, with the whole row as the control.
- **Do** open secondary surfaces in the shared bottom sheet, step into a sub-view inside the same sheet, and confirm in the centred dialog with Cancel first.
- **Do** sort category rows by what they measure, largest first (spent on Budget, average on Typical month, budget in the budgets sheet), and fold categories with nothing spent into one quiet line.
- **Do** give every chart a single keyboard stop and a screen-reader table, and label its lines in place rather than in a legend.
- **Do** give a new surface a black shadow only if it floats over the page.

### Don't:
- **Don't** use yellow, gold, amber, neon, or any coloured glow, halo or ambient wash.
- **Don't** use ember, avocado or cherry for decoration, category identity or headings.
- **Don't** wrap rows or forms in cards, or put a card inside a panel. Panels are for period summaries, chrome and overlays.
- **Don't** add a light theme or light surfaces.
- **Don't** draw pie, donut or gradient-area charts, or add a chart package; charts are plain SVG with d3-scale.
- **Don't** use a gradient fill on a button, tab, pill or bar.
- **Don't** add an entrance animation to in-flow content other than an opted-in headline bar, and never animate row bars.
- **Don't** set a form field below 16px, except the display-size amount.
- **Don't** append a class to a shared button style to change its size; use or add a sized variant.
- **Don't** fill a destructive button with solid red; it is always the cherry outline.
- **Don't** open a sheet on top of a sheet; only a centred dialog may stack above one.
- **Don't** set a text colour below cream 4, or dim text with opacity, except for the dimming of sibling rows behind an expanded one.
