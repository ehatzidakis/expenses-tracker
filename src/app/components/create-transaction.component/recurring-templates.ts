export interface RecurringTemplate {
  id: string;
  emoji: string;
  label: string;
  /** Prefilled description. Empty means the user types the name (e.g. a game title). */
  description: string;
  category: string;
  subCategoryId?: number;
  /** Fixed amount. Undefined means it changes every month (e.g. bills). */
  amount?: number;
  /** Day of the month to set. Undefined keeps the date already in the form. */
  dayOfMonth?: number;
  /** Monthly items get the "already added" badge and are part of "Add all monthly". */
  monthly: boolean;
  /** Extra matching for the badge when the category alone is not enough. */
  match?: { descriptionIncludes: string };
}

export const RECURRING_TEMPLATES: ReadonlyArray<RecurringTemplate> = [
  {
    id: 'electricity',
    emoji: '⚡',
    label: 'Electricity',
    description: 'Electricity Bill',
    category: 'Utilities',
    subCategoryId: 12,
    dayOfMonth: 1,
    monthly: true,
  },
  {
    id: 'mobile',
    emoji: '📱',
    label: 'Mobile',
    description: 'Mobile Bill',
    category: 'Utilities',
    subCategoryId: 15,
    dayOfMonth: 1,
    monthly: true,
  },
  {
    id: 'internet',
    emoji: '🌐',
    label: 'Internet',
    description: 'Internet Bill',
    category: 'Utilities',
    subCategoryId: 14,
    dayOfMonth: 1,
    monthly: true,
  },
  {
    id: 'water',
    emoji: '🚰',
    label: 'Water',
    description: 'Water Bill',
    category: 'Utilities',
    subCategoryId: 16,
    dayOfMonth: 1,
    monthly: true,
  },
  {
    id: 'maintenance',
    emoji: '🧑‍🔧',
    label: 'Maintenance',
    description: 'Maintenance Bill',
    category: 'Utilities',
    subCategoryId: 13,
    dayOfMonth: 1,
    monthly: true,
  },
  {
    id: 'gym',
    emoji: '🏋️',
    label: 'Gym',
    description: 'Gym-Χάρης',
    category: 'Gym',
    amount: 100,
    dayOfMonth: 1,
    monthly: true,
  },
  {
    id: 'apple',
    emoji: '🍎',
    label: 'Apple',
    description: 'Apple subscription',
    category: 'Subscriptions',
    amount: 0.99,
    dayOfMonth: 5,
    monthly: true,
    match: { descriptionIncludes: 'apple' },
  },
  {
    id: 'claude',
    emoji: '🤖',
    label: 'Claude',
    description: 'Claude subscription',
    category: 'Subscriptions',
    amount: 22,
    dayOfMonth: 10,
    monthly: true,
    match: { descriptionIncludes: 'claude' },
  },
  {
    id: 'oasa',
    emoji: '🚇',
    label: 'OASA card',
    description: 'OASA Monthly card',
    category: 'Travel',
    amount: 27,
    dayOfMonth: 1,
    monthly: true,
    match: { descriptionIncludes: 'oasa' },
  },
  {
    id: 'psychologist',
    emoji: '🧠',
    label: 'Ψυχολόγα',
    description: 'Ψυχολόγα',
    category: 'Medical',
    amount: 50,
    // Weekly appointment: keeps the form's date and can be added several times a month.
    monthly: false,
  },
  {
    id: 'new-game',
    emoji: '🎮',
    label: 'New game',
    description: '',
    category: 'Gaming',
    subCategoryId: 7,
    monthly: false,
  },
  {
    id: 'theatre',
    emoji: '🎭',
    label: 'Theatre',
    description: '',
    category: 'Tickets',
    subCategoryId: 1,
    monthly: false,
  },
];
