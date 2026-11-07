import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { QueryClient, injectQuery, provideTanStackQuery } from '@tanstack/angular-query-experimental';

import { TabBarComponent } from './tab-bar.component';
import { AuthService } from '../../services/auth.service';
import { PendingTransaction, TransactionService } from '../../services/transaction-service';

/** TanStack Query delivers results on a timer tick; wait for it, then for Angular. */
async function settle(fixture: { whenStable: () => Promise<unknown> }): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }
}

const pending = (over: Partial<PendingTransaction>): PendingTransaction =>
  ({
    id: Math.random().toString(36),
    createdAt: '2026-11-01T10:00:00Z',
    status: 'pending',
    sourceRole: 'kiosk',
    date: '2026-11-01',
    description: 'Bread',
    category: 'Supermarket',
    amount: 4,
    ...over,
  }) as PendingTransaction;

describe('TabBarComponent', () => {
  let component: TabBarComponent;
  let fixture: ComponentFixture<TabBarComponent>;

  beforeEach(async () => {
    const items = [
      pending({ amount: 4 }),
      pending({ amount: 6.5, sourceRole: 'admin', requestStatus: 'declined' }),
      // Still with the kiosk: not the admin's to review yet.
      pending({ amount: 20, sourceRole: 'admin', requestStatus: 'awaiting-kiosk' }),
    ];

    await TestBed.configureTestingModule({
      imports: [TabBarComponent],
      providers: [
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        {
          provide: TransactionService,
          useValue: {
            getPendingTransactionsQuery: () =>
              injectQuery(() => ({ queryKey: ['pendingTransactions'], queryFn: async () => items })),
          },
        },
        {
          provide: AuthService,
          useValue: { isAdmin: computed(() => true), currentRole: signal('admin') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabBarComponent);
    component = fixture.componentInstance;
    await settle(fixture);
  });

  it('shows five tabs with Add in the middle', () => {
    const labels = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('nav button')).map((b) =>
      b.textContent?.replace(/s+/g, ' ').trim(),
    );
    expect(labels[2]).toBe('Add');
    expect(labels.length).toBe(5);
  });

  it('counts only what waits for review on the Splitz tab', () => {
    expect(component.attention()).toEqual({ count: 2, total: 10.5 });
    const splitz = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('nav button')).find((b) =>
      b.textContent?.includes('Splitz'),
    );
    expect(splitz?.getAttribute('aria-label')).toBe('Splitz, 2 waiting for review');
    expect(splitz?.textContent).toContain('2');
  });
});
