import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { TripBreakdownComponent } from './trip-breakdown';
import { TransactionService } from '../../services/transaction-service';
import { Adjustment } from '../../models/adjustments.model';
import { Transaction } from '../../models/transaction.model';

/** TanStack Query delivers results on a timer tick; wait for it, then for Angular. */
async function settle(fixture: { whenStable: () => Promise<unknown> }): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }
}

const splitDinner: Transaction = {
  id: 'tx-1',
  monthName: 'September 2026',
  date: '2026-09-02',
  description: 'Dinner',
  amount: 30,
  category: 'Food',
  createdAt: '2026-09-02T19:00:00Z',
  adjustmentId: 'trip-1',
  isSplit: true,
  paidBy: 'me',
  splitBy: [1],
  splitType: 'split',
  totalAmount: 60,
  splitPaidPersonIds: [],
};

describe('TripBreakdownComponent', () => {
  let component: TripBreakdownComponent;
  let fixture: ComponentFixture<TripBreakdownComponent>;
  let queryClient: QueryClient;
  const fetchTripTransactions = vi.fn();

  beforeEach(async () => {
    fetchTripTransactions.mockReset();
    fetchTripTransactions.mockResolvedValue([splitDinner]);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 300_000 } },
    });

    await TestBed.configureTestingModule({
      imports: [TripBreakdownComponent],
      providers: [
        provideTanStackQuery(queryClient),
        { provide: TransactionService, useValue: { fetchTripTransactions } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripBreakdownComponent);
    component = fixture.componentInstance;

    const trip: Adjustment = {
      id: 'trip-1',
      title: 'Weekend',
      adjType: true,
      amount: 0,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-04'),
      isTrip: true,
    };

    fixture.componentRef.setInput('trip', trip);
    await settle(fixture);
  });

  it('loads the trip through the shared trip query', () => {
    expect(fetchTripTransactions).toHaveBeenCalledTimes(1);
    expect(fetchTripTransactions).toHaveBeenCalledWith('trip-1');
    expect(component.totalSpent()).toBe(30);
  });

  it('shows the split indicator for split transactions in the trip breakdown list', async () => {
    component.expandedCategory.set('Food');
    await settle(fixture);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[aria-label="Split transaction"]')).not.toBeNull();
    expect(el.textContent).toContain('of €60.00');
  });

  it('says when the transactions add up to more than the stored total', () => {
    const gap = (fixture.nativeElement as HTMLElement).querySelector('.trip-gap');
    expect(component.unitemised()).toBe(-30);
    expect(gap?.textContent).toContain('Transactions add up to €30.00');
  });

  it('shows the part of the total that no transaction explains', async () => {
    fixture.componentRef.setInput('trip', { ...component.trip(), amount: 50 });
    await settle(fixture);
    const gap = (fixture.nativeElement as HTMLElement).querySelector('.trip-gap');
    expect(gap?.textContent).toContain('€20.00 not itemised');
  });

  it('shows no gap line when the total matches its transactions', async () => {
    fixture.componentRef.setInput('trip', { ...component.trip(), amount: 30 });
    await settle(fixture);
    expect((fixture.nativeElement as HTMLElement).querySelector('.trip-gap')).toBeNull();
  });

  it('keeps the open category after a save refreshes the trip', async () => {
    component.expandedCategory.set('Food');
    await settle(fixture);

    await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    await settle(fixture);

    expect(fetchTripTransactions).toHaveBeenCalledTimes(2);
    expect(component.expandedCategory()).toBe('Food');
  });
});
