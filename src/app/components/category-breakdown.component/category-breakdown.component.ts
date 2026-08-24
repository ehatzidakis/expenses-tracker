import { Component, input, signal } from '@angular/core';
import { EditTransactionComponent } from '../edit-transaction.component/edit-transaction.component';
import { CommonModule } from '@angular/common';
import { CATEGORY_BUDGETS, CategorySpend } from '../../services/expense-state.service';
import { TransactionGridComponent } from '../transaction-grid.component/transaction-grid.component';
import { YearlyCategorySumsComponent } from '../yearly-category-sums/yearly-category-sums';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [
    CommonModule,
    TransactionGridComponent,
    EditTransactionComponent,
    YearlyCategorySumsComponent,
  ],
  host: { class: 'block' },
  templateUrl: './category-breakdown.component.html',
})
export class CategoryBreakdownComponent {
  categories = input.required<CategorySpend[]>();
  monthName = input<string>('');
  selectedTransaction = signal<Transaction | null>(null);

  readonly expandedCategory = signal<string | null>(null);
  readonly actionVisibleCategory = signal<string | null>(null);
  readonly draggingCategory = signal<string | null>(null);
  readonly cardOffsets = signal<Record<string, number>>({});
  readonly averageModeByCategory = signal<Record<string, 'exclude' | 'include'>>({});

  private readonly dragStartX = new Map<string, number>();
  private readonly dragStartOffset = new Map<string, number>();

  protected readonly Math = Math;

  getCardOffset(name: string): number {
    return this.cardOffsets()[name] ?? 0;
  }

  private getCategoryByName(name: string): CategorySpend | undefined {
    return this.categories().find((category) => category.name === name);
  }

  private swipeEnabledFor(name: string): boolean {
    const category = this.getCategoryByName(name);
    return !!category && category.isAllTime && this.expandedCategory() !== name;
  }

  private setCardOffset(name: string, offset: number): void {
    const nextOffsets = { ...this.cardOffsets() };
    nextOffsets[name] = offset;
    this.cardOffsets.set(nextOffsets);
  }

  getAverageMode(name: string): 'exclude' | 'include' {
    return this.averageModeByCategory()[name] ?? 'exclude';
  }

  isIncludingCurrentMonth(name: string): boolean {
    return this.getAverageMode(name) === 'include';
  }

  getAverageDisplay(cat: CategorySpend): number | null {
    if (!cat.isAllTime) {
      return cat.monthlyAverageExcl ?? cat.monthlyAverageIncl;
    }

    return this.isIncludingCurrentMonth(cat.name) ? cat.monthlyAverageIncl : cat.monthlyAverageExcl;
  }

  toggleAverageMode(name: string): void {
    const nextMode = this.getAverageMode(name) === 'exclude' ? 'include' : 'exclude';
    const nextModes = { ...this.averageModeByCategory() };
    nextModes[name] = nextMode;
    this.averageModeByCategory.set(nextModes);
  }

  closeCard(name: string): void {
    this.setCardOffset(name, 0);
    if (this.actionVisibleCategory() === name) {
      this.actionVisibleCategory.set(null);
    }
  }

  closeOpenSwipeCardExcept(name: string | null): void {
    for (const category of this.categories()) {
      if (category.name !== name) {
        this.setCardOffset(category.name, 0);
      }
    }

    const openCategory = this.actionVisibleCategory();
    if (openCategory && openCategory !== name) {
      this.actionVisibleCategory.set(null);
    }
  }

  handleCardPointerDown(name: string, event: PointerEvent): void {
    if (!this.swipeEnabledFor(name)) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    this.dragStartX.set(name, event.clientX);
    this.dragStartOffset.set(name, this.getCardOffset(name));
    this.draggingCategory.set(name);
    (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
  }

  handleCardPointerMove(name: string, event: PointerEvent): void {
    if (!this.swipeEnabledFor(name)) {
      return;
    }

    const startX = this.dragStartX.get(name);
    const startOffset = this.dragStartOffset.get(name);

    if (startX === undefined || startOffset === undefined) {
      return;
    }

    const nextOffset = Math.min(0, Math.max(-96, startOffset + (event.clientX - startX)));
    this.setCardOffset(name, nextOffset);
    this.actionVisibleCategory.set(nextOffset <= -48 ? name : null);
  }

  handleCardPointerUp(name: string): void {
    if (!this.swipeEnabledFor(name)) {
      return;
    }

    const offset = this.getCardOffset(name);
    const shouldOpen = offset <= -48;

    if (shouldOpen) {
      this.closeOpenSwipeCardExcept(name);
    }

    this.setCardOffset(name, shouldOpen ? -96 : 0);
    this.dragStartX.delete(name);
    this.dragStartOffset.delete(name);
    this.draggingCategory.set(null);
    this.actionVisibleCategory.set(shouldOpen ? name : null);
  }

  onCategoryCardClick(name: string): void {
    if (!this.swipeEnabledFor(name) && this.expandedCategory() !== name) {
      this.toggleCategory(name);
      return;
    }

    if (this.getCardOffset(name) !== 0) {
      this.closeCard(name);
      return;
    }

    this.toggleCategory(name);
  }

  onCategoryCardKeydown(name: string, event: Event): void {
    const keyboardEvent = event as KeyboardEvent;

    if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') {
      return;
    }

    keyboardEvent.preventDefault();
    this.onCategoryCardClick(name);
  }

  toggleCategory(name: string): void {
    this.selectedTransaction.set(null);
    this.closeCard(name);
    this.expandedCategory.update((current) => (current === name ? null : name));
  }

  onSelectTransaction(tx: Transaction): void {
    console.log('Parent received selected transaction:', tx);
    this.selectedTransaction.set(tx);
  }

  onEditFinished(): void {
    this.selectedTransaction.set(null);
    // Optional: trigger grid refresh if needed
  }
}
