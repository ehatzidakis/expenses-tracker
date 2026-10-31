/** Shared look for the selector pills (Monthly months, OneOffs trips, Singles filters). */
export const PILL_BASE =
  'px-4 py-2 rounded-xl text-xs whitespace-nowrap border transition-all duration-150 shrink-0';
export const ACTIVE_PILL = 'bg-indigo-600 text-white font-medium border-indigo-500';
export const IDLE_PILL = 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700';

/** One bordered strip holding the recent items (months or trips) as equal-width segments. */
export const SEGMENT_GROUP =
  'flex flex-1 min-w-0 gap-0.5 p-0.5 rounded-xl border border-gray-800 bg-gray-900';
export const SEGMENT =
  'flex-1 basis-0 min-w-0 truncate px-2 py-1.5 rounded-lg text-xs whitespace-nowrap text-center transition-all duration-150';
export const SEGMENT_ACTIVE = 'bg-indigo-600 text-white font-medium';
export const SEGMENT_IDLE = 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60';

/** The "More" picker toggle: a dashed ghost button that turns solid when an older item is picked. */
export const PICKER_BASE =
  'w-[5.5rem] px-2.5 py-2 rounded-xl text-xs whitespace-nowrap border transition-all duration-150 flex items-center justify-center gap-1';
export const PICKER_IDLE =
  'border-dashed border-teal-600/50 bg-teal-500/10 text-gray-300 hover:border-teal-500/70 hover:bg-teal-500/15';
export const PICKER_ACTIVE = 'bg-teal-600 text-white font-medium border-teal-500';

/**
 * Short line linking the recent-items strip to the picker. Place it between them in a
 * gap-2 flex row: -mx-2 cancels both gaps so it spans border to border.
 */
export const PICKER_CONNECTOR =
  '-mx-2 w-4 h-0.5 shrink-0 bg-linear-to-r from-gray-700 to-teal-600/60';

/** 20x20 calendar glyph (evenodd) for the picker toggle. */
export const CALENDAR_ICON_PATH =
  'M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z';
