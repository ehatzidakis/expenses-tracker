import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RecentTransactionsComponent } from './recent-transactions';
import { TransactionService } from '../../services/transaction-service';
import { Transaction } from '../../models/transaction.model';

describe('RecentTransactionsComponent', () => {
  let component: RecentTransactionsComponent;
  let fixture: ComponentFixture<RecentTransactionsComponent>;
  const fetchRecentTransactions = vi.fn();

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
    await fixture.whenStable();
  };

  beforeEach(async () => {
    fetchRecentTransactions.mockReset();
    fetchRecentTransactions.mockResolvedValue([transaction]);
    await TestBed.configureTestingModule({
      imports: [RecentTransactionsComponent],
      providers: [{ provide: TransactionService, useValue: { fetchRecentTransactions } }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentTransactionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('monthName', 'September 2026');
    await fixture.whenStable();
  });

  it('starts collapsed and does not query until expanded', async () => {
    expect(component.expanded()).toBe(false);
    expect(fetchRecentTransactions).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[aria-expanded="false"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Dinner');

    await toggle();

    expect(fetchRecentTransactions).toHaveBeenCalledTimes(1);
    expect(fetchRecentTransactions).toHaveBeenCalledWith({
      monthName: 'September 2026',
      adjustmentId: undefined,
    });
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

    expect(fetchRecentTransactions).toHaveBeenCalledTimes(1);
  });

  it('does not fetch a new month while collapsed, only on the next expand', async () => {
    await toggle();
    await toggle();
    fixture.componentRef.setInput('monthName', 'October 2026');
    await fixture.whenStable();

    expect(fetchRecentTransactions).toHaveBeenCalledTimes(1);

    await toggle();

    expect(fetchRecentTransactions).toHaveBeenCalledTimes(2);
    expect(fetchRecentTransactions).toHaveBeenLastCalledWith({
      monthName: 'October 2026',
      adjustmentId: undefined,
    });
  });

  it('pages through transactions 10 at a time without refetching', async () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      ...transaction,
      id: `tx-${i}`,
      description: `Item ${i}`,
    }));
    fetchRecentTransactions.mockResolvedValue(many);
    await toggle();

    const articles = () => fixture.nativeElement.querySelectorAll('article').length;
    const showMore = () =>
      Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find((button) => button.textContent?.includes('Show more'));

    expect(articles()).toBe(10);
    expect(fixture.nativeElement.textContent).toContain('10 of 25 shown');

    showMore()!.click();
    await fixture.whenStable();
    expect(articles()).toBe(20);

    showMore()!.click();
    await fixture.whenStable();
    expect(articles()).toBe(25);
    expect(showMore()).toBeUndefined();
    expect(fetchRecentTransactions).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state', async () => {
    fetchRecentTransactions.mockResolvedValue([]);
    await toggle();

    expect(fixture.nativeElement.textContent).toContain('No transactions yet.');
  });
});
