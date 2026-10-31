import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { SplitzService } from '../../services/splitz.service';
import { SplitzSettlementService } from '../../services/splitz-settlement.service';
import { PendingTransaction, TransactionService } from '../../services/transaction-service';
import { SplitzesModalComponent } from './splitzes-modal.component';

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

async function setup(
  isAdmin: boolean,
  pending: PendingTransaction[] = [],
): Promise<ComponentFixture<SplitzesModalComponent>> {
  await TestBed.configureTestingModule({
    imports: [SplitzesModalComponent],
    providers: [
      { provide: QueryClient, useValue: new QueryClient() },
      { provide: AuthService, useValue: { isAdmin: signal(isAdmin) } },
      {
        provide: TransactionService,
        useValue: {
          getPendingTransactionsQuery: () => ({
            data: signal(pending),
            isPending: () => false,
            isError: () => false,
            refetch: vi.fn(),
          }),
          acceptPendingTransaction: vi.fn(),
          declinePendingTransaction: vi.fn(),
        },
      },
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

  const fixture = TestBed.createComponent(SplitzesModalComponent);
  fixture.detectChanges();
  return fixture;
}

const tabLabels = (fixture: ComponentFixture<SplitzesModalComponent>): string[] =>
  Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('[role="tab"]')).map(
    (tab) => tab.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );

const clickTab = (fixture: ComponentFixture<SplitzesModalComponent>, label: string): void => {
  Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('[role="tab"]'))
    .find((tab) => tab.textContent?.trim().startsWith(label))
    ?.click();
  fixture.detectChanges();
};

describe('SplitzesModalComponent', () => {
  it('hides the Incoming tab for non-admins', async () => {
    const fixture = await setup(false, [pendingTransaction('p1')]);

    expect(tabLabels(fixture)).toEqual(['Balances', 'History']);
    expect(fixture.componentInstance.activeTab()).toBe('balances');
  });

  it('opens on Balances and badges Incoming with the pending count', async () => {
    const fixture = await setup(true, [pendingTransaction('p1'), pendingTransaction('p2')]);

    expect(tabLabels(fixture)).toEqual(['Balances', 'Incoming 2', 'History']);
    expect(fixture.componentInstance.activeTab()).toBe('balances');

    clickTab(fixture, 'Incoming');
    expect(fixture.nativeElement.querySelectorAll('.pending-row')).toHaveLength(2);
  });

  it('opens the review screen when a row is tapped and returns on Back', async () => {
    const fixture = await setup(true, [pendingTransaction('p1')]);
    clickTab(fixture, 'Incoming');

    fixture.nativeElement.querySelector('.pending-row').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Review incoming');

    Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Back'))
      ?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.pending-row')).toHaveLength(1);
  });

  it('switches tab content', async () => {
    const fixture = await setup(true);
    expect(fixture.componentInstance.activeTab()).toBe('balances');

    clickTab(fixture, 'History');
    expect(fixture.nativeElement.textContent).toContain('No settlements yet.');

    clickTab(fixture, 'Incoming');
    expect(fixture.nativeElement.textContent).toContain('Nothing to review right now.');
  });
});
