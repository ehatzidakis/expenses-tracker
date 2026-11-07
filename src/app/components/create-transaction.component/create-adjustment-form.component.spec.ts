import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { CreateAdjustmentFormComponent } from './create-adjustment-form.component';
import { SplitStateStore } from './split-state.store';

describe('CreateAdjustmentFormComponent', () => {
  let component: CreateAdjustmentFormComponent;
  let fixture: ComponentFixture<CreateAdjustmentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAdjustmentFormComponent],
      providers: [{ provide: QueryClient, useValue: new QueryClient() }, SplitStateStore],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAdjustmentFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isTrip', true);
    await fixture.whenStable();
  });

  it('starts a new trip accepting expenses', () => {
    expect(component.adjustmentModel().isSelectable).toBe(true);
    const yes = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Yes',
    );
    expect(yes?.getAttribute('aria-pressed')).toBe('true');
  });

  it('carries the last day along when the first day moves past it', async () => {
    component.adjustmentModel.update((m) => ({ ...m, startDate: '2026-09-01', endDate: '2026-09-03' }));
    await fixture.whenStable();
    component.adjustmentModel.update((m) => ({ ...m, startDate: '2026-09-10' }));
    await fixture.whenStable();
    expect(component.adjustmentModel().endDate).toBe('2026-09-10');
  });

  it('refuses a last day moved before the first day', async () => {
    component.adjustmentModel.update((m) => ({ ...m, startDate: '2026-09-10', endDate: '2026-09-10' }));
    await fixture.whenStable();
    component.adjustmentModel.update((m) => ({ ...m, endDate: '2026-09-08' }));
    await fixture.whenStable();
    expect(component.adjustmentForm().invalid()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      "The last day can't be before the first day.",
    );
  });
});
