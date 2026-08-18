import { describe, expect, it } from 'vitest';
import { normalizeDecimalInput, parseDecimalInput } from './decimal-input';

describe('decimal input normalization', () => {
  it('accepts a comma as a decimal separator', () => {
    expect(normalizeDecimalInput('12,50')).toBe('12.50');
    expect(parseDecimalInput('12,50')).toBe(12.5);
  });

  it('keeps dot decimals working', () => {
    expect(normalizeDecimalInput('12.50')).toBe('12.50');
    expect(parseDecimalInput('12.50')).toBe(12.5);
  });

  it('keeps empty values safe', () => {
    expect(normalizeDecimalInput('')).toBe('');
    expect(parseDecimalInput('')).toBe(0);
  });
});
