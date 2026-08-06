import { Component, inject, output, computed, signal } from '@angular/core';
import { SplitzService } from '../../services/splitz.service';
import { PersonSummary } from '../../models/splitz.model';
import { QueryClient } from '@tanstack/angular-query-experimental';

@Component({
  selector: 'app-splitzes-modal',
  standalone: true,
  templateUrl: './splitzes-modal.component.html',
})
export class SplitzesModalComponent {
  close = output<void>();

  private splitzService = inject(SplitzService);
  private queryClient = inject(QueryClient);
  private splitTxQuery = this.splitzService.getSplitTransactionsQuery();

  readonly isLoading = computed(() => this.splitTxQuery.isPending());
  readonly isError = computed(() => this.splitTxQuery.isError());

  readonly personSummaries = computed<PersonSummary[]>(() => {
    const txs = this.splitTxQuery.data() ?? [];
    return this.splitzService.computePersonSummaries(txs);
  });

  readonly markingPersonId = signal<number | null>(null);

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  meOwedLabel(netWithMe: number): string {
    if (netWithMe === 0) return 'Settled';
    return netWithMe > 0
      ? `Owes me €${netWithMe.toFixed(2)}`
      : `I owe €${Math.abs(netWithMe).toFixed(2)}`;
  }

  async onMarkPersonSettled(personId: number): Promise<void> {
    if (this.markingPersonId() !== null) return;
    this.markingPersonId.set(personId);
    try {
      const txs = this.splitTxQuery.data() ?? [];
      await this.splitzService.markPersonSettled(personId, txs);
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });
    } finally {
      this.markingPersonId.set(null);
    }
  }

  async onMarkMePaid(personId: number): Promise<void> {
    if (this.markingPersonId() !== null) return;
    this.markingPersonId.set(personId);
    try {
      const txs = this.splitTxQuery.data() ?? [];
      await this.splitzService.markMePaid(personId, txs);
      await this.queryClient.invalidateQueries({ queryKey: ['splitTransactions'] });
    } finally {
      this.markingPersonId.set(null);
    }
  }
}
