import { BudgetPeriod } from './budget-history';

/** The real three periods (wage 1400, 1540, 1600), for tests only. */
export const BUDGET_HISTORY_FIXTURE: BudgetPeriod[] = [
  {
    from: '2025-03',
    wage: 1400,
    categoryBudgets: {
      Supermarket: 280,
      Medical: 210,
      Personal: 150,
      EatingOut: 140,
      Utilities: 100,
      Takeaway: 90,
      Tickets: 80,
      Gaming: 70,
      Cats: 40,
      Travel: 25,
      Subscriptions: 15,
      Gym: 100,
    },
  },
  {
    from: '2026-03',
    wage: 1540,
    categoryBudgets: {
      Supermarket: 280,
      Medical: 200,
      Personal: 200,
      EatingOut: 140,
      Utilities: 100,
      Takeaway: 90,
      Tickets: 75,
      Gaming: 75,
      Cats: 50,
      Travel: 30,
      Subscriptions: 15,
      Gym: 62.5,
    },
  },
  {
    from: '2026-08',
    wage: 1600,
    categoryBudgets: {
      Supermarket: 280,
      Medical: 200,
      Personal: 200,
      EatingOut: 130,
      Utilities: 110,
      Takeaway: 100,
      Tickets: 75,
      Gaming: 75,
      Cats: 50,
      Travel: 30,
      Subscriptions: 15,
      Gym: 65,
    },
  },
];
