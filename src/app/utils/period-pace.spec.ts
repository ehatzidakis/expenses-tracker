import { describe, expect, it } from 'vitest';
import { budgetStatus, categoryLabel, daysInRange, monthTiming } from './period-pace';

describe('monthTiming', () => {
  const now = new Date(2026, 9, 19); // 19 Oct 2026

  it('reads the current month with its pace and days left', () => {
    const t = monthTiming('October 2026', now);
    expect(t.kind).toBe('current');
    expect(t.daysInMonth).toBe(31);
    expect(t.daysLeft).toBe(13);
    expect(t.pace).toBeCloseTo(19 / 31);
  });

  it('treats earlier months as finished and later ones as not started', () => {
    expect(monthTiming('September 2026', now)).toMatchObject({ kind: 'past', pace: 1 });
    expect(monthTiming('January 2027', now)).toMatchObject({ kind: 'future', pace: 0 });
  });

  it('handles the year boundary', () => {
    expect(monthTiming('December 2026', new Date(2027, 0, 1)).kind).toBe('past');
    expect(monthTiming('January 2027', new Date(2027, 0, 1)).kind).toBe('current');
  });

  it('returns unknown for names it cannot read', () => {
    expect(monthTiming('All Time', now)).toMatchObject({ kind: 'unknown', pace: null });
  });
});

describe('budgetStatus', () => {
  it('ranks over, ahead of pace, full and on pace', () => {
    expect(budgetStatus(212, 180, 0.6)).toBe('over');
    expect(budgetStatus(386, 450, 0.6)).toBe('ahead');
    expect(budgetStatus(39, 39, 0.6)).toBe('full');
    expect(budgetStatus(48, 120, 0.6)).toBe('ok');
  });

  it('marks empty and unbudgeted categories', () => {
    expect(budgetStatus(0, 50, 0.6)).toBe('quiet');
    expect(budgetStatus(20, null, 0.6)).toBe('none');
  });

  it('never calls a finished month ahead of pace', () => {
    expect(budgetStatus(400, 450, 1)).toBe('ok');
  });
});

describe('categoryLabel', () => {
  it('splits camel case into a sentence', () => {
    expect(categoryLabel('EatingOut')).toBe('Eating out');
    expect(categoryLabel('Supermarket')).toBe('Supermarket');
  });
});

describe('daysInRange', () => {
  it('counts both ends', () => {
    expect(daysInRange(new Date(2026, 9, 12), new Date(2026, 9, 17))).toBe(6);
    expect(daysInRange(new Date(2026, 9, 12), new Date(2026, 9, 12))).toBe(1);
  });
});
