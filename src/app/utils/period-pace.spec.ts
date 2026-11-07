import { describe, expect, it } from 'vitest';
import { budgetStatus, categoryLabel, daysInRange, monthTiming, friendlyDate, monthNameOf, ordinal } from './period-pace';

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

  it('ignores a small lead over the pace', () => {
    // Gym: €16.25 of €65 a week into the month is €1.08 ahead: noise.
    expect(budgetStatus(16.25, 65, 7 / 30)).toBe('ok');
    // A €30 budget needs the €5 floor, not 10% (€3).
    expect(budgetStatus(19, 30, 0.5)).toBe('ok');
    expect(budgetStatus(20, 30, 0.5)).toBe('ahead');
    // A €450 budget needs 10% (€45), not €5.
    expect(budgetStatus(310, 450, 0.6)).toBe('ok');
    expect(budgetStatus(316, 450, 0.6)).toBe('ahead');
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

describe('date labels', () => {
  it('adds the right ordinal suffix', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '31st',
    ]);
  });

  it('turns a date into the month record key', () => {
    expect(monthNameOf('2026-11-06')).toBe('November 2026');
    expect(monthNameOf('2027-01-31')).toBe('January 2027');
    expect(monthNameOf('not a date')).toBe('');
  });

  it('names today and yesterday, and dates the rest', () => {
    const now = new Date(2026, 10, 13, 9, 0);
    expect(friendlyDate('2026-11-13', now)).toBe('Today · Fri. 13th');
    expect(friendlyDate('2026-11-12', now)).toBe('Yesterday · Thu. 12th');
    expect(friendlyDate('2026-11-02', now)).toBe('Mon. 2nd Nov');
  });
});
