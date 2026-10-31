import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Adjustment } from '../../models/adjustments.model';
import { SinglesViewComponent } from './singles-view';

function adj(id: string, adjType: boolean, amount: number, start: string): Adjustment {
  return { id, title: id, adjType, amount, startDate: new Date(start), endDate: new Date(start) };
}

const LIST: Adjustment[] = [
  adj('Bonus', true, 800, '2026-06-10'),
  adj('Car', false, 320, '2026-03-02'),
  adj('TV', false, 600, '2025-01-15'),
];

describe('SinglesViewComponent', () => {
  let component: SinglesViewComponent;
  let fixture: ComponentFixture<SinglesViewComponent>;
  let el: HTMLElement;

  const query = (testId: string) =>
    el.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`);
  const yearOptions = () =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('[data-testid="year-option"]'));
  const cardTitles = () =>
    Array.from(el.querySelectorAll('app-adjustment-card .truncate')).map((s) =>
      s.textContent?.trim(),
    );
  const totalsText = () => query('singles-totals')?.textContent?.replace(/\s+/g, ' ').trim();

  async function click(button: HTMLElement | null) {
    button!.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    localStorage.removeItem('stealth_mode_enabled');
    await TestBed.configureTestingModule({
      imports: [SinglesViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SinglesViewComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.componentRef.setInput('adjustments', LIST);
    await fixture.whenStable();
  });

  it('shows every single and the all-in totals with no filter', () => {
    expect(cardTitles()).toEqual(['Bonus', 'Car', 'TV']);
    expect(totalsText()).toBe('3 items In €800.00 Out €920.00 Net −€120.00');
    expect(query('year-toggle')?.textContent?.trim()).toBe('All years');
  });

  it('toggles a type filter on and off', async () => {
    await click(query('filter-subtraction'));
    expect(component.type()).toBe('subtraction');
    expect(cardTitles()).toEqual(['Car', 'TV']);
    expect(totalsText()).toBe('2 items Total €920.00');

    await click(query('filter-subtraction'));
    expect(component.type()).toBeNull();
    expect(cardTitles()).toEqual(['Bonus', 'Car', 'TV']);
  });

  it('picks and clears a year from the dropdown, combined with type', async () => {
    await click(query('filter-subtraction'));
    await click(query('year-toggle'));

    expect(yearOptions().map((b) => b.textContent?.trim())).toEqual(['All years', '2026', '2025']);

    await click(yearOptions()[1]);
    expect(component.year()).toBe(2026);
    expect(query('year-menu')).toBeNull();
    expect(query('year-toggle')?.textContent?.trim()).toBe('2026');
    expect(cardTitles()).toEqual(['Car']);
    expect(totalsText()).toBe('1 item Total €320.00');

    await click(query('year-toggle'));
    await click(yearOptions()[0]);
    expect(component.year()).toBeNull();
    expect(cardTitles()).toEqual(['Car', 'TV']);
  });

  it('shows a clear-filters state when nothing matches', async () => {
    await click(query('filter-addition'));
    await click(query('year-toggle'));
    await click(yearOptions()[2]); // 2025 has no additions

    expect(query('singles-no-match')).not.toBeNull();
    expect(query('singles-totals')).toBeNull();

    await click(query('clear-filters'));
    expect(component.type()).toBeNull();
    expect(component.year()).toBeNull();
    expect(cardTitles()).toEqual(['Bonus', 'Car', 'TV']);
  });

  it('emits edit when a card is clicked', async () => {
    const edited: Adjustment[] = [];
    component.edit.subscribe((a) => edited.push(a));

    (el.querySelector('app-adjustment-card > div') as HTMLElement).click();

    expect(edited.map((a) => a.id)).toEqual(['Bonus']);
  });

  it('shows the empty state when there are no singles', async () => {
    fixture.componentRef.setInput('adjustments', []);
    await fixture.whenStable();

    expect(el.textContent).toContain('No singles yet');
    expect(query('filter-addition')).toBeNull();
  });
});
