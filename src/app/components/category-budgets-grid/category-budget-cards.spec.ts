import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryBudgetCardsComponent } from './category-budget-cards';

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

    expect(fixture.nativeElement.textContent).toContain('suggested: €200');
  });

  it('does not render suggestions when the value is null or editing is off', () => {
    fixture.componentRef.setInput('budgets', [
      { category: 'Supermarket', budget: 280, suggestion: null },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('suggested:');

    fixture.componentRef.setInput('isEditing', true);
    fixture.componentRef.setInput('budgets', [
      { category: 'Supermarket', budget: 280, suggestion: 200 },
    ]);
    fixture.componentRef.setInput('draftBudgets', { Supermarket: 280 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('suggested: €200');

    fixture.componentRef.setInput('isEditing', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('suggested:');
  });
});