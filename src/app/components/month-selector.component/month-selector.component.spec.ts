import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthSelectorComponent } from './month-selector.component';

describe('MonthSelectorComponent', () => {
  let component: MonthSelectorComponent;
  let fixture: ComponentFixture<MonthSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthSelectorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
