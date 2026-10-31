/** Shared look for the selector pills (Monthly months, OneOffs trips, Singles filters). */
export const PILL_BASE =
  'px-4 py-2 rounded-xl text-xs whitespace-nowrap border transition-all duration-150 shrink-0';
export const ACTIVE_PILL = 'bg-indigo-600 text-white font-medium border-indigo-500';
export const IDLE_PILL = 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700';

/** A recent-item pill (month or trip) that shares the row equally with its siblings. */
export const QUICK_PILL =
  'flex-1 basis-0 min-w-0 truncate text-center px-3 py-2 rounded-xl text-xs whitespace-nowrap border transition-all duration-150';

/** Wraps the "More" picker: 1.5x a quick pill's width, and anchors its dropdown. */
export const PICKER_WRAPPER = 'relative flex-[1.5] basis-0 min-w-0';

/** The "More" picker toggle: a dashed ghost button that looks like a selected pill when an older item is picked. */
export const PICKER_BASE =
  'w-full px-2.5 py-2 rounded-xl text-xs whitespace-nowrap border transition-all duration-150 flex items-center justify-center gap-1';
export const PICKER_IDLE =
  'border-dashed border-teal-600/50 bg-teal-500/10 text-gray-300 hover:border-teal-500/70 hover:bg-teal-500/15';
export const PICKER_ACTIVE = ACTIVE_PILL;

/** 20x20 calendar glyph (evenodd) for the picker toggle. */
export const CALENDAR_ICON_PATH =
  'M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z';
