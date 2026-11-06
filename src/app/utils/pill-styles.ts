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

/** Segmented switch: a teak-edge frame holding equal segments (Month / Trips / One-offs, Yes / No). */
export const SEGMENT_FRAME = 'grid rounded-xl border border-edge p-0.5';
export const SEGMENT_BASE =
  'min-h-11 rounded-[10px] text-[13px] font-medium transition-colors duration-150 cursor-pointer';
export const SEGMENT_ON = 'bg-ember/20 text-ink ring-1 ring-inset ring-ember/60';
export const SEGMENT_OFF = 'text-ink-3 hover:text-ink';

/** Text field on the ground: smoked glass, teak edge, ember border on focus. Type size comes from styles.css. */
export const FIELD =
  'w-full min-h-12 rounded-xl border border-edge bg-panel px-3.5 text-ink placeholder:text-ink-4 transition-colors focus:border-ember focus-visible:outline-none';
export const FIELD_LABEL = 'text-[13px] font-medium text-ink-2';
export const FIELD_ERROR = 'text-[12px] text-cherry';

/** Buttons. Primary is the one main action; secondary is a quiet outline; danger is a cherry outline, never a solid red fill. */
export const BUTTON_PRIMARY =
  'min-h-12 rounded-xl bg-ember px-4 text-[15px] font-semibold text-ground transition-[background-color,transform] duration-150 hover:bg-ember-ink active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer';
export const BUTTON_SECONDARY =
  'min-h-11 rounded-xl border border-edge px-4 text-[13px] font-medium text-ink-2 transition-colors duration-150 hover:border-ink-4 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer';
/** Secondary at form size, for a Cancel beside a 48px primary or danger button. */
export const BUTTON_SECONDARY_LG =
  'min-h-12 rounded-xl border border-edge px-4 text-[15px] font-medium text-ink-2 transition-colors duration-150 hover:border-ink-4 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer';
/** Danger at row size, beside a 44px secondary button in a settings row. */
export const BUTTON_DANGER_SM =
  'min-h-11 rounded-xl border border-cherry/35 px-4 text-[13px] font-medium text-cherry transition-colors duration-150 hover:bg-cherry-deep/50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer';
export const BUTTON_DANGER =
  'min-h-12 rounded-xl border border-cherry/35 px-4 text-[15px] font-medium text-cherry transition-colors duration-150 hover:bg-cherry-deep/50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer';

/** Message wells for a failed or finished action. */
export const ERROR_WELL =
  'rounded-xl border border-cherry/30 bg-cherry-deep/60 px-3.5 py-3 text-[13px] text-cherry';
export const SUCCESS_WELL =
  'rounded-xl border border-avocado/30 bg-avocado-deep/60 px-3.5 py-3 text-[13px] text-avocado-ink';

/** A centred confirmation dialog on the same walnut scrim as the sheet. Pair with DIALOG_PANEL inside. */
export const DIALOG =
  'm-auto w-[calc(100%-2rem)] max-w-sm bg-transparent p-0 text-ink outline-none backdrop:bg-[rgb(8_5_4/0.72)] backdrop:backdrop-blur-[3px]';
export const DIALOG_PANEL =
  'animate-fade-in rounded-2xl border border-edge bg-panel p-5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)]';
