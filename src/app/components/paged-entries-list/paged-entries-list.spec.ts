import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagedEntriesListComponent } from './paged-entries-list';
import { TransactionService } from '../../services/transaction-service';

describe('PagedEntriesListComponent', () => {
  let fixture: ComponentFixture<PagedEntriesListComponent>;
  let component: PagedEntriesListComponent;
  let transactionService: jasmine.SpyObj<TransactionService>;

  beforeEach(async () => {
    transactionService = jasmine.createSpyObj<TransactionService>('TransactionService', [
      'fetchPageByCategory',
      'fetchPageByDescription',
    ]);

    transactionService.fetchPageByCategory.and.resolveTo({
      items: [],
      lastDoc: null,
      hasMore: false,
    });

    await TestBed.configureTestingModule({
      imports: [PagedEntriesListComponent],
      providers: [{ provide: TransactionService, useValue: transactionService }],
    }).compileComponents();

    fixture = TestBed.createComponent(PagedEntriesListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Groceries');
    fixture.componentRef.setInput('filterValue', 'Food');
    fixture.componentRef.setInput('mode', 'category');
  });

  it('loads the highest-value records first when amount sorting is enabled', async () => {
    component.toggleSortByAmount();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(transactionService.fetchPageByCategory).toHaveBeenCalledWith('Food', null, true);
  });
});
