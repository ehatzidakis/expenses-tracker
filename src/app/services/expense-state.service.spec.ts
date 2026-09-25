import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ExpenseStateService } from './expense-state.service';
import { ExpenseService } from './expense-service';
import { BudgetSettingsService, normalizeBudgetSettings } from './budget-settings.service';

describe('ExpenseStateService', () => {
  it('keeps all-time monthly averages available when a month is selected', () => {
    const expenses = signal([
      {
        id: '1',
        MonthName: 'January 2026',
        TotalWage: 1600,
        Supermarket: 200,
        Medical: 0,
        Personal: 0,
        EatingOut: 0,
        Utilities: 0,
        Takeaway: 0,
        Tickets: 0,
        Gaming: 0,
        Cats: 0,
        Travel: 0,
        Subscriptions: 0,
        Gym: 0,
      },
      {
        id: '2',
        MonthName: 'February 2026',
        TotalWage: 1600,
        Supermarket: 100,
        Medical: 0,
        Personal: 0,
        EatingOut: 0,
        Utilities: 0,
        Takeaway: 0,
        Tickets: 0,
        Gaming: 0,
        Cats: 0,
        Travel: 0,
        Subscriptions: 0,
        Gym: 0,
      },
    ]);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExpenseService,
          useValue: { getExpensesQuery: () => ({ data: expenses }) },
        },
        {
          provide: BudgetSettingsService,
          useValue: {
            settings: signal(normalizeBudgetSettings()),
            getCategoryBudget: () => 280,
          },
        },
      ],
    });

    const expenseService = TestBed.inject(ExpenseStateService);

    expenseService.selectMonth('1');

    expect(
      expenseService.categoryBreakdown().find((item) => item.name === 'Supermarket')
        ?.monthlyAverage,
    ).toBeNull();
    expect(
      expenseService.allTimeCategoryBreakdown().find((item) => item.name === 'Supermarket')
        ?.monthlyAverage,
    ).toBe(200);
  });
});