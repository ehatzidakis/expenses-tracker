import { describe, expect, it } from 'vitest';
import {
  TICKET_SUBCATEGORY_OPTIONS,
  getSubcategoryOptions,
  getSubcategoryMetaById,
  getSubcategoryMetaByName,
} from './expense-state.service';

describe('ticket and gaming subcategories', () => {
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

  it('defines the expected gaming subcategory IDs, order, and emoji labels', () => {
    expect(getSubcategoryOptions('Gaming').map((option) => option.id)).toEqual([7, 8, 9, 10, 11]);
    expect(getSubcategoryOptions('Gaming').map((option) => option.name)).toEqual([
      'newRelease',
      'olderTitle',
      'subscription',
      'peripheral',
      'dlc',
    ]);
    expect(getSubcategoryOptions('Gaming').map((option) => option.label)).toEqual([
      '🎮 New Release',
      '🕹️ Older Title',
      '🔄 Subscription',
      '👾 Peripheral',
      '🧩 DLC',
    ]);
  });

  it('defines the expected utility subcategory IDs, order, and emoji labels', () => {
    expect(getSubcategoryOptions('Utilities').map((option) => option.id)).toEqual([
      12, 13, 14, 15, 16, 17, 18,
    ]);
    expect(getSubcategoryOptions('Utilities').map((option) => option.name)).toEqual([
      'electricity',
      'maintenance',
      'internet',
      'mobile',
      'water',
      'other',
      'taxes',
    ]);
    expect(getSubcategoryOptions('Utilities').map((option) => option.label)).toEqual([
      '⚡ Electricity',
      '🧑‍🔧 Maintenance',
      '🌐 Internet',
      '📱 Mobile',
      '🚰 Water',
      '⭐ Other',
      '🧾 Taxes',
    ]);
  });

  it('resolves subcategory metadata by id or name', () => {
    expect(getSubcategoryOptions('Tickets')).toHaveLength(6);
    expect(getSubcategoryMetaById('Tickets', 3)?.name).toBe('standUp');
    expect(getSubcategoryMetaByName('Tickets', 'concert')?.id).toBe(6);
    expect(getSubcategoryMetaById('Gaming', 9)?.name).toBe('subscription');
    expect(getSubcategoryMetaByName('Gaming', 'dlc')?.id).toBe(11);
    expect(getSubcategoryMetaById('Utilities', 14)?.name).toBe('internet');
    expect(getSubcategoryMetaByName('Utilities', 'water')?.id).toBe(16);
  });
});
