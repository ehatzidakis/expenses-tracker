import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { SplitzService } from '../../services/splitz.service';
import { SplitzSettlementService } from '../../services/splitz-settlement.service';
import { PendingTransaction, TransactionService } from '../../services/transaction-service';
import { SplitzesModalComponent } from './splitzes-modal.component';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function pendingTransaction(id: string): PendingTransaction {
  return {
    id,
    date: '2026-09-18',
    description: `Dinner ${id}`,
    category: 'Supermarket',
    amount: 12,
    createdAt: '2026-09-18T10:00:00.000Z',
    sourceRole: 'admin',
    status: 'pending',
  };
}

describe('SplitzesModalComponent pending review', () => {
  let fixture: ComponentFixture<SplitzesModalComponent>;
  let component: SplitzesModalComponent;
  let pendingList: PendingTransaction[];
  let transactionService: {
    fetchPendingTransactions: ReturnType<typeof vi.fn>;
    acceptPendingTransaction: ReturnType<typeof vi.fn>;
    declinePendingTransaction: ReturnType<typeof vi.fn>;
  };

  const buttonWithText = (text: string): HTMLButtonElement | undefined =>
    Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === text,
    );

  beforeEach(async () => {
    pendingList = [pendingTransaction('p1'), pendingTransaction('p2')];
    transactionService = {
      fetchPendingTransactions: vi.fn().mockImplementation(async () => pendingList),
      acceptPendingTransaction: vi.fn().mockResolvedValue(undefined),
      declinePendingTransaction: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [SplitzesModalComponent],
      providers: [
        {
          provide: QueryClient,
          useValue: new QueryClient({
            defaultOptions: { queries: { retry: false, gcTime: Infinity } },
          }),
        },
        { provide: TransactionService, useValue: transactionService },
        { provide: AuthService, useValue: { isAdmin: signal(true) } },
        {
          provide: SplitzService,
          useValue: {
            getSplitTransactionsQuery: () => ({
              isPending: () => false,
              isError: () => false,
              data: () => [],
            }),
            computePersonSummaries: () => [],
          },
        },
        {
          provide: SplitzSettlementService,
          useValue: { getHistoryQuery: () => ({ isPending: () => false, data: () => [] }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SplitzesModalComponent);
    component = fixture.componentInstance;
    component.showPendingReview.set(true);
    fixture.detectChanges();
    await vi.waitFor(() => expect(component.pendingTransactions()).toHaveLength(2));
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs a single accept when Accept is pressed repeatedly', async () => {
    const accepting = deferred();
    transactionService.acceptPendingTransaction.mockReturnValue(accepting.promise);

    const first = component.onAcceptPending('p1');
    const second = component.onAcceptPending('p1');

    expect(transactionService.acceptPendingTransaction).toHaveBeenCalledTimes(1);
    expect(component.pendingActionFor('p1')).toBe('accept');

    pendingList = [pendingTransaction('p2')];
    accepting.resolve();
    await Promise.all([first, second]);

    expect(transactionService.acceptPendingTransaction).toHaveBeenCalledTimes(1);
    expect(component.pendingAction()).toBeNull();
  });

  it('shows a loading state and disables every row action while accepting', async () => {
    const accepting = deferred();
    transactionService.acceptPendingTransaction.mockReturnValue(accepting.promise);

    component.startEditingPending('p1');
    fixture.detectChanges();
    buttonWithText('Accept')?.click();
    fixture.detectChanges();

    const acceptButton = buttonWithText('Accepting…');
    expect(acceptButton?.disabled).toBe(true);
    expect(acceptButton?.getAttribute('aria-busy')).toBe('true');
    expect(buttonWithText('Cancel')?.disabled).toBe(true);
    expect(buttonWithText('Edit / Accept')?.disabled).toBe(true);
    expect(buttonWithText('Decline')?.disabled).toBe(true);

    pendingList = [pendingTransaction('p2')];
    accepting.resolve();
    await vi.waitFor(() => expect(component.pendingAction()).toBeNull());
    fixture.detectChanges();

    expect(buttonWithText('Accepting…')).toBeUndefined();
    expect(buttonWithText('Edit / Accept')?.disabled).toBe(false);
  });

  it('releases the lock and shows an inline error when accepting fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    transactionService.acceptPendingTransaction.mockRejectedValue(new Error('offline'));

    component.startEditingPending('p1');
    await component.onAcceptPending('p1');
    fixture.detectChanges();

    expect(component.pendingAction()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to accept',
    );
    expect(buttonWithText('Accept')?.disabled).toBe(false);

    buttonWithText('Cancel')?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows the live custom split remainder for incoming transactions', () => {
    const pending = {
      ...pendingTransaction('p1'),
      isSplit: true,
      splitType: 'custom' as const,
      splitBy: [1],
      totalAmount: 12,
      customSplitAmounts: { me: 5, 1: 3 },
    };
    component.pendingDrafts.set({ p1: pending });
    component.editingPendingId.set('p1');
    fixture.detectChanges();

    expect(component.getPendingCustomRemainingLabel(component.pendingTransactions()[0])).toBe(
      '€4.00 remaining to be split',
    );
    expect(fixture.nativeElement.textContent).toContain('€4.00 remaining to be split');

    component.updatePendingDraft('p1', 'customSplitAmounts', { me: 8, 1: 4 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('All split — €0.00');
  });

  it('labels custom splits that exceed the total and rounds remainder to cents', () => {
    const pending = {
      ...pendingTransaction('p1'),
      isSplit: true,
      splitType: 'custom' as const,
      splitBy: [1],
      totalAmount: 12,
      customSplitAmounts: { me: 8.01, 1: 4 },
    };

    expect(component.getPendingCustomRemaining(pending)).toBe(-0.01);
    expect(component.getPendingCustomRemainingLabel(pending)).toBe('€0.01 over the total');
  });

  it('does not accept a custom split until its shares equal the total', async () => {
    component.pendingDrafts.set({
      p1: {
        ...pendingTransaction('p1'),
        isSplit: true,
        splitType: 'custom',
        splitBy: [1],
        totalAmount: 12,
        customSplitAmounts: { me: 5, 1: 3 },
      },
    });
    component.editingPendingId.set('p1');
    await component.onAcceptPending('p1');

    expect(transactionService.acceptPendingTransaction).not.toHaveBeenCalled();
    expect(component.pendingError()).toEqual({
      id: 'p1',
      message: 'Custom split total must equal €12.00. €4.00 remaining to be split',
    });

    component.updatePendingDraft('p1', 'customSplitAmounts', { me: 8, 1: 4 });
    expect(component.pendingError()).toBeNull();
    await component.onAcceptPending('p1');

    expect(transactionService.acceptPendingTransaction).toHaveBeenCalledTimes(1);
    expect(transactionService.acceptPendingTransaction).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ amount: 8, totalAmount: 12 }),
    );
  });

  it('locks every row while declining and releases them afterwards', async () => {
    const declining = deferred();
    transactionService.declinePendingTransaction.mockReturnValue(declining.promise);

    const first = component.onDeclinePending('p1');
    const second = component.onDeclinePending('p1');
    fixture.detectChanges();

    expect(transactionService.declinePendingTransaction).toHaveBeenCalledTimes(1);
    expect(buttonWithText('Declining…')?.disabled).toBe(true);
    expect(buttonWithText('Decline')?.disabled).toBe(true);

    pendingList = [pendingTransaction('p2')];
    declining.resolve();
    await Promise.all([first, second]);

    expect(component.pendingAction()).toBeNull();
  });

  it('ignores actions on other rows while one is in flight', async () => {
    const accepting = deferred();
    transactionService.acceptPendingTransaction.mockReturnValue(accepting.promise);

    const first = component.onAcceptPending('p1');
    await component.onAcceptPending('p2');
    await component.onDeclinePending('p2');

    expect(transactionService.acceptPendingTransaction).toHaveBeenCalledTimes(1);
    expect(transactionService.declinePendingTransaction).not.toHaveBeenCalled();

    pendingList = [pendingTransaction('p2')];
    accepting.resolve();
    await first;
  });
});
