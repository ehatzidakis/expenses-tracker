import { Component, inject, output, computed } from '@angular/core';
import { SplitzService } from '../../services/splitz.service';
import { PersonSummary } from '../../models/splitz.model';

@Component({
  selector: 'app-splitzes-modal',
  standalone: true,
  templateUrl: './splitzes-modal.component.html',
})
export class SplitzesModalComponent {
  close = output<void>();

  private splitzService = inject(SplitzService);
  private splitzesQuery = this.splitzService.getSplitzesQuery();

  readonly isLoading = computed(() => this.splitzesQuery.isPending());
  readonly isError = computed(() => this.splitzesQuery.isError());

  readonly personSummaries = computed<PersonSummary[]>(() => {
    const records = this.splitzesQuery.data() ?? [];
    return this.splitzService.computePersonSummaries(records);
  });

  readonly totalNetOwed = computed(
    () => Math.round(this.personSummaries().reduce((sum, s) => sum + s.netOwed, 0) * 100) / 100,
  );

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  owedLabel(netOwed: number): string {
    if (netOwed === 0) return 'Settled';
    return netOwed > 0
      ? `I owe €${netOwed.toFixed(2)}`
      : `Owes me €${Math.abs(netOwed).toFixed(2)}`;
  }
}
