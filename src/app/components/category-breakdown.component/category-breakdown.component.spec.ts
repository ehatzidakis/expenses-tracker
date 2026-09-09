import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryBreakdownComponent } from './category-breakdown.component';

describe('CategoryBreakdownComponent', () => {
  let component: CategoryBreakdownComponent;
  let fixture: ComponentFixture<CategoryBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryBreakdownComponent],
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
});
