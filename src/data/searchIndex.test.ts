import { describe, expect, it } from 'vitest';
import { search } from './searchIndex';

describe('global search', () => {
  it('ranks the diagnosis first for a status code', () => {
    expect(search('401')[0].path).toBe('/api-doctor?entry=http-401');
  });

  it('finds glossary terms in Hebrew and English', () => {
    expect(search('Correlation').some((r) => r.id === 't:correlation-id')).toBe(true);
    expect(search('מזהה קורלציה').some((r) => r.id === 't:correlation-id')).toBe(true);
  });

  it('returns nothing for empty queries', () => {
    expect(search('   ')).toEqual([]);
  });
});
