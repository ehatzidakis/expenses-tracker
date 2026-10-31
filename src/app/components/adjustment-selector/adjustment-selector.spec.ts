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
  return { id, title: id, adjType: false, amount: 5, startDate: new Date(start), endDate: new Date(start) };
}

// Newest-first, like AppComponent.sortedAdjustments. Trips in 2026, 2025 and 2023 (none in 2024).
const ADJUSTMENTS: Adjustment[] = [
  trip('t1', 'Greece', '2026-08-01'),
  single('s1', '2026-07-01'),
  trip('t2', 'Paris', '2026-04-01'),
  trip('t3', 'Rome', '2026-02-01'),
  trip('t4', 'Berlin', '2025-10-01'),
  trip('t5', 'Oslo', '2023-05-01'),
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
  const tripItems = () =>
    all('trip-item').map((b) => b.querySelector('span')?.textContent?.trim());

  async function setup(adjustments: Adjustment[], selectedId: string | null) {
    fixture.componentRef.setInput('adjustments', adjustments);
    fixture.componentRef.setInput('selectedId', selectedId);
    await fixture.whenStable();
  }

  async function click(button: HTMLElement | null) {
    button!.click();
    await fixture.whenStable();
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

  it('shows Singles, the two newest trips and the More toggle', async () => {
    await setup(ADJUSTMENTS, null);

    expect(query('singles-pill')?.getAttribute('aria-pressed')).toBe('true');
    expect(tripPills()).toEqual(['Greece', 'Paris']);
    expect(query('trip-picker-toggle')?.textContent?.trim()).toBe('More');
  });

  it('hides More when there are two trips or fewer', async () => {
    await setup(ADJUSTMENTS.slice(0, 3), null);

    expect(tripPills()).toEqual(['Greece', 'Paris']);
    expect(query('trip-picker-toggle')).toBeNull();
  });

  it('emits null for Singles and the id for a quick trip', async () => {
    await setup(ADJUSTMENTS, 't1');
    const emitted: (string | null)[] = [];
    component.selectionChanged.subscribe((id) => emitted.push(id));

    await click(all('trip-pill')[1]);
    await click(query('singles-pill'));

    expect(emitted).toEqual(['t2', null]);
  });

  it("opens on the newest trip year and skips years without trips", async () => {
    await setup(ADJUSTMENTS, null);
    await click(query('trip-picker-toggle'));

    expect(query('view-year')?.textContent?.trim()).toBe('2026');
    expect(tripItems()).toEqual(['Greece', 'Paris', 'Rome']);
    expect(query('next-year')!.disabled).toBe(true);

    await click(query('prev-year'));
    expect(query('view-year')?.textContent?.trim()).toBe('2025');

    await click(query('prev-year'));
    expect(query('view-year')?.textContent?.trim()).toBe('2023');
    expect(tripItems()).toEqual(['Oslo']);
    expect(query('prev-year')!.disabled).toBe(true);
  });

  it('emits a picked older trip, closes the picker and labels the toggle', async () => {
    await setup(ADJUSTMENTS, null);
    const emitted: (string | null)[] = [];
    component.selectionChanged.subscribe((id) => emitted.push(id));

    await click(query('trip-picker-toggle'));
    await click(query('prev-year'));
    await click(all('trip-item')[0]);

    expect(emitted).toEqual(['t4']);
    expect(query('trip-picker')).toBeNull();
    expect(query('trip-picker-toggle')!.className).toContain('border-dashed');

    await setup(ADJUSTMENTS, 't4');
    expect(query('trip-picker-toggle')?.textContent?.trim()).toBe('Berlin');
    expect(query('trip-picker-toggle')!.className).not.toContain('border-dashed');
    expect(query('trip-picker-toggle')!.className).toContain('bg-teal-600');
    expect(all('trip-pill').every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true);

    await click(query('trip-picker-toggle'));
    expect(query('view-year')?.textContent?.trim()).toBe('2025');
  });

  it('closes on an outside click and on Escape', async () => {
    await setup(ADJUSTMENTS, null);

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
