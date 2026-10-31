import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';

import { CategoryBreakdownComponent } from './category-breakdown.component';
import { TransactionService } from '../../services/transaction-service';

const categories = [
  {
    name: 'Utilities',
    amount: 25,
    monthlyAverage: null,
    isAllTime: false,
    percentage: 100,
    budget: 110,
    overallBudget: null,
    isOverBudget: false,
  },
];

const tx = (id: string, category: string, adjustmentId?: string) => ({
  id,
  monthName: 'August 2026',
  date: '2026-08-01',
  description: id,
  amount: 10,
  category,
  createdAt: '',
  adjustmentId,
});

/** TanStack Query delivers results on a timer tick; wait for it, then for Angular. */
async function settle(fixture: { whenStable: () => Promise<unknown> }): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }
}

describe('CategoryBreakdownComponent', () => {
  let component: CategoryBreakdownComponent;
  let fixture: ComponentFixture<CategoryBreakdownComponent>;
  let queryClient: QueryClient;
  let fetchMonthTransactions: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    fetchMonthTransactions = vi
      .fn()
      .mockResolvedValueOnce([tx('a', 'Utilities'), tx('b', 'Gym'), tx('c', 'Utilities', 'trip')])
      .mockResolvedValueOnce([tx('a', 'Utilities')]);

    await TestBed.configureTestingModule({
      imports: [CategoryBreakdownComponent],
      providers: [
        provideTanStackQuery(queryClient),
        { provide: TransactionService, useValue: { fetchMonthTransactions } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryBreakdownComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('categories', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use the selected month without the year in the budget title', () => {
    fixture.componentRef.setInput('categories', []);
    fixture.componentRef.setInput('monthName', 'August 2026');
    fixture.detectChanges();

    expect(component.budgetTitle()).toBe("August's Budget");
  });

  it('should use an all-time title when no month is selected', () => {
    fixture.componentRef.setInput('categories', []);
    fixture.componentRef.setInput('monthName', '');
    fixture.detectChanges();

    expect(component.budgetTitle()).toBe('All-Time Budget');
  });

  it('does not load anything without a month', async () => {
    fixture.componentRef.setInput('categories', categories);
    await fixture.whenStable();

    expect(fetchMonthTransactions).not.toHaveBeenCalled();
    expect(component.transactionCounts()).toEqual({});
  });

  it('counts the month transactions per category, trip ones included', async () => {
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('monthName', 'August 2026');
    await settle(fixture);

    expect(fetchMonthTransactions).toHaveBeenCalledWith('August 2026');
    expect(component.transactionCounts()).toEqual({ Utilities: 2, Gym: 1 });
  });

  it('recounts after a save invalidates the expenses queries', async () => {
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('monthName', 'August 2026');
    await settle(fixture);

    await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    await settle(fixture);

    expect(fetchMonthTransactions).toHaveBeenCalledTimes(2);
    expect(component.transactionCounts()).toEqual({ Utilities: 1 });
  });
});
