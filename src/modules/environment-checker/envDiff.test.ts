import { describe, expect, it } from 'vitest';
import { diffEnv, mask, parseEnv } from './envDiff';

describe('environment config diff', () => {
  it('parses KEY=VALUE lines, quotes, comments, duplicates and invalid lines', () => {
    const p = parseEnv('# comment\nA=1\nexport B="two"\nC: three\nnot a line\nA=2\n');
    expect([...p.values.entries()]).toEqual([
      ['A', '2'],
      ['B', 'two'],
      ['C', 'three'],
    ]);
    expect(p.duplicates).toEqual(['A']);
    expect(p.invalidLines).toEqual([5]);
  });

  it('classifies differences and orders them by importance', () => {
    const a = parseEnv('API_BASE_URL=https://qa-api.example.com\nSAME=1\nONLY_A=x\nREQUEST_TIMEOUT_MS=30000').values;
    const b = parseEnv('API_BASE_URL=https://uat-api.example.com\nSAME=1\nONLY_B=y\nREQUEST_TIMEOUT_MS=10000').values;
    const rows = diffEnv(a, b);
    expect(rows.map((r) => `${r.key}:${r.status}`)).toEqual(['API_BASE_URL:different', 'REQUEST_TIMEOUT_MS:different', 'ONLY_A:onlyA', 'ONLY_B:onlyB', 'SAME:same']);
    expect(rows[1].hint).toContain('504');
    expect(rows.find((r) => r.key === 'SAME')!.hint).toBeUndefined();
  });

  it('flags and masks sensitive keys', () => {
    const rows = diffEnv(parseEnv('PAYMENT_API_KEY=abcdef123').values, parseEnv('PAYMENT_API_KEY=zzzzzz999').values);
    expect(rows[0].sensitive).toBe(true);
    expect(mask('abcdef123')).toBe('ab••••23');
    expect(mask('abc')).toBe('••••');
  });
});
