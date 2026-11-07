import { Component, computed, ElementRef, inject, input, output } from '@angular/core';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';
import { Person } from '../../models/splitz.model';
import { Transaction } from '../../models/transaction.model';
import { computeSplit, computeSplitDebtEntries } from '../../services/splitz.service';
import {
  ACTIVE_PILL,
  FIELD,
  FIELD_LABEL,
  IDLE_PILL,
  PILL_BASE,
  SEGMENT_BASE,
  SEGMENT_FRAME,
  SEGMENT_OFF,
  SEGMENT_ON,
} from '../../utils/pill-styles';

let nextSplitId = 0;

export interface CreateSplitState {
  goesSplitzes: boolean;
  splitWith: number[];
  paidById: 'me' | number;
  customSplitMode: boolean;
  customSplitAmounts: Partial<Record<'me' | number, number>>;
}

/** Builds the split-picker state from stored split fields. */
export function toSplitState(
  source: Pick<Transaction, 'isSplit' | 'splitBy' | 'paidBy' | 'splitType' | 'customSplitAmounts'>,
): CreateSplitState {
  const isSplit = Boolean(source.isSplit);
  return {
    goesSplitzes: isSplit,
    splitWith: isSplit ? [...(source.splitBy ?? [])] : [],
    paidById: isSplit ? (source.paidBy ?? 'me') : 'me',
    customSplitMode: isSplit && source.splitType === 'custom',
    customSplitAmounts: { ...(source.customSplitAmounts ?? {}) },
  };
}

