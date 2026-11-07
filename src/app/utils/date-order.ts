import { FieldTree } from '@angular/forms/signals';

/** Error kind for an end date set before its start date. */
export const DATE_ORDER = 'dateOrder';

export function dateOrderMessage(isTrip: boolean): string {
  return isTrip ? "The last day can't be before the first day." : "The end date can't be before the start date.";
}

/**
 * The message to show under a date field. A date-order error shows straight away, since the
 * stepper buttons change the date without ever touching the field; other errors wait for a touch.
 */
export function dateFieldError(field: FieldTree<string>): string | null {
  const state = field();
  const errors = state.errors();
  const order = errors.find((e) => e.kind === DATE_ORDER);
  if (order) return order.message ?? null;
  return state.touched() && errors.length ? (errors[0].message ?? null) : null;
}
