import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
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

describe('CategoryBreakdownComponent', () => {
  let component: CategoryBreakdownComponent;
  let fixture: ComponentFixture<CategoryBreakdownComponent>;
  let transactionRevision: ReturnType<typeof signal<number>>;
  let countTransactionsByCategory: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    transactionRevision = signal(0);
    countTransactionsByCategory = vi
      .fn()
      .mockResolvedValueOnce({ Utilities: 1 })
      .mockResolvedValueOnce({ Utilities: 2 });

    await TestBed.configureTestingModule({
      imports: [CategoryBreakdownComponent],
      providers: [
        {
          provide: TransactionService,
          useValue: { transactionRevision, countTransactionsByCategory },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryBreakdownComponent);
    component = fixture.componentInstance;
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

  it('reloads counts after an external transaction change', async () => {
    fixture.componentRef.setInput('categories', categories);
    fixture.componentRef.setInput('monthName', 'August 2026');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.transactionCounts()).toEqual({ Utilities: 1 });
    expect(countTransactionsByCategory).toHaveBeenCalledTimes(1);

    transactionRevision.set(1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.transactionCounts()).toEqual({ Utilities: 2 });
    expect(countTransactionsByCategory).toHaveBeenCalledTimes(2);
  });
});
