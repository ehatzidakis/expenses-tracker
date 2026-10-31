import { describe, expect, it } from 'vitest';
import { countAdminBadge } from './pending-badge.service';
import type { PendingTransaction } from './transaction-service';

const item = (
  sourceRole: PendingTransaction['sourceRole'],
  requestStatus?: PendingTransaction['requestStatus'],
) => ({ sourceRole, requestStatus }) as PendingTransaction;

describe('countAdminBadge', () => {
  it("counts kiosk items, not the admin's own scheduled ones", () => {
    expect(countAdminBadge([item('kiosk'), item('admin'), item('kiosk')])).toBe(2);
  });

  it('counts replies and declined requests, but not requests still with the kiosk', () => {
    expect(
      countAdminBadge([
        item('admin', 'awaiting-kiosk'),
        item('kiosk', 'answered'),
        item('admin', 'declined'),
      ]),
    ).toBe(2);
  });

  it('is zero when nothing is loaded yet', () => {
    expect(countAdminBadge(undefined)).toBe(0);
  });
});
