import { describe, expect, it } from 'vitest';
import {
  isDateInCurrentMonth,
  shouldSaveTransactionForApproval,
} from './create-transaction.models';

const currentDate = new Date(2026, 8, 30);

describe('transaction date routing', () => {
  it('recognizes dates in the current local month', () => {
    expect(isDateInCurrentMonth('2026-09-01', currentDate)).toBe(true);
    expect(isDateInCurrentMonth('2026-09-30', currentDate)).toBe(true);
  });

  it('recognizes dates outside the current month across year boundaries', () => {
    expect(isDateInCurrentMonth('2026-08-31', currentDate)).toBe(false);
    expect(isDateInCurrentMonth('2026-10-01', currentDate)).toBe(false);
    expect(isDateInCurrentMonth('2027-09-30', currentDate)).toBe(false);
  });

  it('routes only unlinked out-of-month transactions to approval', () => {
    expect(shouldSaveTransactionForApproval('2026-08-31', undefined, currentDate)).toBe(true);
    expect(shouldSaveTransactionForApproval('2026-10-01', '', currentDate)).toBe(true);
    expect(shouldSaveTransactionForApproval('2026-08-31', 'trip-123', currentDate)).toBe(false);
    expect(shouldSaveTransactionForApproval('2026-09-30', undefined, currentDate)).toBe(false);
  });

  it('rejects malformed dates instead of treating them as current-month dates', () => {
    expect(isDateInCurrentMonth('not-a-date', currentDate)).toBe(false);
    expect(isDateInCurrentMonth('', currentDate)).toBe(false);
  });
});
