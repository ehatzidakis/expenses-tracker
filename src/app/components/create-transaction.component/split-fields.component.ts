import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { normalizeDecimalInput, parseDecimalInput } from '../../utils/decimal-input';
import { Person } from '../../models/splitz.model';

export interface CreateSplitState {
  goesSplitzes: boolean;
  splitWith: number[];
  paidById: 'me' | number;
  customSplitMode: boolean;
  customSplitAmounts: Partial<Record<'me' | number, number>>;
}

@Component({
  selector: 'app-split-fields',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-gray-400">Go Splitzes</label>
        <div class="grid grid-cols-2 gap-2 p-1 bg-gray-950/80 rounded-xl border border-gray-800">
          <button
            type="button"
            (click)="setEnabled(true)"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-teal-500/20]="state().goesSplitzes"
            [class.text-teal-400]="state().goesSplitzes"
            [class.border]="state().goesSplitzes"
            [class.border-teal-500/30]="state().goesSplitzes"
            [class.text-gray-400]="!state().goesSplitzes"
          >
            ✂️ Yes
          </button>
          <button
            type="button"
            (click)="reset.emit()"
            class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
            [class.bg-gray-700/60]="!state().goesSplitzes"
            [class.text-gray-200]="!state().goesSplitzes"
            [class.border]="!state().goesSplitzes"
            [class.border-gray-600/40]="!state().goesSplitzes"
            [class.text-gray-400]="state().goesSplitzes"
          >
            No
          </button>
        </div>
      </div>

      @if (state().goesSplitzes) {
        @if (allowCustom()) {
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-400">Split Mode</label>
            <div
              class="grid grid-cols-2 gap-2 p-1 bg-gray-950/80 rounded-xl border border-gray-800"
            >
              <button
                type="button"
                (click)="setCustom(false)"
                class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
                [class.bg-teal-500/20]="!state().customSplitMode"
                [class.text-teal-400]="!state().customSplitMode"
                [class.border]="!state().customSplitMode"
                [class.border-teal-500/30]="!state().customSplitMode"
                [class.text-gray-400]="state().customSplitMode"
              >
                👥 Halfsies
              </button>
              <button
                type="button"
                (click)="setCustom(true)"
                class="py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
                [class.bg-indigo-500/20]="state().customSplitMode"
                [class.text-indigo-400]="state().customSplitMode"
                [class.border]="state().customSplitMode"
                [class.border-indigo-500/30]="state().customSplitMode"
                [class.text-gray-400]="!state().customSplitMode"
              >
                ⚙️ Custom
              </button>
            </div>
          </div>
        }

        @if (state().customSplitMode && allowCustom()) {
          <div class="space-y-3 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3">
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs font-medium text-indigo-300">Custom split</p>
              <span class="text-[11px] text-gray-300">{{ remainingLabel() }}</span>
            </div>
            <div class="space-y-2">
              @for (person of participants(); track person) {
                <div class="space-y-1">
                  <label class="text-[11px] uppercase tracking-[0.12em] text-gray-400">{{
                    personName(person)
                  }}</label>
                  <input
                    type="text"
                    inputmode="decimal"
                    autocomplete="off"
                    [value]="valueFor(person)"
                    (input)="onCustomInput($event, person)"
                    class="w-full bg-gray-800/60 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 tabular-nums"
                    placeholder="0.00"
                  />
                </div>
              }
            </div>
            @if (!customValid()) {
              <p class="text-[11px] text-amber-300">{{ remainingLabel() }}</p>
            }
          </div>
        }

        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-400">Split With</label>
          <div class="flex flex-wrap gap-2">
            @for (person of people(); track person.id) {
              <button
                type="button"
                (click)="togglePerson(person.id)"
                class="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer"
                [class.bg-teal-500/20]="state().splitWith.includes(person.id)"
                [class.border-teal-500/40]="state().splitWith.includes(person.id)"
                [class.text-teal-400]="state().splitWith.includes(person.id)"
                [class.bg-gray-800/60]="!state().splitWith.includes(person.id)"
                [class.border-gray-700/50]="!state().splitWith.includes(person.id)"
                [class.text-gray-400]="!state().splitWith.includes(person.id)"
              >
                {{ person.name }}
              </button>
            }
          </div>
        </div>

        @if (state().splitWith.length > 0 && !state().customSplitMode) {
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-400">Paid By</label>
            <div class="flex flex-wrap gap-2">
              @for (opt of paidByOptions(); track opt.id) {
                <button
                  type="button"
                  (click)="setPaidBy(opt.id)"
                  [attr.aria-pressed]="state().paidById === opt.id"
                  class="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer"
                  [class.bg-teal-500/20]="state().paidById === opt.id"
                  [class.border-teal-500/40]="state().paidById === opt.id"
                  [class.text-teal-400]="state().paidById === opt.id"
                  [class.bg-gray-800/60]="state().paidById !== opt.id"
                  [class.border-gray-700/50]="state().paidById !== opt.id"
                  [class.text-gray-400]="state().paidById !== opt.id"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>
          <div class="p-3 bg-teal-950/30 border border-teal-800/40 rounded-xl space-y-1">
            <p class="text-xs font-medium text-teal-400">Split preview</p>
            <p class="text-xs text-gray-400">
              Your share:
              <span class="text-white font-semibold"
                >€{{ (amount() / (state().splitWith.length + 1)).toFixed(2) }}</span
              ><span class="text-gray-500"> (1 of {{ state().splitWith.length + 1 }} people)</span>
            </p>
          </div>
        }
      }
    </div>
  `,
})
export class SplitFieldsComponent {
  readonly amount = input.required<number>();
  readonly people = input.required<ReadonlyArray<Person>>();
  readonly state = input.required<CreateSplitState>();
  readonly allowCustom = input(false);
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
    if (Math.abs(value) < 0.005) return 'All split — €0.00';
    return value > 0
      ? `€${value.toFixed(2)} remaining to be split`
      : `€${Math.abs(value).toFixed(2)} over the total`;
  }

  setEnabled(enabled: boolean): void {
    this.emit({ ...this.state(), goesSplitzes: enabled });
  }

  setCustom(custom: boolean): void {
    this.emit({
      ...this.state(),
      goesSplitzes: true,
      customSplitMode: custom,
      paidById: custom ? 'me' : this.state().paidById,
    });
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
  }

  setPaidBy(value: 'me' | number): void {
    this.emit({ ...this.state(), paidById: value });
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
}
