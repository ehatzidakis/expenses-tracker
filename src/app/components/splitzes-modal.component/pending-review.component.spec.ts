import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { PendingTransaction, TransactionService } from '../../services/transaction-service';
import { PendingReviewComponent } from './pending-review.component';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function pendingTransaction(overrides: Partial<PendingTransaction> = {}): PendingTransaction {
  return {
    id: 'p1',
    date: '2026-09-18',
    description: 'Dinner p1',
    category: 'Supermarket',
    amount: 12,
    createdAt: '2026-09-18T10:00:00.000Z',
    sourceRole: 'admin',
    status: 'pending',
    ...overrides,
  };
}

describe('PendingReviewComponent', () => {
  let fixture: ComponentFixture<PendingReviewComponent>;
  let component: PendingReviewComponent;
  let transactionService: {
    acceptPendingTransaction: ReturnType<typeof vi.fn>;
    declinePendingTransaction: ReturnType<typeof vi.fn>;
  };

  const buttonWithText = (text: string): HTMLButtonElement | undefined =>
    Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === text,
    );

  async function setup(pending = pendingTransaction()): Promise<void> {
    transactionService = {
      acceptPendingTransaction: vi.fn().mockResolvedValue(undefined),
      declinePendingTransaction: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [PendingReviewComponent],
      providers: [
        { provide: QueryClient, useValue: new QueryClient() },
        { provide: TransactionService, useValue: transactionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PendingReviewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('pending', pending);
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('admin entry', () => {
    beforeEach(() => setup());

    it('runs a single accept when Accept is pressed repeatedly', async () => {
      const accepting = deferred();
      transactionService.acceptPendingTransaction.mockReturnValue(accepting.promise);
      const accepted = vi.fn();
      component.accepted.subscribe(accepted);

      const first = component.onAccept();
      const second = component.onAccept();
      expect(transactionService.acceptPendingTransaction).toHaveBeenCalledTimes(1);

      accepting.resolve();
      await Promise.all([first, second]);

      expect(accepted).toHaveBeenCalledTimes(1);
      expect(component.submitting()).toBe(false);
    });

    it('shows a loading state and disables both actions while accepting', async () => {
      const accepting = deferred();
      transactionService.acceptPendingTransaction.mockReturnValue(accepting.promise);

      const run = component.onAccept();
      fixture.detectChanges();

      expect(buttonWithText('Accepting…')?.disabled).toBe(true);
      expect(buttonWithText('Decline')?.disabled).toBe(true);

      accepting.resolve();
      await run;
      fixture.detectChanges();

      expect(buttonWithText('Accept transaction')?.disabled).toBe(false);
    });

    it('shows an inline error and unlocks when accepting fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      transactionService.acceptPendingTransaction.mockRejectedValue(new Error('offline'));

      await component.onAccept();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Unable to accept. Please try again.');
      expect(buttonWithText('Accept transaction')?.disabled).toBe(false);
    });

    it('does not accept a custom split until its shares equal the total', async () => {
      component.split.set({
        goesSplitzes: true,
        splitWith: [1],
        paidById: 'me',
        customSplitMode: true,
        customSplitAmounts: { me: 5, 1: 3 },
      });
      await component.onAccept();

      expect(transactionService.acceptPendingTransaction).not.toHaveBeenCalled();
      expect(component.errorMessage()).toBe(
        'Custom split total must equal €12.00. €4.00 remaining to be split',
      );

      component.split.update((state) => ({ ...state, customSplitAmounts: { me: 8, 1: 4 } }));
      await component.onAccept();

      expect(transactionService.acceptPendingTransaction).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ amount: 8, totalAmount: 12 }),
      );
    });

    it('asks for confirmation before declining', async () => {
      // jsdom has no <dialog> modal support.
      const original = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
      Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.setAttribute('open', '');
        },
      });
      onTestFinished(() => {
        if (original) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', original);
        else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
      });
      const declined = vi.fn();
      component.declined.subscribe(declined);

      buttonWithText('Decline')?.click();
      fixture.detectChanges();

      expect(component.showDeclineConfirm()).toBe(true);
      expect(transactionService.declinePendingTransaction).not.toHaveBeenCalled();

      await component.onDecline();

      expect(transactionService.declinePendingTransaction).toHaveBeenCalledWith('p1');
      expect(declined).toHaveBeenCalledTimes(1);
      expect(component.showDeclineConfirm()).toBe(false);
    });

    it('shows the editable split controls', () => {
      expect(fixture.nativeElement.textContent).toContain('Go Splitzes');
    });
  });

  describe('kiosk entry', () => {
    beforeEach(() => setup(pendingTransaction({ sourceRole: 'kiosk', amount: 20 })));

    it('pre-fills the default kiosk split in editable controls', () => {
      expect(fixture.nativeElement.textContent).toContain('Go Splitzes');
      expect(component.split()).toMatchObject({
        goesSplitzes: true,
        splitWith: [1],
        paidById: 1,
      });
    });

    it('accepts the default as my half of the kiosk total', async () => {
      await component.onAccept();
      expect(transactionService.acceptPendingTransaction).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ amount: 10, totalAmount: 20, isSplit: true, paidBy: 1 }),
      );
    });

    it('sends the reviewer split changes', async () => {
      component.split.set({
        goesSplitzes: true,
        splitWith: [1, 2],
        paidById: 'me',
        customSplitMode: false,
        customSplitAmounts: {},
      });
      await component.onAccept();
      expect(transactionService.acceptPendingTransaction).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ isSplit: true, paidBy: 'me', splitBy: [1, 2], totalAmount: 20 }),
      );
    });
  });
});
