import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { UtilitySumComponent } from './utility-sum-component';
import { TransactionService } from '../../services/transaction-service';

/** TanStack Query delivers results on a timer tick; wait for it, then for Angular. */
async function settle(fixture: { whenStable: () => Promise<unknown> }): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }
}

describe('UtilitySumComponent', () => {
  let fixture: ComponentFixture<UtilitySumComponent>;
  let component: UtilitySumComponent;
  const fetchCategoryStats = vi.fn();

  beforeEach(async () => {
    fetchCategoryStats.mockReset();
    // Internet: 80 + 60 over 2 bills; Water: 3 bills of 90; Energy: one bill of 50.
    fetchCategoryStats.mockResolvedValue({
      'Utilities:14': { count: 2, sum: 140 },
      'Utilities:16': { count: 3, sum: 270 },
      'Utilities:12': { count: 1, sum: 50 },
    });

    await TestBed.configureTestingModule({
      imports: [UtilitySumComponent],
      providers: [
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        { provide: TransactionService, useValue: { fetchCategoryStats } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UtilitySumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await settle(fixture);
  });

  it('asks Firestore for one total per utility subcategory', () => {
    expect(fetchCategoryStats).toHaveBeenCalledTimes(1);
    const groups = fetchCategoryStats.mock.calls[0][0];
    expect(groups).toContainEqual({ category: 'Utilities', subCategoryId: 14 });
    expect(groups.every((group: { category: string }) => group.category === 'Utilities')).toBe(
      true,
    );
  });

  it('shows monthly equivalents by default and supports per-bill averages', () => {
    const internet = component.utilityAverages().find((item) => item.label === 'Internet');
    const water = component.utilityAverages().find((item) => item.label === 'Water');
    const energy = component.utilityAverages().find((item) => item.label === 'Energy');
    const mobile = component.utilityAverages().find((item) => item.label === 'Mobile');

    expect(internet?.average).toBe(35);
    expect(water?.average).toBe(30);
    expect(energy?.average).toBe(50);
    expect(mobile).toMatchObject({ average: 0, count: 0 });

    component.viewMode.set('bill');

    const monthInternet = component.utilityAverages().find((item) => item.label === 'Internet');
    const monthWater = component.utilityAverages().find((item) => item.label === 'Water');
    const monthEnergy = component.utilityAverages().find((item) => item.label === 'Energy');

    expect(monthInternet?.average).toBe(70);
    expect(monthWater?.average).toBe(90);
    expect(monthEnergy?.average).toBe(50);
  });
});
