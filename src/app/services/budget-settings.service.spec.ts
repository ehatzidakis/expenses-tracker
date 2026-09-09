import { TestBed } from '@angular/core/testing';
import { BudgetSettingsService, normalizeBudgetSettings } from './budget-settings.service';

describe('BudgetSettingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BudgetSettingsService],
    });
  });

  it('should return the built-in defaults when the settings payload is empty', () => {
    const settings = normalizeBudgetSettings({
      categoryBudgets: {},
      defaultTotalWage: 0,
    });

    expect(settings.defaultTotalWage).toBeGreaterThan(0);
    expect(settings.categoryBudgets.Supermarket).toBeGreaterThan(0);
  });
});