@Component({
  selector: 'app-split-fields',
  standalone: true,
    host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-3">
      <div class="flex flex-col gap-1.5">
        <span [id]="uid + '-split'" [class]="fieldLabel">Split</span>
        <div role="group" [attr.aria-labelledby]="uid + '-split'" class="flex flex-wrap gap-2">
          <button
            type="button"
            [class]="pill(justMe())"
            [attr.aria-pressed]="justMe()"
            (click)="reset.emit()"
          >
            Just me
          </button>
          @for (person of people(); track person.id) {
            <button
              type="button"
              [class]="pill(isIn(person.id))"
              [attr.aria-pressed]="isIn(person.id)"
              (click)="pickPerson(person.id)"
            >
              {{ person.name }}
            </button>
          }
        </div>
      </div>

      @if (!justMe()) {
        <div class="flex flex-col gap-1.5">
          <span [id]="uid + '-paid'" [class]="fieldLabel">Paid by</span>
          <div role="group" [attr.aria-labelledby]="uid + '-paid'" class="flex flex-wrap gap-2">
            @for (opt of paidByOptions(); track opt.id) {
              <button
                type="button"
                [class]="pill(state().paidById === opt.id)"
                [attr.aria-pressed]="state().paidById === opt.id"
                (click)="setPaidBy(opt.id)"
              >
                {{ opt.label }}
              </button>
            }
          </div>
        </div>

        @if (allowCustom()) {
          <div role="group" aria-label="How to split" [class]="segmentFrame + ' grid-cols-2'">
            <button
              type="button"
              [class]="segment(!state().customSplitMode)"
              [attr.aria-pressed]="!state().customSplitMode"
              (click)="setCustom(false)"
            >
              Evenly
            </button>
            <button
              type="button"
              [class]="segment(state().customSplitMode)"
              [attr.aria-pressed]="state().customSplitMode"
              (click)="setCustom(true)"
            >
              Custom amounts
            </button>
          </div>
        }

        <!-- Not blurred: these numbers come from the amount just typed in the form -->
        @if (!state().customSplitMode || !allowCustom()) {
          <dl class="divide-y divide-ink/10 border-y border-ink/10 text-[13px]">
            <div class="flex items-baseline justify-between gap-3 py-2.5">
              <dt class="text-ink-2">
                Your share <span class="text-ink-3">· 1 of {{ state().splitWith.length + 1 }}</span>
              </dt>
              <dd class="tabular-nums text-ink">€{{ myShare().toFixed(2) }}</dd>
            </div>
            @for (line of debtLines(); track $index) {
              <div class="flex items-baseline justify-between gap-3 py-2.5">
                <dt class="text-ink-2">{{ line.label }}</dt>
                <dd class="tabular-nums text-ink">€{{ line.amount.toFixed(2) }}</dd>
              </div>
            }
          </dl>
        } @else {
          <div class="flex flex-col gap-2">
            @for (person of participants(); track person) {
              <div class="flex items-center gap-3">
                <label [for]="uid + '-amount-' + person" class="w-16 shrink-0 text-[13px] text-ink-2">{{
                  personName(person)
                }}</label>
                <input
                  [id]="uid + '-amount-' + person"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  placeholder="0.00"
                  [value]="valueFor(person)"
                  (input)="onCustomInput($event, person)"
                  [class]="field + ' tabular-nums'"
                />
              </div>
            }
            <p
              class="text-[12px]"
              [class]="customValid() ? 'text-avocado' : 'font-semibold text-ember-ink'"
              aria-live="polite"
            >
              {{ remainingLabel() }}
            </p>
          </div>
        }
      }
    </div>
  `,
})
export class SplitFieldsComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  /** Unique per instance: the Add tab and an edit sheet can both hold split fields. */
  protected readonly uid = `split-${nextSplitId++}`;
  protected readonly field = FIELD;
  protected readonly fieldLabel = FIELD_LABEL;
  protected readonly segmentFrame = SEGMENT_FRAME;

  readonly amount = input.required<number>();
  readonly people = input.required<ReadonlyArray<Person>>();
  readonly state = input.required<CreateSplitState>();
  readonly allowCustom = input(false);
  readonly scrollOnSplitInteraction = input(false);
  readonly stateChange = output<CreateSplitState>();
  readonly reset = output<void>();

  readonly participants = computed<Array<'me' | number>>(() => ['me', ...this.state().splitWith]);
  readonly selectedPeople = computed(() =>
    this.people().filter((person) => this.state().splitWith.includes(person.id)),
  );
  readonly paidByOptions = computed<Array<{ id: 'me' | number; label: string }>>(() => [
    { id: 'me', label: 'Me' },
    ...this.selectedPeople().map((person) => ({ id: person.id, label: person.name })),
  ]);
  readonly remaining = computed(
    () =>
      Math.round(
        (Number(this.amount()) -
          this.participants().reduce<number>(
            (sum, id) => sum + Number(this.state().customSplitAmounts[id] ?? 0),
            0,
          )) *
          100,
      ) / 100,
  );
  readonly customValid = computed(() => Math.abs(this.remaining()) < 0.005);

  /** Matches what is saved: I absorb the remainder cent. */
  readonly myShare = computed(
    () =>
      computeSplit(Number(this.amount()) || 0, this.state().paidById, this.state().splitWith)
        .myShare,
  );

  /** Who owes whom for an even split, using the same maths as the Splitzes balances. */
  readonly debtLines = computed(() => {
    const state = this.state();
    const draft: Transaction = {
      id: 'draft',
      monthName: '',
      date: '',
      description: '',
      amount: this.myShare(),
      category: '',
      createdAt: '',
      isSplit: true,
      paidBy: state.paidById,
      splitBy: state.splitWith,
      splitType: 'split',
      totalAmount: Number(this.amount()) || 0,
    };
    return computeSplitDebtEntries(draft).map((debt) => ({
      label:
        debt.debtorId === 'me'
          ? `You owe ${this.personName(debt.creditorId)}`
          : debt.creditorId === 'me'
            ? `${this.personName(debt.debtorId)} owes you`
            : `${this.personName(debt.debtorId)} owes ${this.personName(debt.creditorId)}`,
      amount: debt.amount,
    }));
  });

  /** Nobody else is in the split. */
  readonly justMe = computed(() => !this.state().goesSplitzes || this.state().splitWith.length === 0);

  isIn(personId: number): boolean {
    return !this.justMe() && this.state().splitWith.includes(personId);
  }

  pill(active: boolean): string {
    return `${PILL_BASE} ${active ? ACTIVE_PILL : IDLE_PILL}`;
  }

  segment(active: boolean): string {
    return `${SEGMENT_BASE} ${active ? SEGMENT_ON : SEGMENT_OFF}`;
  }

  /** "Just me" clears the split; a person is added or removed, and removing the last one clears it. */
  pickPerson(personId: number): void {
    const state = this.state();
    if (this.justMe()) {
      this.emit({ ...state, goesSplitzes: true, splitWith: [personId], paidById: 'me' });
      this.scrollFormToBottom();
      return;
    }
    if (state.splitWith.length === 1 && state.splitWith[0] === personId) {
      this.reset.emit();
      return;
    }
    this.togglePerson(personId);
  }

  personName(id: 'me' | number): string {
    return id === 'me'
      ? 'Me'
      : (this.people().find((person) => person.id === id)?.name ?? `Person ${id}`);
  }

  valueFor(id: 'me' | number): string {
    const value = this.state().customSplitAmounts[id] ?? 0;
    return value === 0 ? '' : String(value);
  }

  remainingLabel(): string {
    const value = this.remaining();
    if (Math.abs(value) < 0.005) return 'All split';
    return value > 0
      ? `€${value.toFixed(2)} still to split`
      : `€${Math.abs(value).toFixed(2)} over the total`;
  }

  setEnabled(enabled: boolean): void {
    this.emit({ ...this.state(), goesSplitzes: enabled });
    if (enabled) this.scrollFormToBottom();
  }

  setCustom(custom: boolean): void {
    const currentPaidBy = this.state().paidById;
    const paidById =
      currentPaidBy === 'me' ||
      (typeof currentPaidBy === 'number' && this.state().splitWith.includes(currentPaidBy))
        ? currentPaidBy
        : 'me';

    this.emit({
      ...this.state(),
      goesSplitzes: true,
      customSplitMode: custom,
      paidById,
    });
    this.scrollFormToBottom();
  }

  togglePerson(personId: number): void {
    const splitWith = this.state().splitWith.includes(personId)
      ? this.state().splitWith.filter((id) => id !== personId)
      : [...this.state().splitWith, personId];
    const customSplitAmounts = { ...this.state().customSplitAmounts };
    if (!splitWith.includes(personId)) delete customSplitAmounts[personId];
    this.emit({
      ...this.state(),
      splitWith,
      customSplitAmounts,
      paidById: this.state().paidById === personId ? 'me' : this.state().paidById,
    });
    this.scrollFormToBottom();
  }

  setPaidBy(value: 'me' | number): void {
    this.emit({ ...this.state(), paidById: value });
    this.scrollFormToBottom();
  }

  onCustomInput(event: Event, personId: 'me' | number): void {
    const input = event.target as HTMLInputElement;
    const normalized = normalizeDecimalInput(input.value);
    if (input.value !== normalized && (input.value.includes(',') || input.value.includes('.')))
      input.value = normalized;
    this.emit({
      ...this.state(),
      customSplitAmounts: {
        ...this.state().customSplitAmounts,
        [personId]: parseDecimalInput(normalized),
      },
    });
  }

  private emit(state: CreateSplitState): void {
    this.stateChange.emit(state);
  }

  private scrollFormToBottom(): void {
    if (!this.scrollOnSplitInteraction() || typeof window === 'undefined') return;

    requestAnimationFrame(() => {
      if (!window.matchMedia('(max-width: 767px)').matches) return;

      const form = this.host.nativeElement.closest('form');
      form?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'end',
      });
    });
  }
}
