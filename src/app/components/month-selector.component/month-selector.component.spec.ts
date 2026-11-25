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
    Array.from(el.querySelectorAll<HTMLButtonElement>('[data-testid="month-pill"]')).map((b) =>
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

  /** Feed each emitted selection back in, as the Budget page does. */
  function followSelection(): string[] {
    const emitted: string[] = [];
    component.monthSelected.subscribe((id) => {
      emitted.push(id);
      fixture.componentRef.setInput('selectedId', id);
    });
    return emitted;
  }

  async function click(testId: string) {
    query(testId)!.click();
    await fixture.whenStable();
  }

  it('shows the three newest months between the arrows, with the calendar', async () => {
    await setup(MONTHS, 'oct26');

    expect(quickPills()).toEqual(['October 2026', 'Sep', 'Aug']);
    expect(query('month-newer')!.disabled).toBe(true);
    expect(query('month-older')!.disabled).toBe(false);
    expect(query('month-picker-toggle')).not.toBeNull();
  });

  it('steps older inside the row, then pages so the selection leads', async () => {
    await setup(MONTHS, 'oct26');
    const emitted = followSelection();

    await click('month-older');
    await click('month-older');
    expect(quickPills()).toEqual(['Oct', 'Sep', 'August 2026']);

    await click('month-older');
    expect(emitted).toEqual(['sep26', 'aug26', 'jul26']);
    expect(quickPills()).toEqual(['July 2026', 'Jun', 'Apr']);
    expect(query('month-newer')!.disabled).toBe(false);
  });

  it('pages back when stepping newer past the first pill', async () => {
    await setup(MONTHS, 'jul26');
    const emitted = followSelection();
    expect(quickPills()).toEqual(['July 2026', 'Jun', 'Apr']);

    await click('month-newer');
    expect(emitted).toEqual(['aug26']);
    expect(quickPills()).toEqual(['Oct', 'Sep', 'August 2026']);
  });

  it('disables the older arrow on the oldest month', async () => {
    await setup(MONTHS, 'sep25');

    expect(quickPills()).toEqual(['Nov', 'Oct', 'September 2025']);
    expect(query('month-older')!.disabled).toBe(true);
  });

  it('hides the picker when there are three months or fewer', async () => {
    await setup(MONTHS.slice(0, 4), 'oct26');

    expect(quickPills()).toEqual(['October 2026', 'Sep', 'Aug']);
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

  it('puts a calendar pick first, followed by the two months before it', async () => {
    await setup(MONTHS, 'oct26');
    const emitted = followSelection();

    await openPicker();
    query('prev-year')!.click();
    await fixture.whenStable();
    cell('Dec').click();
    await fixture.whenStable();

    expect(emitted).toEqual(['dec25']);
    expect(query('month-picker')).toBeNull();
    expect(quickPills()).toEqual(['December 2025', 'Nov', 'Oct']);

    // A pick that is already visible still moves to the front.
    await openPicker();
    cell('Nov').click();
    await fixture.whenStable();
    expect(quickPills()).toEqual(['November 2025', 'Oct', 'Sep']);
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
