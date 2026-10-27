import { Component, computed, inject, signal } from '@angular/core';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { PersonSummary } from '../../models/splitz.model';
import { SplitzService } from '../../services/splitz.service';
import { SplitzSettlementService } from '../../services/splitz-settlement.service';
import {
  SettlementConfirmation,
  SplitzSettlementDialogComponent,
} from './splitz-settlement-dialog.component';
import { SplitzPersonCardComponent } from './splitz-person-card.component';

@Component({
  selector: 'app-splitz-balances',
  standalone: true,
  imports: [SplitzPersonCardComponent, SplitzSettlementDialogComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-3">
      @if (message(); as text) {
        <p
          role="status"
          class="p-3 rounded-xl text-xs border"
          [class.bg-teal-950/30]="!messageIsError()"
          [class.border-teal-800/40]="!messageIsError()"
          [class.text-teal-300]="!messageIsError()"
          [class.bg-red-950/40]="messageIsError()"
          [class.border-red-800/60]="messageIsError()"
          [class.text-red-300]="messageIsError()"
        >
          {{ text }}
        </p>
      }

      @if (splitTxQuery.isPending()) {
        <div class="space-y-2 animate-pulse">
          @for (item of [1, 2, 3]; track item) {
            <div class="h-16 rounded-xl bg-gray-800/60"></div>
          }
        </div>
      } @else if (splitTxQuery.isError()) {
        <p class="p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-xs">
          Unable to load split data.
        </p>
      } @else {
        <div class="space-y-2">
          @for (summary of personSummaries(); track summary.person.id) {
            <app-splitz-person-card
              [summary]="summary"
              [busy]="markingPersonId() === summary.person.id"
              [disabled]="markingPersonId() !== null"
              (settle)="requestNetSettlement(summary)"
            />
          }
        </div>
      }
    </div>

    <app-splitz-settlement-dialog
      [confirmation]="confirmation()"
      [busy]="markingPersonId() !== null"
      [error]="messageIsError() ? message() : null"
      (confirmed)="confirmSettlement($event)"
      (cancelled)="cancelSettlement()"
    />
  `,
})
export class SplitzBalancesComponent {
  private readonly splitzService = inject(SplitzService);
  private readonly settlementService = inject(SplitzSettlementService);
  private readonly queryClient = inject(QueryClient);

  readonly splitTxQuery = this.splitzService.getSplitTransactionsQuery();
  readonly personSummaries = computed(() =>
    this.splitzService.computePersonSummaries(this.splitTxQuery.data() ?? []),
  );

  readonly confirmation = signal<SettlementConfirmation | null>(null);
  readonly markingPersonId = signal<number | null>(null);
  readonly message = signal<string | null>(null);
  readonly messageIsError = signal(false);

  requestNetSettlement(summary: Pick<PersonSummary, 'person' | 'netWithMe'>): void {
    const debts = this.splitzService.getDebtsBetweenMeAndPerson(
      summary.person.id,
      this.splitTxQuery.data() ?? [],
    );
    if (debts.length === 0) return;

    this.confirmation.set({
      personId: summary.person.id,
      debts: [...debts].sort((a, b) => b.date.localeCompare(a.date)),
      netWithMe: summary.netWithMe,
    });
  }

  async confirmSettlement(note: string): Promise<void> {
    const confirmation = this.confirmation();
    if (!confirmation || this.markingPersonId() !== null) return;

    this.markingPersonId.set(confirmation.personId);
    this.message.set(null);
    try {
      await this.splitzService.markDebtsSettled(confirmation.debts, this.splitTxQuery.data() ?? []);
      await this.settlementService.recordSettlements(confirmation.debts, note);
      await Promise.all([
        this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] }),
        this.queryClient.invalidateQueries({ queryKey: ['splitzSettlementHistory'] }),
      ]);
      this.showMessage('Settlement recorded.', false);
      this.confirmation.set(null);
    } catch (error) {
      console.error('Unable to record Splitzes settlement:', error);
      this.showMessage('Unable to record settlement. Please try again.', true);
    } finally {
      this.markingPersonId.set(null);
    }
  }

  cancelSettlement(): void {
    this.confirmation.set(null);
    if (this.messageIsError()) this.message.set(null);
  }

  private showMessage(text: string, isError: boolean): void {
    this.message.set(text);
    this.messageIsError.set(isError);
  }
}
