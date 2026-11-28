import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryBudgetsGrid } from './category-budgets-grid';
import { BudgetSettingsService, normalizeBudgetSettings } from '../../services/budget-settings.service';
import { ExpenseStateService } from '../../services/expense-state.service';
import { PrivacyService } from '../../services/privacy.service';
import { BudgetPeriod } from '../../utils/budget-history';
import { BUDGET_HISTORY_FIXTURE } from '../../utils/budget-history.testing';

const HINT = 'Tap on a category to view its history';

describe('CategoryBudgetsGrid history hint', () => {
  async function render(history: BudgetPeriod[]): Promise<ComponentFixture<CategoryBudgetsGrid>> {
    const settings = signal(normalizeBudgetSettings({ budgetHistory: history }));
    await TestBed.configureTestingModule({
      imports: [CategoryBudgetsGrid],
      providers: [
        {
          provide: BudgetSettingsService,
          useValue: {
            settings,
            history: () => settings().budgetHistory,
            loadSettings: async () => settings(),
          },
        },
        { provide: ExpenseStateService, useValue: { allTimeCategoryBreakdown: () => [] } },
        { provide: PrivacyService, useValue: { isPrivacyMode: signal(false) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CategoryBudgetsGrid);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('says categories open their history, beside the edit button', async () => {
    const fixture = await render(BUDGET_HISTORY_FIXTURE);
    const hint = [...fixture.nativeElement.querySelectorAll('p')].find((p: HTMLElement) =>
      p.textContent?.includes(HINT),
    ) as HTMLElement | undefined;

    expect(hint).toBeDefined();
    expect(hint!.parentElement!.textContent).toContain('Edit budgets and wage');
  });

  it('leaves the hint out while editing', async () => {
    const fixture = await render(BUDGET_HISTORY_FIXTURE);
    const edit = [...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLElement) =>
      b.textContent?.includes('Edit budgets and wage'),
    ) as HTMLButtonElement;
    edit.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(HINT);
  });

  it('leaves the hint out when no budget has changed', async () => {
    const fixture = await render(BUDGET_HISTORY_FIXTURE.slice(-1));
    expect(fixture.nativeElement.textContent).not.toContain(HINT);
  });

  it('leaves the hint out when only the wage changed', async () => {
    const latest = BUDGET_HISTORY_FIXTURE[2];
    const fixture = await render([latest, { ...latest, from: '2026-11', wage: 1700 }]);
    expect(fixture.nativeElement.textContent).not.toContain(HINT);
  });
});
