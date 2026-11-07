import { Component, inject, signal } from '@angular/core';
import { ExportService } from '../../services/export.service';
import { AdjustmentService } from '../../services/adjustment-service';
import { TransactionService } from '../../services/transaction-service';
import { ExportAdjustment, ExportTransaction } from '../../models/export.model';
import { Transaction } from '../../models/transaction.model';
import { BUTTON_SECONDARY } from '../../utils/pill-styles';

@Component({
  selector: 'app-data-export-setting',
  standalone: true,
  template: `
    <section class="flex flex-col gap-3">
      <div>
        <h3 class="text-[15px] font-medium text-ink">Data export</h3>
        <p class="mt-0.5 text-[12px] text-ink-2">Downloads existing data without changing it.</p>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          (click)="downloadTransactions('csv')"
          [disabled]="loading()"
          [class]="secondary"
        >
          Transactions CSV
        </button>
        <button
          type="button"
          (click)="downloadTransactions('json')"
          [disabled]="loading()"
          [class]="secondary"
        >
          Transactions JSON
        </button>
        <button
          type="button"
          (click)="downloadAdjustments('csv')"
          [disabled]="loading()"
          [class]="secondary"
        >
          One-offs CSV
        </button>
        <button
          type="button"
          (click)="downloadAdjustments('json')"
          [disabled]="loading()"
          [class]="secondary"
        >
          One-offs JSON
        </button>
      </div>

      @if (loading()) {
        <p class="text-[12px] text-ink-3">Preparing download...</p>
      }
      @if (message(); as message) {
        <p class="text-[12px]" [class.text-avocado-ink]="!error()" [class.text-cherry]="error()">
          {{ message }}
        </p>
      }
    </section>
  `,
})
export class DataExportSettingComponent {
  protected readonly secondary = BUTTON_SECONDARY;

  private readonly exportService = inject(ExportService);
  private readonly adjustmentService = inject(AdjustmentService);
  private readonly transactionService = inject(TransactionService);

  readonly loading = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal(false);

  async downloadTransactions(format: 'csv' | 'json'): Promise<void> {
    await this.runExport(async () => {
      const transactions = await this.transactionService.fetchAllTransactionsForExport();
      return this.exportService.downloadTransactions(
        transactions.map((transaction) => this.toExportTransaction(transaction)),
        format,
      );
    });
  }

  async downloadAdjustments(format: 'csv' | 'json'): Promise<void> {
    await this.runExport(async () => {
      const adjustments = await this.adjustmentService.fetchAllAdjustmentsForExport();

      return this.exportService.downloadAdjustments(
        adjustments.map((adjustment) => this.toExportAdjustment(adjustment)),
        format,
      );
    });
  }

  private async runExport(action: () => Promise<string>): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(false);
    this.message.set(null);
    try {
      const filename = await action();
      this.message.set(`Downloaded ${filename}`);
    } catch (exportError) {
      console.error('Unable to export data:', exportError);
      this.error.set(true);
      this.message.set('Unable to prepare this export.');
    } finally {
      this.loading.set(false);
    }
  }

  private toExportTransaction(transaction: Transaction): ExportTransaction {
    return { ...transaction };
  }

  private toExportAdjustment(adjustment: {
    id: string;
    title: string;
    adjType: boolean;
    amount: number;
    startDate: Date;
    endDate: Date;
    isTrip?: boolean;
    isSelectable?: boolean;
  }): ExportAdjustment {
    return {
      id: adjustment.id,
      title: adjustment.title,
      isAddition: adjustment.adjType,
      amount: adjustment.amount,
      startDate: adjustment.startDate.toISOString().slice(0, 10),
      endDate: adjustment.endDate.toISOString().slice(0, 10),
      isTrip: adjustment.isTrip ?? false,
      isSelectable: adjustment.isSelectable ?? false,
    };
  }
}
