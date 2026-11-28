import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MonthChartComponent } from './month-chart';
import { MonthTotal } from '../../utils/chart-data';

// Synthetic months only.
const months: MonthTotal[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((short, i) => ({
  id: `m${i}`,
  monthName: `${short} 2026`,
  short,
  year: 2026,
  month: i,
  spent: 500 + i * 50,
  wage: 1600,
  budget: 1330,
  saved: 1100 - i * 50,
  current: false,
}));

describe('MonthChartComponent pointer handling', () => {
  let fixture: ComponentFixture<MonthChartComponent>;
  let picked: ReturnType<typeof vi.fn<(id: string) => void>>;

  const surface = () => fixture.nativeElement.querySelector('rect[role="slider"]') as SVGRectElement;
  const fire = (type: string, x: number, y = 100) =>
    surface().dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
  const cx = (i: number) => fixture.componentInstance.bars()[i].cx;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MonthChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(MonthChartComponent);
    fixture.componentRef.setInput('months', months);
    fixture.componentRef.setInput('selectedId', 'm5');
    picked = vi.fn<(id: string) => void>();
    fixture.componentInstance.select.subscribe(picked);
    await fixture.whenStable();
  });

  it('picks the nearest month on a tap', () => {
    fire('pointerdown', cx(1) + 3);
    fire('pointerup', cx(1) + 3);
    expect(picked).toHaveBeenCalledWith('m1');
  });

  it('leaves the selection alone when the touch turns into a page scroll', () => {
    fire('pointerdown', cx(1));
    fire('pointermove', cx(1) + 2, 140);
    fire('pointercancel', cx(1) + 2, 140);
    expect(picked).not.toHaveBeenCalled();
  });

  it('does not pick on press alone', () => {
    fire('pointerdown', cx(2));
    expect(picked).not.toHaveBeenCalled();
  });

  it('scrubs once the pointer slides sideways', () => {
    fire('pointerdown', cx(1));
    fire('pointermove', cx(3), 102);
    expect(picked).toHaveBeenLastCalledWith('m3');
    fire('pointerup', cx(3), 102);
    expect(picked).toHaveBeenCalledTimes(1);
  });

  it('moves with the arrow keys from one tab stop', () => {
    surface().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(picked).toHaveBeenCalledWith('m4');
  });
});

describe('MonthChartComponent budgets per month', () => {
  const at = (id: string, short: string, month: number, budget: number, spent: number): MonthTotal => ({
    id,
    monthName: `${short} 2026`,
    short,
    year: 2026,
    month,
    spent,
    wage: 1540,
    budget,
    saved: 1540 - spent,
    current: false,
  });

  async function render(input: MonthTotal[]) {
    await TestBed.configureTestingModule({ imports: [MonthChartComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MonthChartComponent);
    fixture.componentRef.setInput('months', input);
    fixture.componentRef.setInput('selectedId', input[input.length - 1].id);
    await fixture.whenStable();
    return fixture.componentInstance;
  }

  it('marks a month over its own budget, not today’s', async () => {
    // The same 1310 spent is over February's 1300 budget and under July's 1317.50.
    const chart = await render([at('feb', 'Feb', 1, 1300, 1310), at('jul', 'Jul', 6, 1317.5, 1310)]);
    expect(chart.bars()[0].segments).toHaveLength(2);
    expect(chart.bars()[1].segments).toHaveLength(1);
  });

  it('steps the budget line where the budget changed', async () => {
    const chart = await render([at('feb', 'Feb', 1, 1300, 1310), at('jul', 'Jul', 6, 1317.5, 1310)]);
    const lines = chart.budgetSegments();
    expect(lines).toHaveLength(2);
    expect(lines[0].y).not.toBe(lines[1].y);
    expect(lines[0].x2).toBeLessThanOrEqual(lines[1].x1);
  });

  it('draws one line while the budget stays the same', async () => {
    const chart = await render(months);
    expect(chart.budgetSegments()).toHaveLength(1);
  });
});

