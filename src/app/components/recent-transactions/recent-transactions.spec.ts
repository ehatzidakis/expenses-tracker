import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { RecentTransactionsComponent } from './recent-transactions';
import { TransactionService } from '../../services/transaction-service';
import { Transaction } from '../../models/transaction.model';

/** TanStack Query delivers results on a timer tick; wait for it, then for Angular. */
async function settle(fixture: { whenStable: () => Promise<unknown> }): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }
}

describe('RecentTransactionsComponent', () => {
  let component: RecentTransactionsComponent;
  let fixture: ComponentFixture<RecentTransactionsComponent>;
  const fetchMonthTransactions = vi.fn();
  const fetchTripTransactions = vi.fn();

  const transaction: Transaction = {
    id: 'tx-1',
    monthName: 'September 2026',
    date: '2026-09-24',
    description: 'Dinner',
    amount: 42.5,
    category: 'EatingOut',
    subCategory: 'Restaurant',
    comment: 'Team dinner',
    createdAt: '2026-09-24T20:00:00.000Z',
    isSplit: true,
    paidBy: 'me',
    splitBy: [1],
    splitType: 'split',
    totalAmount: 85,
  };

  const header = () => fixture.nativeElement.querySelector('[aria-expanded]') as HTMLButtonElement;
  const rows = () =>
    fixture.nativeElement.querySelectorAll('app-transaction-list li').length as number;

  /** Creates the list and, unless told otherwise, opens it (it starts hidden). */
  async function create(monthName: string | null, adjustmentId: string | null = null, open = true) {
    fixture = TestBed.createComponent(RecentTransactionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('monthName', monthName);
    fixture.componentRef.setInput('adjustmentId', adjustmentId);
    await settle(fixture);
    if (open) {
      header().click();
      await settle(fixture);
    }
  }

  beforeEach(async () => {
    fetchMonthTransactions.mockReset();
    fetchMonthTransactions.mockResolvedValue([transaction]);
    fetchTripTransactions.mockReset();
    await TestBed.configureTestingModule({
      imports: [RecentTransactionsComponent],
      providers: [
        // Same cache time as the app, so re-opening the list reuses the cached month.
        provideTanStackQuery(
          new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 300_000 } } }),
        ),
        {
          provide: TransactionService,
          useValue: { fetchMonthTransactions, fetchTripTransactions },
        },
      ],
    }).compileComponents();
  });

  it('starts hidden and loads nothing until opened', async () => {
    await create('September 2026', null, false);

    expect(component.expanded()).toBe(false);
    expect(header().getAttribute('aria-expanded')).toBe('false');
    expect(fetchMonthTransactions).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Dinner');
  });

  it('shows the month through the shared month query once opened', async () => {
    await create('September 2026');

    expect(component.expanded()).toBe(true);
    expect(header().getAttribute('aria-expanded')).toBe('true');
    expect(fetchMonthTransactions).toHaveBeenCalledTimes(1);
    expect(fetchMonthTransactions).toHaveBeenCalledWith('September 2026');

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Dinner');
    expect(text).toContain('Eating out');
    expect(text).toContain('Restaurant');
    expect(text).toContain('Team dinner');
  });

  it('hides and shows the list without refetching', async () => {
    await create('September 2026');

    header().click();
    await settle(fixture);
    expect(component.expanded()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Dinner');

    header().click();
    await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain('Dinner');
    expect(fetchMonthTransactions).toHaveBeenCalledTimes(1);
  });

  it('pages through transactions 10 at a time without refetching', async () => {
    fetchMonthTransactions.mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => ({ ...transaction, id: `tx-${i}`, description: `Item ${i}` })),
    );
    await create('September 2026');

    const loadMore = () =>
      Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(
        (button) => button.textContent?.trim() === 'Load more',
      );

    expect(rows()).toBe(10);
    loadMore()!.click();
    await fixture.whenStable();
    expect(rows()).toBe(20);
    loadMore()!.click();
    await fixture.whenStable();
    expect(rows()).toBe(25);
    expect(loadMore()).toBeUndefined();
    expect(fetchMonthTransactions).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state', async () => {
    fetchMonthTransactions.mockResolvedValue([]);
    await create('September 2026');

    expect(fixture.nativeElement.textContent).toContain('No transactions yet.');
  });

  it('hides trip transactions in month mode and sorts newest first', async () => {
    fetchMonthTransactions.mockResolvedValue([
      { ...transaction, id: 'old', description: 'Older', date: '2026-09-01' },
      { ...transaction, id: 'trip', description: 'Trip lunch', adjustmentId: 'trip-1' },
      { ...transaction, id: 'new', description: 'Newer', date: '2026-09-28' },
    ]);
    await create('September 2026');

    expect(component.transactions().map((item) => item.id)).toEqual(['new', 'old']);
  });

  it('loads the trip list in trip mode', async () => {
    fetchTripTransactions.mockResolvedValue([
      { ...transaction, id: 'trip', description: 'Trip lunch', adjustmentId: 'trip-1' },
    ]);
    await create(null, 'trip-1');

    expect(fetchTripTransactions).toHaveBeenCalledWith('trip-1');
    expect(fetchMonthTransactions).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Trip lunch');
  });

  it('selects a transaction for editing when its row is tapped', async () => {
    await create('September 2026');

    (fixture.nativeElement.querySelector('app-transaction-list li button') as HTMLButtonElement).click();

    expect(component.selected()?.id).toBe('tx-1');
  });
});
