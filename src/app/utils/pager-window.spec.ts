import { followWindow, windowStartAt } from './pager-window';

describe('windowStartAt', () => {
  it('puts the index first when two older items follow it', () => {
    expect(windowStartAt(4, 10)).toBe(4);
  });

  it('keeps a full window near the oldest items', () => {
    expect(windowStartAt(9, 10)).toBe(7);
    expect(windowStartAt(8, 10)).toBe(7);
  });

  it('starts at zero for short lists and no selection', () => {
    expect(windowStartAt(1, 2)).toBe(0);
    expect(windowStartAt(-1, 10)).toBe(0);
  });
});

describe('followWindow', () => {
  it('stays put while the selection is visible', () => {
    expect(followWindow(3, 3, 10)).toBe(3);
    expect(followWindow(3, 5, 10)).toBe(3);
  });

  it('pages older so the selection is first', () => {
    expect(followWindow(0, 3, 10)).toBe(3);
    expect(followWindow(6, 9, 10)).toBe(7);
  });

  it('pages newer so the selection is last', () => {
    expect(followWindow(3, 2, 10)).toBe(0);
    expect(followWindow(6, 5, 10)).toBe(3);
  });

  it('keeps the window when nothing is selected', () => {
    expect(followWindow(3, -1, 10)).toBe(3);
  });

  it('pulls a stale start back inside a shorter list', () => {
    expect(followWindow(7, 1, 4)).toBe(1);
  });
});
