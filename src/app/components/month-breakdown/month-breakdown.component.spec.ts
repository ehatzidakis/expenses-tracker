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
    expect(component.monthSummaries()[0].saved).toBe(1500);
    expect(component.monthSummaries()[0].adjustments[0].endDate.getDate()).toBe(28);
  });
});
