import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DebtEntry } from '../../models/splitz.model';
import { SplitzService } from '../../services/splitz.service';
import { SplitzSettlementService } from '../../services/splitz-settlement.service';
import { SplitzBalancesComponent } from './splitz-balances.component';

describe('SplitzBalancesComponent', () => {
  let fixture: ComponentFixture<SplitzBalancesComponent>;
  let component: SplitzBalancesComponent;
  let getDebtsBetweenMeAndPerson: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getDebtsBetweenMeAndPerson = vi.fn((): DebtEntry[] => []);

    await TestBed.configureTestingModule({
      imports: [SplitzBalancesComponent],
      providers: [
        { provide: QueryClient, useValue: new QueryClient() },
        {
          provide: SplitzService,
          useValue: {
            getDebtsBetweenMeAndPerson,
            getSplitTransactionsQuery: () => ({
              isPending: () => false,
              isError: () => false,
              data: () => [],
            }),
            computePersonSummaries: () => [],
          },
        },
        { provide: SplitzSettlementService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SplitzBalancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sorts debts newest-first without mutating the source list', () => {
    const debts: DebtEntry[] = [
      {
        transactionId: 'older',
        description: 'Older transaction',
        date: '2026-09-10',
        debtorId: 1,
        creditorId: 'me',
        amount: 5,
        transactionTotalAmount: 15,
        paid: false,
      },
      {
        transactionId: 'newer',
        description: 'Newer transaction',
        date: '2026-09-20',
        debtorId: 1,
        creditorId: 'me',
        amount: 7,
        transactionTotalAmount: 21,
        paid: false,
      },
    ];
    getDebtsBetweenMeAndPerson.mockReturnValue(debts);

    component.requestNetSettlement({ person: { id: 1, name: 'Stavi' }, netWithMe: 12 });

    expect(component.confirmation()?.debts.map((debt) => debt.transactionId)).toEqual([
      'newer',
      'older',
    ]);
    expect(debts.map((debt) => debt.transactionId)).toEqual(['older', 'newer']);
  });

  it('shows owed and full amounts and marks who paid on each row', () => {
    getDebtsBetweenMeAndPerson.mockReturnValue([
      {
        transactionId: 'paid-by-me',
        description: 'Paid by me',
        date: '2026-09-20',
        debtorId: 1,
        creditorId: 'me',
        amount: 7,
        transactionTotalAmount: 21,
        paid: false,
      },
      {
        transactionId: 'paid-by-person',
        description: 'Paid by Alex',
        date: '2026-09-10',
        debtorId: 'me',
        creditorId: 2,
        amount: 5,
        transactionTotalAmount: 15,
        paid: false,
      },
    ] satisfies DebtEntry[]);

    component.requestNetSettlement({ person: { id: 2, name: 'Alex' }, netWithMe: 2 });
    fixture.detectChanges();

    const toggle = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Transactions included'));
    toggle?.click();
    fixture.detectChanges();

    const cards = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('.settlement-debt-row'),
    );
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('I paid');
    expect(cards[0].textContent).toContain('Owes you €7.00');
    expect(cards[0].textContent).toContain('Full amount: €21.00');
    expect(cards[0].dataset['payer']).toBe('me');
    expect(cards[0].querySelector('.settlement-owed')?.classList.contains('text-avocado-ink')).toBe(true);
    expect(cards[1].textContent).toContain('Alex paid');
    expect(cards[1].textContent).toContain('You owe €5.00');
    expect(cards[1].dataset['payer']).toBe('them');
    expect(cards[1].querySelector('.settlement-owed')?.classList.contains('text-avocado-ink')).toBe(false);
  });
});
