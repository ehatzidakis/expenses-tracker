import { TestBed } from '@angular/core/testing';

import { ExpenseStateService } from './expense-state.service';

describe('ExpenseStateService', () => {
  let service: ExpenseStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpenseStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
