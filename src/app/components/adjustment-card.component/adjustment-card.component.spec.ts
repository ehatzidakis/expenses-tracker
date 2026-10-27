import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdjustmentCardComponent } from './adjustment-card.component';

describe('AdjustmentCardComponent', () => {
  let component: AdjustmentCardComponent;
  let fixture: ComponentFixture<AdjustmentCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdjustmentCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdjustmentCardComponent);
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
