import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';

import { EditAdjustmentComponent } from './edit-adjustment.component';

describe('EditAdjustmentComponent', () => {
  let component: EditAdjustmentComponent;
  let fixture: ComponentFixture<EditAdjustmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAdjustmentComponent],
      providers: [{ provide: QueryClient, useValue: new QueryClient() }],
    }).compileComponents();

    fixture = TestBed.createComponent(EditAdjustmentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('adjustment', {
      id: '1',
      title: 'Test',
      adjType: true,
      amount: 10,
      startDate: new Date(),
      endDate: new Date(),
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
