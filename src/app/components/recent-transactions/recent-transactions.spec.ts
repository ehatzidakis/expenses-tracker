import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RecentTransactionsComponent } from './recent-transactions';
import { TransactionService } from '../../services/transaction-service';
import { Transaction } from '../../models/transaction.model';

describe('RecentTransactionsComponent', () => {
  let component: RecentTransactionsComponent;
  let fixture: ComponentFixture<RecentTransactionsComponent>;
  const fetchRecentTransactions = vi.fn();

  const transaction: Transaction = {
    id: 'tx-1',
    monthName: 'September 2026',
    date: '2026-09-24',
    description: 'Dinner',
    amount: 42.5,
    category: 'EatingOut',
    subCategory: 'Restaurant',
    comment: 'Team dinner',
    createdAt: '2026-09-24T20:00:00.000Z',
    isSplit: true,
    paidBy: 'me',
    splitBy: [1],
    splitType: 'split',
    totalAmount: 85,
  };

  beforeEach(async () => {
    fetchRecentTransactions.mockResolvedValue([transaction]);
    await TestBed.configureTestingModule({
      imports: [RecentTransactionsComponent],
      providers: [{ provide: TransactionService, useValue: { fetchRecentTransactions } }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentTransactionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('monthName', 'September 2026');
    await fixture.whenStable();
  });

  it('starts collapsed and loads the selected month', () => {
    expect(component.expanded()).toBe(false);
    expect(fetchRecentTransactions).toHaveBeenCalledWith({
      monthName: 'September 2026',
      adjustmentId: undefined,
    });
    expect(fixture.nativeElement.querySelector('[aria-expanded="false"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Dinner');
  });

  it('expands to show transaction values without edit controls', async () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(component.expanded()).toBe(true);
    expect(fixture.nativeElement.querySelector('[aria-expanded="true"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Dinner');
    expect(fixture.nativeElement.textContent).toContain('EatingOut');
    expect(fixture.nativeElement.textContent).toContain('Restaurant');
    expect(fixture.nativeElement.textContent).toContain('Team dinner');
    expect(fixture.nativeElement.textContent).not.toContain('Edit');
  });

  it('shows the empty state', async () => {
    fetchRecentTransactions.mockResolvedValue([]);
    fixture.componentRef.setInput('monthName', 'October 2026');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No transactions yet.');
  });
});
