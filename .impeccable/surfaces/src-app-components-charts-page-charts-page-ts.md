---
version: 1
slug: "src-app-components-charts-page-charts-page-ts"
primary_target: "src/app/components/charts-page/charts-page.ts"
related_targets: ["src/app/components/charts-page/month-chart.ts"]
---

## Scope

The Charts tab (admin): looking back across months. Operate mode. Extends the existing app surface inside the Teak & Smoked Glass world in DESIGN.md. Budget and wage editing moves out of this tab into Settings (a sheet). The pie chart is removed.

## Audience and job

The owner, occasionally, asking: am I spending more or less month to month, where does a normal month go, and what do regular things cost.

## Confirmed answers (2026-11-06)

- Questions to answer: month-to-month trend, typical month, typical costs. Not per-category growth.
- Budget editing moves to Settings.
- Default range: last 12 months, with a 6M / 12M / All switch the first two sections follow.
- Charts drawn as own SVG with d3-scale; no chart package. The pie goes.

## Direction contract

THESIS: A ledger looked back on, not a dashboard. Three plain answers in order, each in its own honest form; it refuses the card-per-chart dashboard and every decorative chart (pie, donut, gradient area).

OWN-WORLD: Walnut ground, no cards. Ember columns on hairline € gridlines, cherry for an over-budget month, the total budget as one cream line and each month's wage as a short avocado mark. Typical month as ranked hairline rows with a single ember bar and a cream budget tick on one shared scale. Typical costs as Budget-page rows. Shared 44px segments for every switch.

STORY: Pick a range, read the average month, tap a month to see its spend against budget and what was saved, see which categories carry a normal month and whether they sit inside budget, look up what a bill or a meal usually costs.

FIRST VIEWPORT: 6M | 12M | All switch at the top, the "Average month" line under it, then "Month by month" with the selected month's readout above the column chart; the typical-month rows begin below.

FORM: Three-section ledger (trend columns, ranked bullet rows, cost list), the user's confirmed shape; the roll was taken for the record, the structure was not re-opened. seed:e166c42d8bafb164

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions

- Budgets are not stored per month, so every month is measured against today's budgets (open product decision in PRODUCT.md).
- Typical costs come from all-time totals in the database and do not follow the range switch; the section says "All time".
