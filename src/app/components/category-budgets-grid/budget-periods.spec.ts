import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetPeriodsComponent } from './budget-periods';
import { PrivacyService } from '../../services/privacy.service';
import { BUDGET_HISTORY_FIXTURE } from '../../utils/budget-history.testing';

describe('BudgetPeriodsComponent', () => {
  let fixture: ComponentFixture<BudgetPeriodsComponent>;
  const privacy = signal(false);

  beforeEach(async () => {
    privacy.set(false);
    await TestBed.configureTestingModule({
      imports: [BudgetPeriodsComponent],
      providers: [{ provide: PrivacyService, useValue: { isPrivacyMode: privacy } }],
    }).compileComponents();
    fixture = TestBed.createComponent(BudgetPeriodsComponent);
  });

  const rows = () => [...fixture.nativeElement.querySelectorAll('li')] as HTMLElement[];

  it('lists each period newest first with its wage, budget and what it left', () => {
    fixture.componentRef.setInput('history', BUDGET_HISTORY_FIXTURE);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Periods');
    expect(rows()).toHaveLength(3);
    expect(rows()[0].textContent).toContain('Aug 2026');
    expect(rows()[1].textContent).toContain('Mar 2026 – Jul 2026');
    expect(rows()[1].textContent).toContain('€1,317.50');
    expect(rows()[1].textContent).toContain('€222.50');
    expect(rows()[2].textContent).toContain('€1,400.00');
    expect(rows()[2].textContent).toContain('€100.00');
  });

  it('blurs every amount in privacy mode', () => {
    privacy.set(true);
    fixture.componentRef.setInput('history', BUDGET_HISTORY_FIXTURE);
    fixture.detectChanges();

    const amounts = [...fixture.nativeElement.querySelectorAll('[data-amount]')] as HTMLElement[];
    expect(amounts).toHaveLength(9);
    for (const amount of amounts) expect(amount.classList.contains('blur-xs')).toBe(true);
  });

  it('shows nothing while there is only one period', () => {
    fixture.componentRef.setInput('history', BUDGET_HISTORY_FIXTURE.slice(-1));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
});
