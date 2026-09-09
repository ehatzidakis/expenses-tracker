import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionGridComponent } from './transaction-grid.component';

describe('TransactionGridComponent', () => {
  let component: TransactionGridComponent;
  let fixture: ComponentFixture<TransactionGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionGridComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('monthName', 'March 2026');
    fixture.componentRef.setInput('category', 'Supermarket');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
