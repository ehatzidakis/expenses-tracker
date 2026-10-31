import { describe, expect, it } from 'vitest';
import { countKioskPending } from './pending-badge.service';
import type { PendingTransaction } from './transaction-service';

const item = (sourceRole: PendingTransaction['sourceRole']) =>
  ({ sourceRole }) as PendingTransaction;

describe('countKioskPending', () => {
  it("counts only kiosk items, not the admin's own scheduled ones", () => {
    expect(countKioskPending([item('kiosk'), item('admin'), item('kiosk')])).toBe(2);
  });

  it('is zero when nothing is loaded yet', () => {
    expect(countKioskPending(undefined)).toBe(0);
  });
});
