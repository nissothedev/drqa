import { describe, expect, it } from 'vitest';
import { diffJson, flattenPaths, formatJson, getAtPath, jsonStats, minifyJson, parseJson, sortKeys, summarizeDiff, MAX_JSON_CHARS } from './json';
import { lineDiff } from './lineDiff';

describe('parseJson', () => {
  it('parses valid JSON', () => {
    const r = parseJson('{"a":1}');
    expect(r.ok && r.value).toEqual({ a: 1 });
  });

  it('flags empty input distinctly', () => {
    const r = parseJson('   ');
    expect(r.ok).toBe(false);
    expect(!r.ok && r.empty).toBe(true);
  });

  it('reports line and column for syntax errors', () => {
    const r = parseJson('{\n  "a": 1,\n}');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.line).toBe(3);
      expect(r.error.message.length).toBeGreaterThan(0);
    }
  });

  it('rejects oversized input before parsing', () => {
    const r = parseJson('"' + 'x'.repeat(MAX_JSON_CHARS) + '"');
    expect(r.ok).toBe(false);
  });
});

describe('format / minify / sort', () => {
  it('pretty prints and minifies', () => {
    expect(formatJson({ a: [1, null] })).toBe('{\n  "a": [\n    1,\n    null\n  ]\n}');
    expect(minifyJson({ a: [1, null] })).toBe('{"a":[1,null]}');
  });

  it('sorts keys recursively', () => {
    expect(JSON.stringify(sortKeys({ b: 1, a: { d: 1, c: 2 } }))).toBe('{"a":{"c":2,"d":1},"b":1}');
  });
});

describe('diffJson', () => {
  it('detects added, removed, changed and type changes with paths', () => {
    const a = { id: 1, price: 49.9, tags: ['a'], meta: { x: 1 }, gone: true };
    const b = { id: '1', price: 39.9, tags: ['a', 'b'], meta: { x: 1, y: null } };
    const d = diffJson(a, b);
    expect(d).toContainEqual(expect.objectContaining({ path: '$.id', kind: 'type-changed', beforeType: 'number', afterType: 'string' }));
    expect(d).toContainEqual(expect.objectContaining({ path: '$.price', kind: 'changed', before: 49.9, after: 39.9 }));
    expect(d).toContainEqual(expect.objectContaining({ path: '$.tags[1]', kind: 'added', after: 'b' }));
    expect(d).toContainEqual(expect.objectContaining({ path: '$.meta.y', kind: 'added', after: null }));
    expect(d).toContainEqual(expect.objectContaining({ path: '$.gone', kind: 'removed' }));
    expect(summarizeDiff(d)).toEqual({ added: 2, removed: 1, changed: 1, 'type-changed': 1 });
  });

  it('treats null vs missing differently', () => {
    expect(diffJson({ a: null }, {})).toEqual([expect.objectContaining({ path: '$.a', kind: 'removed' })]);
  });

  it('returns no entries for equal documents', () => {
    expect(diffJson({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toEqual([]);
  });

  it('can ignore primitive array order', () => {
    expect(diffJson([1, 2, 3], [3, 1, 2], { ignoreArrayOrder: true })).toEqual([]);
    expect(diffJson([1, 2, 3], [3, 1, 2]).length).toBeGreaterThan(0);
  });

  it('quotes non-identifier keys in paths', () => {
    expect(diffJson({ 'a-b': 1 }, { 'a-b': 2 })[0].path).toBe('$["a-b"]');
  });
});

describe('path exploration', () => {
  const doc = { items: [{ sku: 'SKU-DS-1001', qty: 2 }], 'odd key': null };
  it('flattens with paths and types', () => {
    const paths = flattenPaths(doc).map((p) => `${p.path}:${p.type}`);
    expect(paths).toEqual(['$:object', '$.items:array', '$.items[0]:object', '$.items[0].sku:string', '$.items[0].qty:number', '$["odd key"]:null']);
  });

  it('resolves paths', () => {
    expect(getAtPath(doc, '$.items[0].sku')).toEqual({ found: true, value: 'SKU-DS-1001' });
    expect(getAtPath(doc, '$["odd key"]')).toEqual({ found: true, value: null });
    expect(getAtPath(doc, '$.items[3]').found).toBe(false);
    expect(getAtPath(doc, 'items').found).toBe(false);
  });

  it('computes stats', () => {
    expect(jsonStats(doc)).toEqual({ keys: 4, depth: 3, arrays: 1, nulls: 1 });
  });
});

describe('lineDiff', () => {
  it('aligns unchanged, modified, added and removed lines', () => {
    const rows = lineDiff('a\nb\nc', 'a\nB\nc\nd')!;
    expect(rows.map((r) => r.kind)).toEqual(['same', 'modified', 'same', 'added']);
  });
});
