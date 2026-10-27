import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Expense } from '../../models/expenses.model';
import { MonthSelectorComponent } from './month-selector.component';

function month(id: string, MonthName: string): Expense {
  return {
    id,
    MonthName,
    Supermarket: 0,
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
    TotalWage: 0,
  };
}

// Newest-first, like ExpenseStateService.processedExpenses (with the ALL record on top).
// Covers Oct 2026 back to Sep 2025, with no data for May 2026.
const MONTHS: Expense[] = [
  month('ALL', 'All Time'),
  month('oct26', 'October 2026'),
  month('sep26', 'September 2026'),
  month('aug26', 'August 2026'),
  month('jul26', 'July 2026'),
  month('jun26', 'June 2026'),
  month('apr26', 'April 2026'),
  month('mar26', 'March 2026'),
  month('feb26', 'February 2026'),
  month('jan26', 'January 2026'),
  month('dec25', 'December 2025'),
  month('nov25', 'November 2025'),
  month('oct25', 'October 2025'),
  month('sep25', 'September 2025'),
];

describe('MonthSelectorComponent', () => {
  let component: MonthSelectorComponent;
  let fixture: ComponentFixture<MonthSelectorComponent>;
  let el: HTMLElement;

  const query = (testId: string) =>
    el.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`);
  const cells = () =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('[data-testid="month-cell"]'));
  const cell = (short: string) => cells().find((c) => c.textContent?.trim() === short)!;
  const quickPills = () =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('section > button')).map((b) =>
      b.textContent?.trim(),
    );

  async function setup(months: Expense[], selectedId: string | null) {
    fixture.componentRef.setInput('months', months);
    fixture.componentRef.setInput('selectedId', selectedId);
    await fixture.whenStable();
  }

  async function openPicker() {
    query('month-picker-toggle')!.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthSelectorComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.componentRef.setInput('months', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the three newest months as pills plus the picker toggle', async () => {
    await setup(MONTHS, 'oct26');

    expect(quickPills()).toEqual(['Oct 2026', 'Sep 2026', 'Aug 2026']);
    expect(query('month-picker-toggle')?.textContent?.trim()).toBe('More');
  });

  it('hides the picker when there are three months or fewer', async () => {
    await setup(MONTHS.slice(0, 4), 'oct26');

    expect(quickPills()).toEqual(['Oct 2026', 'Sep 2026', 'Aug 2026']);
    expect(query('month-picker-toggle')).toBeNull();
  });

  it("opens on the selected month's year and disables months without data", async () => {
    await setup(MONTHS, 'mar26');
    await openPicker();

    expect(query('month-picker')).not.toBeNull();
    expect(query('view-year')?.textContent?.trim()).toBe('2026');
    expect(cell('May').disabled).toBe(true);
    expect(cell('Nov').disabled).toBe(true);
    expect(cell('Mar').disabled).toBe(false);
    expect(cell('Mar').getAttribute('aria-pressed')).toBe('true');
  });

  it('switches years and stops at the bounds', async () => {
    await setup(MONTHS, 'oct26');
    await openPicker();

    expect(query('next-year')!.disabled).toBe(true);

    query('prev-year')!.click();
    await fixture.whenStable();

    expect(query('view-year')?.textContent?.trim()).toBe('2025');
    expect(query('prev-year')!.disabled).toBe(true);
    expect(cell('Aug').disabled).toBe(true);
    expect(cell('Sep').disabled).toBe(false);
  });

  it('emits the picked month and closes the popover', async () => {
    await setup(MONTHS, 'oct26');
    const emitted: string[] = [];
    component.monthSelected.subscribe((id) => emitted.push(id));

    await openPicker();
    query('prev-year')!.click();
    await fixture.whenStable();
    cell('Nov').click();
    await fixture.whenStable();

    expect(emitted).toEqual(['nov25']);
    expect(query('month-picker')).toBeNull();
  });

  it('shows an older selected month on the picker toggle', async () => {
    await setup(MONTHS, 'nov25');

    expect(query('month-picker-toggle')?.textContent?.trim()).toBe('Nov 2025');
  });

  it('closes on Escape and on outside clicks', async () => {
    await setup(MONTHS, 'oct26');

    await openPicker();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(query('month-picker')).toBeNull();

    await openPicker();
    document.body.click();
    await fixture.whenStable();
    expect(query('month-picker')).toBeNull();
  });
});
