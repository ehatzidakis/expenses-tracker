import { Injectable, computed, signal } from '@angular/core';
import { CreateSplitState } from './split-fields.component';

/**
 * Component-scoped store for the split-fields UI state shared between the
 * transaction and adjustment sub-forms. Provided by CreateTransactionComponent
 * so both sub-containers operate on a single, consistently-reset instance.
 */
@Injectable()
export class SplitStateStore {
  readonly goesSplitzes = signal<boolean>(false);
  readonly splitWith = signal<number[]>([]);
  readonly paidById = signal<'me' | number>('me');
  readonly customSplitMode = signal<boolean>(false);
  readonly customSplitAmounts = signal<Partial<Record<'me' | number, number>>>({});

  readonly state = computed<CreateSplitState>(() => ({
    goesSplitzes: this.goesSplitzes(),
    splitWith: this.splitWith(),
    paidById: this.paidById(),
    customSplitMode: this.customSplitMode(),
    customSplitAmounts: this.customSplitAmounts(),
  }));

  apply(state: CreateSplitState): void {
    this.goesSplitzes.set(state.goesSplitzes);
    this.splitWith.set(state.splitWith);
    this.paidById.set(state.paidById);
    this.customSplitMode.set(state.customSplitMode);
    this.customSplitAmounts.set(state.customSplitAmounts);
  }

  reset(): void {
    this.goesSplitzes.set(false);
    this.splitWith.set([]);
    this.paidById.set('me');
    this.customSplitMode.set(false);
    this.customSplitAmounts.set({});
  }
}
