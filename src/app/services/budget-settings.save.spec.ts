import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  BUDGET_SETTINGS_STORE,
  BudgetSettings,
  BudgetSettingsService,
  BudgetSettingsStore,
} from './budget-settings.service';
import { AuthService } from './auth.service';
import { BUDGET_HISTORY_FIXTURE as H } from '../utils/budget-history.testing';

describe('BudgetSettingsService saving while signed in', () => {
  let written: BudgetSettings[];

  beforeEach(() => {
    written = [];
    const store: BudgetSettingsStore = {
      read: vi.fn(async () => ({ budgetHistory: H })),
      write: vi.fn(async (_uid: string, settings: BudgetSettings) => {
        written.push(settings);
      }),
    };
    TestBed.configureTestingModule({
      providers: [
        BudgetSettingsService,
        { provide: AuthService, useValue: { user: () => ({ uid: 'u1' }) } },
        { provide: BUDGET_SETTINGS_STORE, useValue: store },
      ],
    });
  });

  it('keeps the stored history when the settings had not loaded yet', async () => {
    const service = TestBed.inject(BudgetSettingsService);
    expect(service.history()).toEqual([]);

    await service.saveSettings(
      { categoryBudgets: { ...H[2].categoryBudgets, Gym: 70 }, defaultTotalWage: 1600 },
      new Date(2026, 10, 28),
    );

    expect(written).toHaveLength(1);
    expect(written[0].budgetHistory.map((p) => p.from)).toEqual([
      '2025-03',
      '2026-03',
      '2026-08',
      '2026-11',
    ]);
    expect(written[0].categoryBudgets['Gym']).toBe(70);
    expect(service.history()).toHaveLength(4);
  });
});
