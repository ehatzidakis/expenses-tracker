import { computed, inject, Signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import {
  getPendingTransactionTotalAmount,
  TransactionService,
} from '../../services/transaction-service';
import { needsAdminAttention } from './pending-review.model';

export interface PendingAttention {
  count: number;
  total: number;
}

/**
 * What waits for the admin under Splitzes › Incoming: kiosk submissions and replies, and
 * declined requests (the same rule as the app icon badge). Shares the pending query's cache.
 * Call from an injection context.
 */
export function injectPendingAttention(): Signal<PendingAttention> {
  const isAdmin = inject(AuthService).isAdmin;
  const pendingQuery = inject(TransactionService).getPendingTransactionsQuery();
  return computed(() => {
    if (!isAdmin()) return { count: 0, total: 0 };
    const items = (pendingQuery.data() ?? []).filter(needsAdminAttention);
    return {
      count: items.length,
      total: items.reduce((sum, item) => sum + getPendingTransactionTotalAmount(item), 0),
    };
  });
}
