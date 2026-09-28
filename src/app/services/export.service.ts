import { Injectable } from '@angular/core';
import {
  ADJUSTMENT_COLUMNS,
  exportFilename,
  serializeJson,
  toCsv,
  TRANSACTION_COLUMNS,
  toExportAdjustment,
  toExportTransaction,
} from '../utils/export-data';
import { ExportAdjustment, ExportTransaction } from '../models/export.model';

@Injectable({ providedIn: 'root' })
export class ExportService {
  downloadTransactions(transactions: ExportTransaction[], format: 'csv' | 'json'): string {
    const filename = exportFilename('transactions', format);
    const content =
      format === 'csv'
        ? toCsv(
            transactions.map(toExportTransaction),
            TRANSACTION_COLUMNS,
          )
        : serializeJson(transactions);

    this.download(content, filename, format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json');
    return filename;
  }

  downloadAdjustments(adjustments: ExportAdjustment[], format: 'csv' | 'json'): string {
    const filename = exportFilename('adjustments', format);
    const content =
      format === 'csv'
        ? toCsv(
            adjustments.map(toExportAdjustment),
            ADJUSTMENT_COLUMNS,
          )
        : serializeJson(adjustments);

    this.download(content, filename, format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json');
    return filename;
  }

  downloadJson(value: unknown, filename: string): string {
    const safeFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
    this.download(serializeJson(value), safeFilename, 'application/json');
    return safeFilename;
  }

  private download(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}