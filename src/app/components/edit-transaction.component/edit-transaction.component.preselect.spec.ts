import { describe, expect, it } from 'vitest';
import { buildTransactionFormModel } from './edit-transaction.model';

describe('EditTransactionComponent preselection', () => {
  it('restores a valid stored ticket subcategory when the transaction is reopened', () => {
    const tx = {
      id: 'abc',
      monthName: 'August 2026',
      date: '2026-08-19',
      description: 'Cinema night',
      amount: 25,
      category: 'Tickets',
      subCategoryId: 2,
      subCategory: 'movies',
      createdAt: '2026-08-20T00:00:00.000Z',
    };

    const model = buildTransactionFormModel(tx);

    expect(model.category).toBe('Tickets');
    expect(model.subCategoryId).toBe(2);
    expect(model.subCategory).toBe('movies');
  });

  it('falls back to a valid category and first subcategory when stored values are invalid', () => {
    const tx = {
      id: 'abc',
      monthName: 'August 2026',
      date: '2026-08-19',
      description: 'Cinema night',
      amount: 25,
      category: 'Weird Old Category',
      subCategoryId: 99,
      subCategory: 'ghost',
      createdAt: '2026-08-20T00:00:00.000Z',
    };

    const model = buildTransactionFormModel(tx);

    expect(model.category).toBe('Supermarket');
    expect(model.subCategoryId).toBeNull();
    expect(model.subCategory).toBe('');
  });
});
