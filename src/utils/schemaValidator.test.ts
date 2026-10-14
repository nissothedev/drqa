import { describe, expect, it } from 'vitest';
import { validate } from './schemaValidator';
import { CONTRACTS, CREATE_ORDER_SCHEMA } from '../data/contracts';
import type { JsonValue } from './json';

describe('schema validator (supported subset)', () => {
  it.each(CONTRACTS.flatMap((c) => c.samples.map((s) => [`${c.id}/${s.id}`, c, s] as const)))('sample %s matches its expected validity', (_n, c, s) => {
    expect(validate(s.payload as JsonValue, c.schema).valid).toBe(s.expectValid);
  });

  it('reports missing required fields with a path', () => {
    const r = validate({ customerId: 'CUS-1001', items: [{ sku: 'SKU-DS-1001', quantity: 1 }] }, CREATE_ORDER_SCHEMA);
    expect(r.errors).toContainEqual(expect.objectContaining({ path: '$.shippingAddress', keyword: 'required', pointer: '/shippingAddress' }));
  });

  it('reports numbers sent as strings as type errors with a helpful hint', () => {
    const r = validate({ customerId: 'CUS-1001', items: [{ sku: 'SKU-DS-1001', quantity: '2' }], shippingAddress: { street: 'Main 1', city: 'Demo', zip: '12345' } }, CREATE_ORDER_SCHEMA);
    const e = r.errors.find((x) => x.path === '$.items[0].quantity');
    expect(e?.keyword).toBe('type');
    expect(e?.hint).toContain('מחרוזת');
  });

  it('distinguishes integer from number', () => {
    expect(validate(2.5, { type: 'integer' }).valid).toBe(false);
    expect(validate(2, { type: 'integer' }).valid).toBe(true);
    expect(validate(2.5, { type: 'number' }).valid).toBe(true);
  });

  it('suggests the correct name for a likely-misnamed property', () => {
    const r = validate({ customerId: 'CUS-1001', items: [{ sku: 'SKU-DS-1001', quantity: 1 }], shipping_address: {} }, CREATE_ORDER_SCHEMA);
    const extra = r.errors.find((e) => e.keyword === 'additionalProperties');
    expect(extra?.hint).toContain('shippingAddress');
  });

  it('enforces boundaries, enum, pattern, format, uniqueItems and nullable types', () => {
    expect(validate(0, { type: 'integer', minimum: 1 }).errors[0].keyword).toBe('minimum');
    expect(validate(11, { type: 'integer', maximum: 10 }).errors[0].keyword).toBe('maximum');
    expect(validate('PAID', { enum: ['paid'] }).errors[0].keyword).toBe('enum');
    expect(validate('x@y', { type: 'string', format: 'email' }).errors[0].keyword).toBe('format');
    expect(validate('2026-10-13T09:30:00Z', { type: 'string', format: 'date-time' }).valid).toBe(true);
    expect(validate([1, 1], { type: 'array', uniqueItems: true }).errors[0].keyword).toBe('uniqueItems');
    expect(validate(null, { type: ['string', 'null'] }).valid).toBe(true);
    expect(validate('ab', { type: 'string', pattern: '^\\d+$' }).errors[0].keyword).toBe('pattern');
  });

  it('lists unsupported keywords instead of silently pretending to enforce them', () => {
    const r = validate({}, { type: 'object', oneOf: [], properties: { a: { $ref: '#/x' } } });
    expect(r.unsupported).toEqual(['#/oneOf', '#/properties/a/$ref']);
  });
});
