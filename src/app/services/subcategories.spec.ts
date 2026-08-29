import { describe, expect, it } from 'vitest';
import {
  TICKET_SUBCATEGORY_OPTIONS,
  getSubcategoryOptions,
  getSubcategoryMetaById,
  getSubcategoryMetaByName,
} from './expense-state.service';

describe('ticket subcategories', () => {
  it('defines the expected ticket subcategory IDs, order, and emoji labels', () => {
    expect(TICKET_SUBCATEGORY_OPTIONS.map((option) => option.id)).toEqual([1, 2, 6, 3, 4, 5]);
    expect(TICKET_SUBCATEGORY_OPTIONS.map((option) => option.name)).toEqual([
      'theatre',
      'movies',
      'concert',
      'standUp',
      'escape',
      'misc',
    ]);
    expect(TICKET_SUBCATEGORY_OPTIONS.map((option) => option.label)).toEqual([
      '🎭 Theatre',
      '🎬 Movies',
      '🎤 Concert',
      '🤣 Stand Up',
      '🎃 Escape Room',
      '❓ Misc',
    ]);
  });

  it('resolves subcategory metadata by id or name', () => {
    expect(getSubcategoryOptions('Tickets')).toHaveLength(6);
    expect(getSubcategoryMetaById('Tickets', 3)?.name).toBe('standUp');
    expect(getSubcategoryMetaByName('Tickets', 'concert')?.id).toBe(6);
  });
});
