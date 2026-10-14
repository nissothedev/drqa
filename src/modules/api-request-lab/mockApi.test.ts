import { afterEach, describe, expect, it, vi } from 'vitest';
import { simulate, toCurl, toRawHttp, MOCK_BASE, type MockRequest } from './mockApi';
import { PRESETS } from './presets';

const base: MockRequest = { method: 'GET', url: `${MOCK_BASE}/products`, params: [], headers: [], body: '', auth: 'none' };

describe('mock API scenario selection', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(PRESETS.map((p) => [p.id, p] as const))('preset %s returns its documented status', (_id, p) => {
    const r = simulate({ method: p.method, url: p.url, params: p.params ?? [], headers: p.headers ?? [], body: p.body ?? '', auth: p.auth });
    expect(r.status).toBe(p.expect);
    expect(r.explanation.summary.length).toBeGreaterThan(0);
  });

  it('never touches the network', () => {
    const spy = vi.fn();
    vi.stubGlobal('fetch', spy);
    vi.stubGlobal('XMLHttpRequest', spy);
    for (const p of PRESETS) simulate({ method: p.method, url: p.url, params: p.params ?? [], headers: p.headers ?? [], body: p.body ?? '', auth: p.auth });
    expect(spy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('is deterministic for identical input', () => {
    const a = simulate(base);
    const b = simulate(base);
    expect(a).toEqual(b);
  });

  it('returns 400 for a non-numeric product id and 404 for an unknown one', () => {
    expect(simulate({ ...base, url: `${MOCK_BASE}/products/abc` }).status).toBe(400);
    expect(simulate({ ...base, url: `${MOCK_BASE}/products/9999` }).status).toBe(404);
    expect(simulate({ ...base, url: `${MOCK_BASE}/products/1001` }).status).toBe(200);
  });

  it('validates the limit query parameter boundaries', () => {
    const withLimit = (v: string) => simulate({ ...base, params: [{ key: 'limit', value: v, enabled: true }] }).status;
    expect(withLimit('0')).toBe(400);
    expect(withLimit('1')).toBe(200);
    expect(withLimit('50')).toBe(200);
    expect(withLimit('51')).toBe(400);
  });

  it('ignores disabled params and headers', () => {
    expect(simulate({ ...base, params: [{ key: 'limit', value: '0', enabled: false }] }).status).toBe(200);
    expect(simulate({ ...base, headers: [{ key: 'X-Demo-Simulate', value: '500', enabled: false }] }).status).toBe(200);
  });

  it('returns 404 for a wrong API version', () => {
    expect(simulate({ ...base, url: 'https://api.example.com/v2/products' }).status).toBe(404);
  });

  it('distinguishes 401 (no identity) from 403 (no permission)', () => {
    const del = { ...base, method: 'DELETE' as const, url: `${MOCK_BASE}/products/1001` };
    expect(simulate({ ...del, auth: 'none' }).status).toBe(401);
    expect(simulate({ ...del, auth: 'malformed' }).status).toBe(401);
    expect(simulate({ ...del, auth: 'customer' }).status).toBe(403);
    expect(simulate({ ...del, auth: 'admin' }).status).toBe(204);
  });

  it('returns 422 field errors for an order that breaks the contract', () => {
    const r = simulate({ ...base, method: 'POST', url: `${MOCK_BASE}/orders`, headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }], body: '{"customerId":"CUS-1001","items":[]}', auth: 'customer' });
    expect(r.status).toBe(422);
    const body = JSON.parse(r.body);
    expect(body.errors.map((e: { field: string }) => e.field)).toEqual(expect.arrayContaining(['items', 'shippingAddress']));
  });

  it('includes an Allow header on 405', () => {
    const r = simulate({ ...base, method: 'PUT', url: `${MOCK_BASE}/orders` , auth: 'customer'});
    expect(r.status).toBe(405);
    expect(r.headers.Allow).toBe('GET, POST');
  });

  it('builds raw HTTP and cURL including auth and params', () => {
    const req: MockRequest = { ...base, params: [{ key: 'limit', value: '3', enabled: true }], auth: 'customer' };
    expect(toRawHttp(req)).toContain('GET /v1/products?limit=3 HTTP/1.1');
    expect(toRawHttp(req)).toContain('Authorization: Bearer demo-customer-token');
    expect(toCurl(req)).toContain("curl -X GET 'https://api.example.com/v1/products?limit=3'");
  });
});
