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

  it('refuses a last day before the first day and says why', async () => {
    component.adjustmentModel.update((m) => ({ ...m, startDate: '2026-09-10', endDate: '2026-09-08' }));
    await fixture.whenStable();
    expect(component.adjustmentForm().invalid()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      "The end date can't be before the start date.",
    );
  });

  it('edits a trip by name, dates and Accepting expenses only', async () => {
    fixture.componentRef.setInput('adjustment', {
      id: '2',
      title: 'Weekend',
      adjType: false,
      amount: 0,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-04'),
      isTrip: true,
      isSelectable: true,
    });
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Trip name');
    expect(text).toContain('Accepting expenses');
    expect(text).not.toContain('Income');
    expect((fixture.nativeElement as HTMLElement).querySelector('#adj-edit-amount')).toBeNull();
  });
});
