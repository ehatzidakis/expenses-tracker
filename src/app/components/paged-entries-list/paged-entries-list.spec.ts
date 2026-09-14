import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PagedEntriesListComponent } from './paged-entries-list';
import { TransactionService } from '../../services/transaction-service';

describe('PagedEntriesListComponent', () => {
  let fixture: ComponentFixture<PagedEntriesListComponent>;
  let component: PagedEntriesListComponent;
  let transactionService: {
    fetchPageByCategory: ReturnType<typeof vi.fn>;
    fetchPageByDescription: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    transactionService = {
      fetchPageByCategory: vi.fn().mockResolvedValue({
        items: [],
        lastDoc: null,
        hasMore: false,
      }),
      fetchPageByDescription: vi.fn().mockResolvedValue({
        items: [],
        lastDoc: null,
        hasMore: false,
      }),
    };

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

    expect(transactionService.fetchPageByCategory).toHaveBeenCalledWith('Food', null, true, undefined);
  });

  it('uses the selected subcategory id when fetching category entries', async () => {
    fixture.componentRef.setInput('mode', 'category');
    fixture.componentRef.setInput('subCategoryId', 14);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(transactionService.fetchPageByCategory).toHaveBeenLastCalledWith(
      'Food',
      null,
      false,
      14,
    );
  });
});
