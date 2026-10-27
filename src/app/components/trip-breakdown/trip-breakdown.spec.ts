import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripBreakdownComponent } from './trip-breakdown';
import { TransactionService } from '../../services/transaction-service';
import { Adjustment } from '../../models/adjustments.model';

describe('TripBreakdownComponent', () => {
  let component: TripBreakdownComponent;
  let fixture: ComponentFixture<TripBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripBreakdownComponent],
      providers: [
        {
          provide: TransactionService,
          useValue: {
            fetchAllByAdjustmentId: async () => [],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripBreakdownComponent);
    component = fixture.componentInstance;

    const trip: Adjustment = {
      id: 'trip-1',
      title: 'Weekend',
      adjType: true,
      amount: 0,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-04'),
      isTrip: true,
    };

    fixture.componentRef.setInput('trip', trip);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('shows the split indicator for split transactions in the trip breakdown list', () => {
    component.transactions.set([
      {
        id: 'tx-1',
        monthName: 'September 2026',
        date: '2026-09-02',
        description: 'Dinner',
        amount: 30,
        category: 'Food',
        createdAt: '2026-09-02T19:00:00Z',
        isSplit: true,
        paidBy: 'me',
        splitBy: [1],
        splitType: 'split',
        totalAmount: 60,
        splitPaidPersonIds: [],
      },
    ]);
    component.expandedCategory.set('Food');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('✂️');
  });
});
