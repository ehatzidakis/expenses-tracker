import { TestBed } from '@angular/core/testing';
import { BudgetSettingsService, normalizeBudgetSettings } from './budget-settings.service';
import { AuthService } from './auth.service';
import { CATEGORY_BUDGETS } from './expense-state.service';
import { BUDGET_HISTORY_FIXTURE as H } from '../utils/budget-history.testing';

describe('BudgetSettingsService', () => {
  let service: BudgetSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BudgetSettingsService, { provide: AuthService, useValue: { user: () => null } }],
    });
    service = TestBed.inject(BudgetSettingsService);
  });

  it('should return the built-in defaults when the settings payload is empty', () => {
    const settings = normalizeBudgetSettings({
      categoryBudgets: {},
      defaultTotalWage: 0,
    });

    expect(settings.defaultTotalWage).toBeGreaterThan(0);
    expect(settings.categoryBudgets['Supermarket']).toBeGreaterThan(0);
  });

  it('uses the single saved set for every month when there is no history yet', () => {
    const settings = normalizeBudgetSettings({
      categoryBudgets: { ...CATEGORY_BUDGETS, Gym: 65 } as Record<string, number>,
      defaultTotalWage: 1600,
    });
    expect(settings.budgetHistory).toEqual([]);

    service.settings.set(settings);
    expect(service.getCategoryBudget('Gym', 'March 2025')).toBe(65);
    expect(service.getCategoryBudget('Gym')).toBe(65);
  });

  it('gives each month the budget of the period it falls in', () => {
    service.settings.set(normalizeBudgetSettings({ budgetHistory: H }));

    expect(service.getCategoryBudget('Gym', 'February 2026')).toBe(100);
    expect(service.getCategoryBudget('Gym', 'July 2026')).toBe(62.5);
    expect(service.getCategoryBudget('Gym', 'November 2026')).toBe(65);
  });

  it('uses today’s budget without a month or with one it cannot read', () => {
    service.settings.set(normalizeBudgetSettings({ budgetHistory: H }));

    expect(service.getCategoryBudget('Gym')).toBe(65);
    expect(service.getCategoryBudget('Gym', 'garbage')).toBe(65);
  });

  it('returns null for a category without a budget', () => {
    service.settings.set(normalizeBudgetSettings({ budgetHistory: H }));
    expect(service.getCategoryBudget('Plane Tickets', 'July 2026')).toBeNull();
  });

  it('sorts the history, fills missing categories and mirrors the latest period', () => {
    const partial = { from: '2025-03', wage: 1400, categoryBudgets: { Gym: 100 } };
    const settings = normalizeBudgetSettings({ budgetHistory: [H[2], partial] });

    expect(settings.budgetHistory.map((p) => p.from)).toEqual(['2025-03', '2026-08']);
    expect(settings.budgetHistory[0].categoryBudgets['Supermarket']).toBe(CATEGORY_BUDGETS['Supermarket']);
    expect(settings.categoryBudgets).toEqual(H[2].categoryBudgets);
    expect(settings.defaultTotalWage).toBe(1600);
  });

  it('saves a change as a period starting this month', async () => {
    service.settings.set(normalizeBudgetSettings({ budgetHistory: H }));

    const saved = await service.saveSettings(
      { categoryBudgets: { ...H[2].categoryBudgets, Gym: 70 }, defaultTotalWage: 1600 },
      new Date(2026, 10, 28),
    );

    expect(saved.budgetHistory).toHaveLength(4);
    expect(saved.budgetHistory[3].from).toBe('2026-11');
    expect(saved.categoryBudgets['Gym']).toBe(70);
    expect(service.getCategoryBudget('Gym', 'July 2026')).toBe(62.5);
    expect(service.getCategoryBudget('Gym', 'November 2026')).toBe(70);
    expect(service.history()).toHaveLength(4);
  });
});
