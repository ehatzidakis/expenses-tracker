import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonthBreakdownComponent } from './month-breakdown.component';

describe('MonthBreakdownComponent', () => {
  let component: MonthBreakdownComponent;
  let fixture: ComponentFixture<MonthBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthBreakdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthBreakdownComponent);
    component = fixture.componentInstance;
  });

  it('orders completed months and matches adjustments by end date', () => {
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const olderMonth = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const monthName = (date: Date) =>
      `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;

    fixture.componentRef.setInput('months', [
      { id: 'current', MonthName: monthName(currentMonth), TotalWage: 1600, Utilities: 100 },
      { id: 'old', MonthName: monthName(olderMonth), TotalWage: 1500, Utilities: 200 },
      { id: 'previous', MonthName: monthName(previousMonth), TotalWage: 1700, Utilities: 300 },
    ]);
    fixture.componentRef.setInput('adjustments', [
      {
        id: 'bonus',
        title: 'Bonus',
        adjType: true,
        amount: 100,
        startDate: new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 2),
        endDate: new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 28),
      },
    ]);

    expect(component.monthSummaries().map((month) => month.name)).toEqual([
      monthName(previousMonth),
      monthName(olderMonth),
    ]);
    expect(component.monthSummaries()[0].saved).toBe(1400);
    expect(component.monthSummaries()[0].adjustments[0].endDate.getDate()).toBe(28);
  });

  it('nets saved, income one-offs and trips into the month total', () => {
    const today = new Date();
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const monthName = `${previousMonth.toLocaleString('en-US', { month: 'long' })} ${previousMonth.getFullYear()}`;
    const inMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 15);

    fixture.componentRef.setInput('months', [
      { id: 'previous', MonthName: monthName, TotalWage: 1200, Utilities: 1000 },
    ]);
    fixture.componentRef.setInput('adjustments', [
      { id: 'bonus', title: 'Bonus', adjType: true, amount: 800, startDate: inMonth, endDate: inMonth },
      { id: 'trip', title: 'Trip', adjType: false, isTrip: true, amount: 550, startDate: inMonth, endDate: inMonth },
    ]);
    fixture.detectChanges();

    expect(component.monthSummaries()[0].saved).toBe(200);
    expect(component.monthSummaries()[0].net).toBe(450);
    const net = fixture.nativeElement.querySelector('.month-net');
    expect(net.textContent).toContain('€450.00 net');
    expect(fixture.nativeElement.textContent).toContain('Saved €200.00');
    expect(fixture.nativeElement.textContent).not.toContain('Wage');
  });

  it('styles a negative net red', () => {
    const today = new Date();
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const monthName = `${previousMonth.toLocaleString('en-US', { month: 'long' })} ${previousMonth.getFullYear()}`;

    fixture.componentRef.setInput('months', [
      { id: 'previous', MonthName: monthName, TotalWage: 100, Utilities: 200 },
    ]);
    fixture.detectChanges();

    const net = fixture.nativeElement.querySelector('.month-net');
    expect(component.monthSummaries()[0].net).toBe(-100);
    expect(net.classList.contains('text-cherry')).toBe(true);
    expect(net.classList.contains('text-avocado-ink')).toBe(false);
  });

  it('keeps saved to wage minus spend, with one-offs only in the net', () => {
    const today = new Date();
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const monthName = `${previousMonth.toLocaleString('en-US', { month: 'long' })} ${previousMonth.getFullYear()}`;

    fixture.componentRef.setInput('months', [
      { id: 'previous', MonthName: monthName, TotalWage: 100, Utilities: 200 },
    ]);
    fixture.componentRef.setInput('adjustments', [
      {
        id: 'bonus',
        title: 'Bonus',
        adjType: true,
        amount: 500,
        startDate: previousMonth,
        endDate: previousMonth,
      },
    ]);
    fixture.detectChanges();

    const net = fixture.nativeElement.querySelector('.month-net');
    expect(component.monthSummaries()[0].saved).toBe(-100);
    expect(component.monthSummaries()[0].net).toBe(400);
    expect(net.classList.contains('text-avocado-ink')).toBe(true);
  });
});
