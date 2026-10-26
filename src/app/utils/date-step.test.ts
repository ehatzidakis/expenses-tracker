import { describe, expect, it } from 'vitest';
import { todayDateInputValue } from '../components/create-transaction.component/create-transaction.models';
import { shiftDateInputValue } from './date-step';

describe('shiftDateInputValue', () => {
  it('moves forward and back by one day', () => {
    expect(shiftDateInputValue('2026-10-26', 1)).toBe('2026-10-27');
    expect(shiftDateInputValue('2026-10-26', -1)).toBe('2026-10-25');
  });

  it('crosses month and year boundaries', () => {
    expect(shiftDateInputValue('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftDateInputValue('2026-11-01', -1)).toBe('2026-10-31');
    expect(shiftDateInputValue('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftDateInputValue('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('handles leap years', () => {
    expect(shiftDateInputValue('2028-02-28', 1)).toBe('2028-02-29');
    expect(shiftDateInputValue('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('starts from today when the value is empty', () => {
    expect(shiftDateInputValue('', 0)).toBe(todayDateInputValue());
  });
});
