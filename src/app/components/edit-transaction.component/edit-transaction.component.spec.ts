import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';

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
});
