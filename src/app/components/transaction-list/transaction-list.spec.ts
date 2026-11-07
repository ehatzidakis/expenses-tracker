import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionListComponent } from './transaction-list';
import { Transaction } from '../../models/transaction.model';

const tx = (day: number, extra: Partial<Transaction> = {}): Transaction => ({
  id: `tx-${day}`,
  monthName: 'September 2026',
  date: `2026-09-${String(day).padStart(2, '0')}`,
  description: `Item ${day}`,
  amount: day,
  category: 'Food',
  createdAt: '',
  ...extra,
});

describe('TransactionListComponent', () => {
  let fixture: ComponentFixture<TransactionListComponent>;

  const render = async (transactions: Transaction[]) => {
    fixture.componentRef.setInput('transactions', transactions);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const cards = () =>
    Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .map((button) => button.textContent?.trim() ?? '')
      .filter((text) => text !== 'Load more');
  const loadMoreButton = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.trim() === 'Load more');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionListComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TransactionListComponent);
  });

  it('shows the newest transactions first', async () => {
    await render([tx(3), tx(12), tx(7)]);
    expect(cards().map((text) => text.match(/Item \d+/)?.[0])).toEqual([
      'Item 12',
      'Item 7',
      'Item 3',
    ]);
  });

  it('shows subcategory, comment and split details on the card', async () => {
    await render([
      tx(5, {
        subCategory: 'Restaurant',
        comment: 'Team dinner',
        isSplit: true,
        paidBy: 1,
        splitBy: [1],
        totalAmount: 20,
      }),
    ]);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Restaurant');
    expect(text).toContain('“Team dinner”');
    expect(text).toContain('paid by');
    expect(text).toContain('of €20.00');
  });

  it('reveals 10 more with Load more', async () => {
    await render(Array.from({ length: 25 }, (_, i) => tx(i + 1)));
    expect(cards().length).toBe(10);

    loadMoreButton()!.click();
    fixture.detectChanges();
    expect(cards().length).toBe(20);

    loadMoreButton()!.click();
    fixture.detectChanges();
    expect(cards().length).toBe(25);
    expect(loadMoreButton()).toBeUndefined();
  });

  it('offers Try again when the list fails to load', async () => {
    fixture.componentRef.setInput('error', true);
    await fixture.whenStable();
    let retried = 0;
    fixture.componentInstance.retry.subscribe(() => retried++);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role=alert]')?.textContent).toContain("Couldn't load these transactions.");
    (el.querySelector('[role=alert] button') as HTMLButtonElement).click();
    expect(retried).toBe(1);
  });

  it('emits the clicked transaction', async () => {
    const selected: Transaction[] = [];
    fixture.componentInstance.selectTransaction.subscribe((value) => selected.push(value));
    await render([tx(4)]);

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(selected.map((value) => value.id)).toEqual(['tx-4']);
  });
});
