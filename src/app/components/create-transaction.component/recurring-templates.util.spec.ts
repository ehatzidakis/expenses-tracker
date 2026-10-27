import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../models/transaction.model';
import { defaultTransactionModel } from './create-transaction.models';
import { RECURRING_TEMPLATES, RecurringTemplate } from './recurring-templates';
import {
  applyTemplate,
  buildMonthlyBatch,
  isTemplateAdded,
  lastAmountFor,
  monthNameFromDate,
  previousMonthName,
  withDayOfMonth,
} from './recurring-templates.util';

const template = (id: string): RecurringTemplate => {
  const found = RECURRING_TEMPLATES.find((item) => item.id === id);
  if (!found) throw new Error(`Missing template ${id}`);
  return found;
};

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx',
  monthName: 'November 2026',
  date: '2026-11-01',
  description: '',
  amount: 0,
  category: '',
  createdAt: '2026-11-01T10:00:00.000Z',
  ...overrides,
});

describe('month helpers', () => {
  it('builds month names', () => {
    expect(monthNameFromDate('2026-11-27')).toBe('November 2026');
    expect(previousMonthName('2026-11-27')).toBe('October 2026');
    expect(previousMonthName('2027-01-05')).toBe('December 2026');
  });

  it('sets the day and clamps it to the month length', () => {
    expect(withDayOfMonth('2026-11-27', 5)).toBe('2026-11-05');
    expect(withDayOfMonth('2026-02-10', 31)).toBe('2026-02-28');
    expect(withDayOfMonth('2028-02-10', 31)).toBe('2028-02-29');
  });
});

describe('applyTemplate', () => {
  it('fills a fixed subscription and moves the day', () => {
    const model = { ...defaultTransactionModel(), date: '2026-11-27', comment: 'keep' };
    const result = applyTemplate(model, template('claude'));
    expect(result).toMatchObject({
      date: '2026-11-10',
      description: 'Claude subscription',
      category: 'Subscriptions',
      subCategoryId: null,
      subCategory: '',
      amount: 22,
      comment: 'keep',
    });
  });

  it('fills the subcategory and clears the amount for a bill', () => {
    const model = { ...defaultTransactionModel(), date: '2026-11-27', amount: 50 };
    const result = applyTemplate(model, template('electricity'));
    expect(result).toMatchObject({
      date: '2026-11-01',
      category: 'Utilities',
      subCategoryId: 12,
      subCategory: 'electricity',
      amount: 0,
    });
  });

  it('keeps typed text and the date for a new game', () => {
    const model = {
      ...defaultTransactionModel(),
      date: '2026-11-27',
      description: 'Hollow Knight',
    };
    const result = applyTemplate(model, template('new-game'));
    expect(result).toMatchObject({
      date: '2026-11-27',
      description: 'Hollow Knight',
      category: 'Gaming',
      subCategoryId: 7,
      subCategory: 'newRelease',
    });
  });
});

describe('isTemplateAdded', () => {
  it('matches utilities by subcategory', () => {
    const txs = [tx({ category: 'Utilities', subCategoryId: 12, description: 'ΔΕΗ' })];
    expect(isTemplateAdded(template('electricity'), txs, [], 'November 2026')).toBe(true);
    expect(isTemplateAdded(template('water'), txs, [], 'November 2026')).toBe(false);
  });

  it('matches subscriptions by description text', () => {
    const txs = [tx({ category: 'Subscriptions', description: 'claude Pro' })];
    expect(isTemplateAdded(template('claude'), txs, [], 'November 2026')).toBe(true);
    expect(isTemplateAdded(template('apple'), txs, [], 'November 2026')).toBe(false);
  });

  it('keeps the date for the weekly psychologist appointment', () => {
    const model = { ...defaultTransactionModel(), date: '2026-11-18' };
    expect(applyTemplate(model, template('psychologist'))).toMatchObject({
      date: '2026-11-18',
      description: 'Ψυχολόγα',
      category: 'Medical',
      amount: 50,
    });
  });

  it('counts pending items only in the same month', () => {
    const pending = [{ date: '2026-11-01', description: 'Gym', category: 'Gym', amount: 100 }];
    expect(isTemplateAdded(template('gym'), [], pending, 'November 2026')).toBe(true);
    expect(isTemplateAdded(template('gym'), [], pending, 'December 2026')).toBe(false);
  });
});

describe('lastAmountFor', () => {
  it('uses the full bill for split transactions and the latest entry', () => {
    const txs = [
      tx({ category: 'Utilities', subCategoryId: 12, date: '2026-10-01', amount: 30 }),
      tx({
        category: 'Utilities',
        subCategoryId: 12,
        date: '2026-10-20',
        amount: 21,
        isSplit: true,
        totalAmount: 42,
      }),
    ];
    expect(lastAmountFor(template('electricity'), txs)).toBe(42);
    expect(lastAmountFor(template('water'), txs)).toBeNull();
  });
});

describe('buildMonthlyBatch', () => {
  const now = new Date(2026, 10, 2); // 2 November 2026

  it('sends bills to pending and fixed items straight in for the current month', () => {
    const batch = buildMonthlyBatch(RECURRING_TEMPLATES, '2026-11-27', new Set(['gym']), now);
    expect(batch.pending.map((item) => item.description)).toEqual([
      'Electricity Bill',
      'Mobile Bill',
      'Internet Bill',
      'Water Bill',
      'Maintenance Bill',
    ]);
    expect(batch.pending.every((item) => item.amount === 0)).toBe(true);
    expect(batch.direct.map((item) => [item.description, item.date, item.amount])).toEqual([
      ['Apple subscription', '2026-11-05', 0.99],
      ['Claude subscription', '2026-11-10', 22],
      ['OASA Monthly card', '2026-11-01', 27],
    ]);
  });

  it('sends everything to pending for a future month', () => {
    const batch = buildMonthlyBatch(RECURRING_TEMPLATES, '2026-12-01', new Set(), now);
    expect(batch.direct).toEqual([]);
    expect(batch.pending).toHaveLength(9);
    expect(batch.pending[0]).toMatchObject({ subCategoryId: 12, subCategory: 'electricity' });
  });
});
