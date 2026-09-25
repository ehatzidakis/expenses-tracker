import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewCardComponent } from './overview-card.component';

describe('OverviewCardComponent', () => {
  let component: OverviewCardComponent;
  let fixture: ComponentFixture<OverviewCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OverviewCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('totalSpend', 0);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
