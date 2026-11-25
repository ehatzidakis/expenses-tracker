/** How many items (months or trips) the pager shows at once. */
export const PAGER_SIZE = 3;

/**
 * Window start that puts `index` first, or as far along as a full window allows.
 * Items are newest-first, so the window shows the selected item and the two before it in time.
 */
export function windowStartAt(index: number, count: number): number {
  return Math.max(0, Math.min(index, count - PAGER_SIZE));
}

/**
 * Where the window starts once the selection moves to `index`. It stays put while the selection
 * is visible. Stepping older past the right edge pages so the selection is first; stepping newer
 * past the left edge pages back so the selection is last.
 */
export function followWindow(start: number, index: number, count: number): number {
  const current = windowStartAt(start, count);
  if (index < 0 || (index >= current && index < current + PAGER_SIZE)) return current;
  if (index > current) return windowStartAt(index, count);
  return Math.max(0, index - PAGER_SIZE + 1);
}
