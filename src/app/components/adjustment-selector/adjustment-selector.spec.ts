import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Adjustment } from '../../models/adjustments.model';
import { AdjustmentSelectorComponent } from './adjustment-selector';

function trip(id: string, title: string, start: string): Adjustment {
  return {
    id,
    title,
    adjType: false,
    amount: 100,
    startDate: new Date(start),
    endDate: new Date(start),
    isTrip: true,
  };
}

function single(id: string, start: string): Adjustment {
  return {
    id,
    title: id,
    adjType: false,
    amount: 5,
    startDate: new Date(start),
    endDate: new Date(start),
  };
}

// Newest-first, like the Budget page's sortedAdjustments. Trips in 2026, 2025, 2023 and 2022 (none in 2024).
const ADJUSTMENTS: Adjustment[] = [
  trip('t1', 'Greece', '2026-08-01'),
  single('s1', '2026-07-01'),
  trip('t2', 'Paris', '2026-04-01'),
  trip('t3', 'Rome', '2026-02-01'),
  trip('t4', 'Berlin', '2025-10-01'),
  trip('t5', 'Oslo', '2023-05-01'),
  trip('t6', 'Lisbon', '2022-09-01'),
];

describe('AdjustmentSelectorComponent', () => {
  let component: AdjustmentSelectorComponent;
  let fixture: ComponentFixture<AdjustmentSelectorComponent>;
  let el: HTMLElement;

  const query = (testId: string) =>
    el.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`);
  const all = (testId: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>(`[data-testid="${testId}"]`));
  const tripPills = () => all('trip-pill-title').map((s) => s.textContent?.trim());
  const selectedPill = () =>
    all('trip-pill')
      .find((b) => b.getAttribute('aria-pressed') === 'true')
      ?.textContent?.trim();
  const tripItems = () => all('trip-item').map((b) => b.querySelector('span')?.textContent?.trim());

  async function setup(adjustments: Adjustment[], selectedId: string | null) {
    fixture.componentRef.setInput('adjustments', adjustments);
    fixture.componentRef.setInput('selectedId', selectedId);
    await fixture.whenStable();
  }

  async function click(button: HTMLElement | null) {
    button!.click();
    await fixture.whenStable();
  }

  /** Feed each emitted selection back in, as the Budget page does. */
  function followSelection(): string[] {
    const emitted: string[] = [];
    component.selectionChanged.subscribe((id) => {
      emitted.push(id);
      fixture.componentRef.setInput('selectedId', id);
    });
    return emitted;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdjustmentSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdjustmentSelectorComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.componentRef.setInput('adjustments', []);
    await fixture.whenStable();
  });

  it('shows the three newest trips between the arrows, with the calendar', async () => {
    await setup(ADJUSTMENTS, 't1');

    expect(tripPills()).toEqual(['Greece', 'Paris', 'Rome']);
    expect(selectedPill()).toBe('Greece');
    expect(query('trip-newer')!.disabled).toBe(true);
    expect(query('trip-older')!.disabled).toBe(false);
    expect(query('trip-picker-toggle')).not.toBeNull();
  });

  it('hides the calendar when there are three trips or fewer', async () => {
    await setup(ADJUSTMENTS.slice(0, 4), 't1');

    expect(tripPills()).toEqual(['Greece', 'Paris', 'Rome']);
    expect(query('trip-picker-toggle')).toBeNull();
  });

  it('steps older inside the row, then pages so the selection leads', async () => {
    await setup(ADJUSTMENTS, 't1');
    const emitted = followSelection();

    await click(query('trip-older'));
    await click(query('trip-older'));
    expect(tripPills()).toEqual(['Greece', 'Paris', 'Rome']);
    expect(selectedPill()).toBe('Rome');

    await click(query('trip-older'));
    expect(emitted).toEqual(['t2', 't3', 't4']);
    expect(tripPills()).toEqual(['Berlin', 'Oslo', 'Lisbon']);
    expect(selectedPill()).toBe('Berlin');
  });

  it('pages back when stepping newer past the first pill, and stops at the ends', async () => {
    await setup(ADJUSTMENTS, 't1');
    followSelection();
    for (let i = 0; i < 5; i++) await click(query('trip-older'));

    expect(selectedPill()).toBe('Lisbon');
    expect(query('trip-older')!.disabled).toBe(true);

    await click(query('trip-newer'));
    await click(query('trip-newer'));
    expect(tripPills()).toEqual(['Berlin', 'Oslo', 'Lisbon']);

    await click(query('trip-newer'));
    expect(tripPills()).toEqual(['Greece', 'Paris', 'Rome']);
    expect(selectedPill()).toBe('Rome');
  });

  it('opens on the selected trip year and skips years without trips', async () => {
    await setup(ADJUSTMENTS, 't1');
    await click(query('trip-picker-toggle'));

    expect(query('view-year')?.textContent?.trim()).toBe('2026');
    expect(tripItems()).toEqual(['Greece', 'Paris', 'Rome']);
    expect(query('next-year')!.disabled).toBe(true);

    await click(query('prev-year'));
    expect(query('view-year')?.textContent?.trim()).toBe('2025');

    await click(query('prev-year'));
    expect(query('view-year')?.textContent?.trim()).toBe('2023');
    expect(tripItems()).toEqual(['Oslo']);
  });

  it('puts a calendar pick first, followed by the two trips before it', async () => {
    await setup(ADJUSTMENTS, 't1');
    const emitted = followSelection();

    await click(query('trip-picker-toggle'));
    await click(all('trip-item')[1]);

    expect(emitted).toEqual(['t2']);
    expect(query('trip-picker')).toBeNull();
    expect(tripPills()).toEqual(['Paris', 'Rome', 'Berlin']);
    expect(selectedPill()).toBe('Paris');

    await click(query('trip-picker-toggle'));
    expect(query('view-year')?.textContent?.trim()).toBe('2026');
  });

  it('closes on an outside click and on Escape', async () => {
    await setup(ADJUSTMENTS, 't1');

    await click(query('trip-picker-toggle'));
    document.body.click();
    await fixture.whenStable();
    expect(query('trip-picker')).toBeNull();

    await click(query('trip-picker-toggle'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(query('trip-picker')).toBeNull();
  });
});
