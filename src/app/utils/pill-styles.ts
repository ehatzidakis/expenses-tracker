/** Shared look for the selector pills (months, trips, one-off filters). 44px tall for thumbs. */
export const PILL_BASE =
  'min-h-11 px-4 rounded-xl text-[13px] font-medium whitespace-nowrap border transition-colors duration-150 shrink-0 cursor-pointer';
export const ACTIVE_PILL = 'bg-ember text-ground border-ember';
export const IDLE_PILL = 'bg-transparent text-ink-2 border-edge hover:border-ink-4 hover:text-ink';

/** The look of a recent-item pill, without its share of the row. */
export const QUICK_PILL_SHAPE =
  'min-h-11 truncate text-center px-3 rounded-xl text-[13px] font-medium whitespace-nowrap border transition-colors duration-150 cursor-pointer';

/** A recent-item pill (month or trip) that shares the row equally with its siblings. */
export const QUICK_PILL = 'flex-1 basis-0 min-w-0 ' + QUICK_PILL_SHAPE;

/** A selected trip keeps its whole name; the idle pills give up the room. */
export const QUICK_PILL_GROW = 'flex-none max-w-[60%] ' + QUICK_PILL_SHAPE;

/** Wraps the "More" picker: 1.5x a quick pill's width, and anchors its dropdown. */
export const PICKER_WRAPPER = 'relative flex-[1.3] basis-0 min-w-0';

/** The "More" picker toggle: a dashed pill that looks selected once an older item is picked. */
export const PICKER_BASE =
  'w-full min-h-11 px-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap border transition-colors duration-150 flex items-center justify-center gap-1 cursor-pointer';
export const PICKER_IDLE =
  'border-dashed border-edge bg-transparent text-ink-2 hover:border-ink-4 hover:text-ink';
export const PICKER_ACTIVE = ACTIVE_PILL;

/** Dropdown panel opened by a "More" picker. */
export const PICKER_PANEL =
  'absolute right-0 top-full mt-2 z-30 w-64 bg-raised border border-edge rounded-2xl p-3 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7)]';

/** 20x20 calendar glyph (evenodd) for the picker toggle. */
export const CALENDAR_ICON_PATH =
  'M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z';
