import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { BudgetSettingsService } from './budget-settings.service';
import { TransactionService } from './transaction-service';

type CommitInternals = { commitPendingTransaction: (id: string) => Promise<void> };

describe('TransactionService.acceptPendingTransaction', () => {
  let service: TransactionService;

  const spyOnCommit = () =>
    vi.spyOn(service as unknown as CommitInternals, 'commitPendingTransaction');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TransactionService,
        { provide: AuthService, useValue: {} },
        { provide: BudgetSettingsService, useValue: {} },
      ],
    });
    service = TestBed.inject(TransactionService);
  });

  it('runs once when the same pending transaction is accepted concurrently', async () => {
    let finish!: () => void;
    const commit = spyOnCommit().mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );

    const first = service.acceptPendingTransaction('p1');
    const second = service.acceptPendingTransaction('p1');
    finish();
    await Promise.all([first, second]);

    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('does not block a different pending transaction', async () => {
    let finish!: () => void;
    const commit = spyOnCommit()
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
      )
      .mockResolvedValue(undefined);

    const first = service.acceptPendingTransaction('p1');
    await service.acceptPendingTransaction('p2');
    finish();
    await first;

    expect(commit).toHaveBeenCalledTimes(2);
  });

  it('accepts the same id again once the previous attempt has finished', async () => {
    const commit = spyOnCommit().mockResolvedValue(undefined);

    await service.acceptPendingTransaction('p1');
    await service.acceptPendingTransaction('p1');

    expect(commit).toHaveBeenCalledTimes(2);
  });

  it('releases the id when the attempt fails', async () => {
    const commit = spyOnCommit()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(undefined);

    await expect(service.acceptPendingTransaction('p1')).rejects.toThrow('offline');
    await service.acceptPendingTransaction('p1');

    expect(commit).toHaveBeenCalledTimes(2);
  });
});
