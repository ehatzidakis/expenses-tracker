import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UtilitySumComponent } from './utility-sum-component';
import { TransactionService } from '../../services/transaction-service';

describe('UtilitySumComponent', () => {
  let fixture: ComponentFixture<UtilitySumComponent>;
  let component: UtilitySumComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilitySumComponent],
      providers: [
        {
          provide: TransactionService,
          useValue: {
            fetchAllUtilityTransactions: async () => [
              {
                id: '1',
                date: '2024-01-05',
                monthName: 'January 2024',
                description: 'Internet',
                category: 'Utilities',
                amount: 80,
              },
              {
                id: '2',
                date: '2024-03-05',
                monthName: 'March 2024',
                description: 'Internet',
                category: 'Utilities',
                amount: 60,
              },
              {
                id: '3',
                date: '2024-01-07',
                monthName: 'January 2024',
                description: 'Water',
                category: 'Utilities',
                amount: 90,
              },
              {
                id: '4',
                date: '2024-04-07',
                monthName: 'April 2024',
                description: 'Water',
                category: 'Utilities',
                amount: 90,
              },
              {
                id: '5',
                date: '2024-07-07',
                monthName: 'July 2024',
                description: 'Water',
                category: 'Utilities',
                amount: 90,
              },
              {
                id: '6',
                date: '2024-01-12',
                monthName: 'January 2024',
                description: 'Energy',
                category: 'Utilities',
                amount: 50,
              },
            ],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UtilitySumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('keeps monthly utilities unchanged but converts bi/tri-monthly bills to a monthly equivalent', () => {
    const internet = component.utilityAverages().find((item) => item.label === 'Internet');
    const water = component.utilityAverages().find((item) => item.label === 'Water');
    const energy = component.utilityAverages().find((item) => item.label === 'Energy');

    expect(internet?.average).toBe(70);
    expect(water?.average).toBe(90);
    expect(energy?.average).toBe(50);

    component.viewMode.set('monthly');

    const monthInternet = component.utilityAverages().find((item) => item.label === 'Internet');
    const monthWater = component.utilityAverages().find((item) => item.label === 'Water');
    const monthEnergy = component.utilityAverages().find((item) => item.label === 'Energy');

    expect(monthInternet?.average).toBe(35);
    expect(monthWater?.average).toBe(30);
    expect(monthEnergy?.average).toBe(50);
  });
});
