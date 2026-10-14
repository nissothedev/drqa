import { describe, expect, it } from 'vitest';
import { generateTestCases, toCsv, validPayload, validValue } from './generator';
import type { EndpointSpec } from '../../types/testing';

const ORDER: EndpointSpec = {
  method: 'POST',
  path: '/v1/orders',
  authRequired: true,
  successStatus: 201,
  validationStatus: 422,
  duplicateCheck: true,
  fields: [
    { name: 'customerId', type: 'string', required: true, example: 'CUS-1001' },
    { name: 'quantity', type: 'integer', required: true, min: 1, max: 10 },
    { name: 'status', type: 'enum', required: false, allowed: ['pending', 'paid'] },
    { name: 'email', type: 'email', required: false },
  ],
};

const SEARCH: EndpointSpec = {
  method: 'GET',
  path: '/v1/products',
  authRequired: false,
  successStatus: 200,
  validationStatus: 400,
  duplicateCheck: false,
  fields: [{ name: 'limit', type: 'integer', required: false, min: 1, max: 50 }],
};

describe('test case generation', () => {
  const cases = generateTestCases(ORDER);
  const byCat = (c: string) => cases.filter((x) => x.category === c);

  it('is deterministic', () => {
    expect(generateTestCases(ORDER)).toEqual(cases);
  });

  it('gives every case a unique sequential id and all required parts', () => {
    const ids = cases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('TC-POST-ORDERS-001');
    for (const c of cases) {
      expect(c.title && c.expected && c.steps.length && c.preconditions.length).toBeTruthy();
    }
  });

  it('creates one missing-field case per required field', () => {
    expect(byCat('missing-required').map((c) => c.title)).toEqual(['שדה חובה חסר: customerId', 'שדה חובה חסר: quantity']);
    expect(byCat('missing-required')[0].testData).not.toContain('customerId');
    expect(byCat('missing-required')[0].expected).toContain('422');
  });

  it('creates min-1/min/max/max+1 boundaries for ranged integers', () => {
    const titles = byCat('boundary').map((c) => c.title);
    expect(titles).toEqual(expect.arrayContaining([expect.stringContaining('(0)'), expect.stringContaining('(1)'), expect.stringContaining('(10)'), expect.stringContaining('(11)')]));
  });

  it('adds auth, content-type, duplicate and invalid-method cases when relevant', () => {
    expect(byCat('auth').map((c) => c.expected.slice(0, 9))).toEqual(['סטטוס 401', 'סטטוס 401', 'סטטוס 403']);
    expect(byCat('content-type')).toHaveLength(3);
    expect(byCat('duplicate')).toHaveLength(1);
    expect(byCat('invalid-method')[0].expected).toContain('405');
  });

  it('skips body-only cases for GET endpoints and renders query strings', () => {
    const s = generateTestCases(SEARCH);
    expect(s.some((c) => c.category === 'content-type')).toBe(false);
    expect(s.some((c) => c.category === 'auth')).toBe(false);
    expect(s[0].testData.startsWith('?limit=')).toBe(true);
  });

  it('produces valid values inside constraints', () => {
    expect(validValue({ name: 'q', type: 'integer', required: true, min: 1, max: 10 })).toBeGreaterThanOrEqual(1);
    expect(validValue({ name: 'e', type: 'enum', required: true, allowed: ['a', 'b'] })).toBe('a');
    expect(validPayload(ORDER, false)).toEqual({ customerId: 'CUS-1001', quantity: 6 });
  });

  it('exports CSV with BOM, header and escaped multi-line cells', () => {
    const csv = toCsv(cases);
    expect(csv.startsWith('﻿"ID","Category"')).toBe(true);
    expect(csv.split('\r\n').length).toBe(cases.length + 1);
    expect(csv).toContain('""customerId""');
  });
});
