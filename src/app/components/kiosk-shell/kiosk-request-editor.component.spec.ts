import { TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PushNotificationService } from '../../services/push-notification.service';
import { PendingTransaction, TransactionService } from '../../services/transaction-service';
import { KioskRequestEditorComponent } from './kiosk-request-editor.component';

function request(overrides: Partial<PendingTransaction> = {}): PendingTransaction {
  return {
    id: 'r1',
    date: '2026-11-01',
    description: 'Electricity',
    category: 'Supermarket',
    amount: 0,
    createdAt: '2026-11-01T09:00:00.000Z',
    sourceRole: 'admin',
    status: 'pending',
    requestStatus: 'awaiting-kiosk',
    ...overrides,
  };
}

describe('KioskRequestEditorComponent', () => {
  let transactionService: {
    answerKioskRequest: ReturnType<typeof vi.fn>;
    declineKioskRequest: ReturnType<typeof vi.fn>;
  };
  let push: {
    notifyNewPending: ReturnType<typeof vi.fn>;
    notifyRequestDeclined: ReturnType<typeof vi.fn>;
  };

  function setup(req: PendingTransaction) {
    const fixture = TestBed.createComponent(KioskRequestEditorComponent);
    fixture.componentRef.setInput('request', req);
    fixture.detectChanges();
    const done = vi.fn();
    fixture.componentInstance.done.subscribe(done);
    return { editor: fixture.componentInstance, done };
  }

  beforeEach(() => {
    transactionService = {
      answerKioskRequest: vi.fn().mockResolvedValue(undefined),
      declineKioskRequest: vi.fn().mockResolvedValue(undefined),
    };
    push = {
      notifyNewPending: vi.fn().mockResolvedValue(undefined),
      notifyRequestDeclined: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      imports: [KioskRequestEditorComponent],
      providers: [
        { provide: TransactionService, useValue: transactionService },
        { provide: PushNotificationService, useValue: push },
        { provide: QueryClient, useValue: new QueryClient() },
      ],
    });
  });

  it("won't send a request back without an amount", async () => {
    const { editor, done } = setup(request());

    await editor.onSend();

    expect(editor.errorMessage()).toContain('amount');
    expect(transactionService.answerKioskRequest).not.toHaveBeenCalled();
    expect(done).not.toHaveBeenCalled();
  });

  it('sends the filled-in request back and tells the admin', async () => {
    const { editor, done } = setup(request());
    editor.setAmount(42.3);

    await editor.onSend();

    expect(transactionService.answerKioskRequest).toHaveBeenCalledWith(
      'r1',
      expect.objectContaining({ amount: 42.3, description: 'Electricity' }),
    );
    expect(push.notifyNewPending).toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith('Sent back for approval');
  });

  it('shows the cancelled message when the admin already removed the request', async () => {
    transactionService.answerKioskRequest.mockRejectedValue(
      new Error('This request was cancelled.'),
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { editor, done } = setup(request({ amount: 10, totalAmount: 10 }));

    await editor.onSend();

    expect(editor.errorMessage()).toBe('This request was cancelled.');
    expect(done).not.toHaveBeenCalled();
  });

  it('declines with a reason', async () => {
    const { editor, done } = setup(request());
    editor.declineReason.set('  Not mine ');

    await editor.onDecline();

    expect(transactionService.declineKioskRequest).toHaveBeenCalledWith('r1', 'Not mine');
    expect(push.notifyRequestDeclined).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r1' }),
      'Not mine',
    );
    expect(done).toHaveBeenCalledWith('Reason sent');
  });

  it("won't decline without a reason", async () => {
    const { editor } = setup(request());
    editor.declineReason.set('   ');

    await editor.onDecline();

    expect(transactionService.declineKioskRequest).not.toHaveBeenCalled();
  });
});
