import { describe, expect, it } from 'vitest';
import {
  buildMonthlyReport,
  exportFilename,
  serializeJson,
  toCsv,
} from './export-data';

describe('export data utilities', () => {
  it('escapes CSV values and keeps stable columns', () => {
    const csv = toCsv(
      [{ id: '1', description: 'Dinner, "late"', comment: 'Line 1\nLine 2' }],
      ['id', 'description', 'comment'],
    );

    expect(csv).toBe(
      'id,description,comment\r\n1,"Dinner, ""late""","Line 1\nLine 2"',
    );
  });

  it('builds a versioned monthly report from read data', () => {
    const report = buildMonthlyReport({
      generatedAt: '2026-09-28T12:00:00.000Z',
      monthName: 'September 2026',
      totalWage: 1600,
      categories: [],
      adjustments: [],
      transactions: [
        {
          id: 'tx-1',
          date: '2026-09-10',
          monthName: 'September 2026',
          description: 'Dinner',
          category: 'EatingOut',
          amount: 25,
          createdAt: '2026-09-10T12:00:00.000Z',
        },
      ],
    });

    expect(report.schemaVersion).toBe(1);
    expect(report.currency).toBe('EUR');
    expect(report.totalSpend).toBe(25);
    expect(report.totalSaved).toBe(1575);
    expect(JSON.parse(serializeJson(report))).toEqual(report);
  });

  it('creates normalized filenames', () => {
    expect(exportFilename('monthly', 'json', 'September 2026')).toBe(
      'expenses-report-september-2026.json',
    );
    expect(exportFilename('transactions', 'csv')).toBe('expenses-transactions.csv');
  });
});
