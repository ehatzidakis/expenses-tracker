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

  const toggle = async () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    await settle(fixture);
  };

  beforeEach(async () => {
    fetchMonthTransactions.mockReset();
    fetchMonthTransactions.mockResolvedValue([transaction]);
    fetchTripTransactions.mockReset();
    await TestBed.configureTestingModule({
      imports: [RecentTransactionsComponent],
      providers: [
        // Same cache time as the app, so re-opening the card reuses the cached month.
        provideTanStackQuery(
          new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 300_000 } } }),
        ),
        {
          provide: TransactionService,
          useValue: { fetchMonthTransactions, fetchTripTransactions },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentTransactionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('monthName', 'September 2026');
    await fixture.whenStable();
  });

  it('starts collapsed and does not query until expanded', async () => {
    expect(component.expanded()).toBe(false);
    expect(fetchMonthTransactions).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[aria-expanded="false"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Dinner');

    await toggle();

    expect(fetchMonthTransactions).toHaveBeenCalledTimes(1);
    expect(fetchMonthTransactions).toHaveBeenCalledWith('September 2026');
  });

  it('expands to show transaction values without edit controls', async () => {
    await toggle();

    expect(component.expanded()).toBe(true);
    expect(fixture.nativeElement.querySelector('[aria-expanded="true"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Dinner');
    expect(fixture.nativeElement.textContent).toContain('EatingOut');
    expect(fixture.nativeElement.textContent).toContain('Restaurant');
    expect(fixture.nativeElement.textContent).toContain('Team dinner');
    expect(fixture.nativeElement.textContent).not.toContain('Edit');
  });

  it('does not refetch when collapsed and expanded again', async () => {
    await toggle();
    await toggle();
    await toggle();

    expect(fetchMonthTransactions).toHaveBeenCalledTimes(1);
  });

  it('does not fetch a new month while collapsed, only on the next expand', async () => {
    await toggle();
    await toggle();
    fixture.componentRef.setInput('monthName', 'October 2026');
    await fixture.whenStable();

    expect(fetchMonthTransactions).toHaveBeenCalledTimes(1);

    await toggle();

    expect(fetchMonthTransactions).toHaveBeenCalledTimes(2);
    expect(fetchMonthTransactions).toHaveBeenLastCalledWith('October 2026');
  });

  it('pages through transactions 10 at a time without refetching', async () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      ...transaction,
      id: `tx-${i}`,
      description: `Item ${i}`,
    }));
    fetchMonthTransactions.mockResolvedValue(many);
    await toggle();

    const articles = () => fixture.nativeElement.querySelectorAll('article').length;
    const showMore = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
      ).find((button) => button.textContent?.includes('Show more'));

    expect(articles()).toBe(10);
    expect(fixture.nativeElement.textContent).toContain('10 of 25 shown');

    showMore()!.click();
    await fixture.whenStable();
    expect(articles()).toBe(20);

    showMore()!.click();
    await fixture.whenStable();
    expect(articles()).toBe(25);
    expect(showMore()).toBeUndefined();
    expect(fetchMonthTransactions).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state', async () => {
    fetchMonthTransactions.mockResolvedValue([]);
    await toggle();

    expect(fixture.nativeElement.textContent).toContain('No transactions yet.');
  });

  it('hides trip transactions in month mode and sorts newest first', async () => {
    fetchMonthTransactions.mockResolvedValue([
      { ...transaction, id: 'old', description: 'Older', date: '2026-09-01' },
      { ...transaction, id: 'trip', description: 'Trip lunch', adjustmentId: 'trip-1' },
      { ...transaction, id: 'new', description: 'Newer', date: '2026-09-28' },
    ]);
    await toggle();

    expect(component.transactions().map((item) => item.id)).toEqual(['new', 'old']);
  });

  it('loads the trip list in trip mode', async () => {
    fetchTripTransactions.mockResolvedValue([
      { ...transaction, id: 'trip', description: 'Trip lunch', adjustmentId: 'trip-1' },
    ]);
    fixture.componentRef.setInput('monthName', null);
    fixture.componentRef.setInput('adjustmentId', 'trip-1');
    await toggle();

    expect(fetchTripTransactions).toHaveBeenCalledWith('trip-1');
    expect(fetchMonthTransactions).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Trip lunch');
  });
});
