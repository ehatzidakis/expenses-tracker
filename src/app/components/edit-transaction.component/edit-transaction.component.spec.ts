import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';

import { TRIP_CATEGORY_NAMES } from '../../services/expense-state.service';
import { EditTransactionComponent } from './edit-transaction.component';

describe('EditTransactionComponent', () => {
  let component: EditTransactionComponent;
  let fixture: ComponentFixture<EditTransactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTransactionComponent],
      providers: [{ provide: QueryClient, useValue: new QueryClient() }],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTransactionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('transaction', {
      id: '1',
      monthName: 'August 2026',
      date: '2026-08-19',
      description: 'Test transaction',
      amount: 10,
      category: 'Supermarket',
      createdAt: '2026-08-20T00:00:00.000Z',
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const splitTx = {
    id: '2',
    monthName: 'October 2026',
    date: '2026-10-01',
    description: 'Dinner',
    amount: 3.34,
    category: 'Supermarket',
    createdAt: '2026-10-01T00:00:00.000Z',
    isSplit: true,
    paidBy: 'me' as const,
    splitBy: [1, 2],
    splitType: 'split' as const,
    totalAmount: 10,
    splitPaidPersonIds: [] as number[],
  };

  const amountInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('#tx-edit-amount');

  it('edits a split by its total bill with the split picker', async () => {
    fixture.componentRef.setInput('transaction', splitTx);
    await fixture.whenStable();

    expect(amountInput().value).toBe('10');
    expect(amountInput().readOnly).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Total bill');
    expect(fixture.nativeElement.querySelector('app-split-fields')).toBeTruthy();
  });

  it('locks the money once someone has settled', async () => {
    fixture.componentRef.setInput('transaction', { ...splitTx, splitPaidPersonIds: [1] });
    await fixture.whenStable();

    expect(amountInput().readOnly).toBe(true);
    expect(fixture.nativeElement.querySelector('app-split-fields')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('amounts locked');
    expect(fixture.nativeElement.textContent).toContain('✓ settled');
  });

  it('keeps a trip-only category when it is picked on a trip transaction', async () => {
    fixture.componentRef.setInput('transaction', {
      id: '3',
      monthName: 'October 2026',
      date: '2026-10-01',
      description: 'Souvlaki',
      amount: 12,
      category: 'Accommodation',
      createdAt: '2026-10-01T00:00:00.000Z',
      adjustmentId: 'trip-1',
    });
    fixture.componentRef.setInput('categoryOverride', TRIP_CATEGORY_NAMES);
    await fixture.whenStable();

    component.setCategory('Food');

    expect(component.model().category).toBe('Food');
  });

  it('still matches regular categories when there is no override', () => {
    component.setCategory('takeaway');

    expect(component.model().category).toBe('Takeaway');
  });
});
