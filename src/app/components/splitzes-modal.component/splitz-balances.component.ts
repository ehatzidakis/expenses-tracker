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
import { BUTTON_SECONDARY, ERROR_WELL, SUCCESS_WELL } from '../../utils/pill-styles';

@Component({
  selector: 'app-splitz-balances',
  standalone: true,
  imports: [SplitzPersonCardComponent, SplitzSettlementDialogComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-3">
      @if (message(); as text) {
        <p [attr.role]="messageIsError() ? 'alert' : 'status'" [class]="messageIsError() ? errorWell : successWell">
          {{ text }}
        </p>
      }

      @if (splitTxQuery.isPending()) {
        <ul class="animate-pulse divide-y divide-ink/10" aria-label="Loading balances">
          @for (item of [1, 2, 3]; track item) {
            <li class="flex items-center gap-3 py-3">
              <span class="size-9 rounded-full bg-raised"></span>
              <span class="h-4 w-24 rounded bg-raised"></span>
            </li>
          }
        </ul>
      } @else if (splitTxQuery.isError()) {
        <div class="flex flex-col items-start gap-3">
          <p role="alert" [class]="errorWell">Couldn't load the balances. Check your connection and try again.</p>
          <button type="button" [class]="secondary" (click)="splitTxQuery.refetch()">Try again</button>
        </div>
      } @else {
        <div class="divide-y divide-ink/10 border-y border-ink/10">
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
  protected readonly errorWell = ERROR_WELL;
  protected readonly secondary = BUTTON_SECONDARY;
  protected readonly successWell = SUCCESS_WELL;

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
