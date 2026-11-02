import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ExpenseStateService } from './expense-state.service';
import { ExpenseService } from './expense-service';
import { BudgetSettingsService, normalizeBudgetSettings } from './budget-settings.service';
import { Expense } from '../models/expenses.model';

const monthName = (monthsAgo: number) => {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
  return `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
};

const month = (id: string, name: string, supermarket: number): Expense => ({
  id,
  MonthName: name,
  TotalWage: 1600,
  Supermarket: supermarket,
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
});

function setup(expenses: Expense[]): ExpenseStateService {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: ExpenseService,
        useValue: { getExpensesQuery: () => ({ data: signal(expenses) }) },
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

  return TestBed.inject(ExpenseStateService);
}

const supermarketAverage = (service: ExpenseStateService) =>
  service.allTimeCategoryBreakdown().find((item) => item.name === 'Supermarket')?.monthlyAverage;

describe('ExpenseStateService', () => {
  it('keeps all-time monthly averages available when a month is selected', () => {
    const service = setup([month('1', monthName(1), 200), month('2', monthName(0), 100)]);

    service.selectMonth('1');

    expect(
      service.categoryBreakdown().find((item) => item.name === 'Supermarket')?.monthlyAverage,
    ).toBeNull();
    expect(supermarketAverage(service)).toBe(200);
  });

  it('excludes the current calendar month even when its record has a non-numeric id', () => {
    const service = setup([
      month('1', monthName(2), 100),
      month('2', monthName(1), 200),
      month('aB3xYz', monthName(0), 900),
    ]);

    expect(supermarketAverage(service)).toBe(150);
  });

  it('rounds the average up to the next multiple of 5', () => {
    // (276 + 277.7) / 2 = 276.85, which rounds up to 280 rather than to the nearest 275.
    const service = setup([
      month('1', monthName(2), 276),
      month('2', monthName(1), 277.7),
      month('3', monthName(0), 50),
    ]);

    expect(supermarketAverage(service)).toBe(280);
  });

  it('averages every month when the current month has no record yet', () => {
    const service = setup([month('1', monthName(2), 100), month('2', monthName(1), 200)]);

    expect(supermarketAverage(service)).toBe(150);
  });
});
