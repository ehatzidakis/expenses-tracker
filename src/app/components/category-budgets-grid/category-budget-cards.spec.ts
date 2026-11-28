import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryBudgetCardsComponent } from './category-budget-cards';
import { BUDGET_HISTORY_FIXTURE } from '../../utils/budget-history.testing';

describe('CategoryBudgetCardsComponent', () => {
  let fixture: ComponentFixture<CategoryBudgetCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryBudgetCardsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryBudgetCardsComponent);
  });

  it('renders a non-null suggestion while editing', () => {
    fixture.componentRef.setInput('isEditing', true);
    fixture.componentRef.setInput('draftBudgets', { Supermarket: 280 });
    fixture.componentRef.setInput('budgets', [
      { category: 'Supermarket', budget: 280, suggestion: 200 },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Suggested €200');
  });

  it('does not render suggestions when the value is null or editing is off', () => {
    fixture.componentRef.setInput('budgets', [
      { category: 'Supermarket', budget: 280, suggestion: null },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Suggested');

    fixture.componentRef.setInput('isEditing', true);
    fixture.componentRef.setInput('budgets', [
      { category: 'Supermarket', budget: 280, suggestion: 200 },
    ]);
    fixture.componentRef.setInput('draftBudgets', { Supermarket: 280 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Suggested €200');

    fixture.componentRef.setInput('isEditing', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Suggested');
  });

  describe('history', () => {
    const rows = [
      { category: 'Gym', budget: 65, suggestion: null },
      { category: 'Supermarket', budget: 280, suggestion: null },
    ];
    const toggles = () =>
      [...fixture.nativeElement.querySelectorAll('button[aria-expanded]')] as HTMLButtonElement[];

    beforeEach(() => {
      fixture.componentRef.setInput('budgets', rows);
      fixture.componentRef.setInput('history', BUDGET_HISTORY_FIXTURE);
      fixture.detectChanges();
    });

    it('offers a history only for categories whose budget changed', () => {
      expect(toggles()).toHaveLength(1);
      expect(toggles()[0].textContent).toContain('Gym');
      // The arrow marks it; no "History" label on each row.
      expect(toggles()[0].textContent).not.toContain('History');
      expect(toggles()[0].querySelector('svg')).not.toBeNull();
    });

    it('lists the past budgets with their months when opened', () => {
      expect(fixture.nativeElement.textContent).not.toContain('since Aug 2026');

      toggles()[0].click();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(toggles()[0].getAttribute('aria-expanded')).toBe('true');
      expect(text).toContain('since Aug 2026');
      expect(text).toContain('€62.50');
      expect(text).toContain('Mar 2026 – Jul 2026');
      expect(text).toContain('Mar 2025 – Feb 2026');
    });

    it('hides the history while editing', () => {
      fixture.componentRef.setInput('isEditing', true);
      fixture.componentRef.setInput('draftBudgets', { Gym: 65, Supermarket: 280 });
      fixture.detectChanges();
      expect(toggles()).toHaveLength(0);
      expect(fixture.nativeElement.querySelector('svg')).toBeNull();
    });
  });
});

