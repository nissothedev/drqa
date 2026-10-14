/**
 * Browser-side JSON utilities used by JSON Studio, Request Lab and Contract Validator.
 * Pure functions – no I/O, no persistence.
 */

export const MAX_JSON_CHARS = 1_000_000; // ~1 MB guard to keep the UI responsive

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type JsonType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface JsonParseError {
  message: string;
  line?: number;
  column?: number;
  position?: number;
}

export type ParseResult =
  | { ok: true; value: JsonValue }
  | { ok: false; error: JsonParseError; empty?: boolean };

export function typeOf(value: unknown): JsonType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'object') return 'object';
  if (t === 'string' || t === 'number' || t === 'boolean') return t;
  return 'null';
}

function positionToLineCol(text: string, position: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  for (let i = 0; i < position && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column };
}

/** Translates common engine messages into a short Hebrew hint. */
function hintFor(raw: string, text: string): string {
  const trimmed = text.trim();
  if (/'|‘|’/.test(trimmed) && /Unexpected token '|Expected property name|single quote/i.test(raw)) {
    return 'ייתכן שנעשה שימוש בגרש בודד (\') – ב-JSON מחרוזות ושמות שדות חייבים להיות במירכאות כפולות (").';
  }
  if (/Unexpected end|end of JSON|unterminated/i.test(raw)) {
    return 'הקלט נקטע באמצע – ייתכן שחסר סוגר } או ] או מירכאה סוגרת.';
  }
  if (/after property value|Expected ','|expected ','/i.test(raw)) {
    return 'חסר פסיק בין שדות, או שיש תו מיותר אחרי ערך.';
  }
  if (/Expected double-quoted property name|property name/i.test(raw)) {
    return 'שם שדה חייב להיות במירכאות כפולות. בדקו גם פסיק מיותר לפני }.';
  }
  if (/Unexpected token/i.test(raw)) {
    return 'נמצא תו לא צפוי. בדקו פסיקים מיותרים, הערות (אינן חוקיות ב-JSON) או ערכים לא מוקפים במירכאות.';
  }
  return 'התחביר אינו JSON תקין.';
}

export function parseJson(text: string): ParseResult {
  if (text.length > MAX_JSON_CHARS) {
    return {
      ok: false,
      error: { message: `הקלט גדול מדי (${text.length.toLocaleString('he-IL')} תווים). המגבלה היא ${MAX_JSON_CHARS.toLocaleString('he-IL')} תווים.` },
    };
  }
  if (text.trim() === '') {
    return { ok: false, empty: true, error: { message: 'הקלט ריק. הדביקו JSON כדי להתחיל.' } };
  }
  try {
    return { ok: true, value: JSON.parse(text) as JsonValue };
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    let line: number | undefined;
    let column: number | undefined;
    let position: number | undefined;
    const posMatch = raw.match(/position (\d+)/i);
    const lcMatch = raw.match(/line (\d+) column (\d+)/i);
    if (posMatch) {
      position = Number(posMatch[1]);
      ({ line, column } = positionToLineCol(text, position));
    } else if (lcMatch) {
      line = Number(lcMatch[1]);
      column = Number(lcMatch[2]);
    } else if (/Unexpected end/i.test(raw)) {
      position = text.length;
      ({ line, column } = positionToLineCol(text, position));
    }
    return { ok: false, error: { message: hintFor(raw, text), line, column, position } };
  }
}

export function formatJson(value: JsonValue, indent = 2): string {
  return JSON.stringify(value, null, indent);
}

export function minifyJson(value: JsonValue): string {
  return JSON.stringify(value);
}

/** Recursively sorts object keys – useful before comparing payloads from different sources. */
export function sortKeys(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out: { [k: string]: JsonValue } = {};
    for (const k of Object.keys(value).sort()) out[k] = sortKeys(value[k]);
    return out;
  }
  return value;
}

const SIMPLE_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function childPath(parent: string, key: string | number): string {
  if (typeof key === 'number') return `${parent}[${key}]`;
  return SIMPLE_KEY.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`;
}

// ---------------------------------------------------------------------------
// Structural diff
// ---------------------------------------------------------------------------

export type DiffKind = 'added' | 'removed' | 'changed' | 'type-changed';

export interface DiffEntry {
  path: string;
  kind: DiffKind;
  before?: JsonValue;
  after?: JsonValue;
  beforeType?: JsonType;
  afterType?: JsonType;
}

export interface DiffOptions {
  /** Compare arrays ignoring order of primitive items (objects still by index). */
  ignoreArrayOrder?: boolean;
}

export function diffJson(a: JsonValue, b: JsonValue, options: DiffOptions = {}, path = '$'): DiffEntry[] {
  const ta = typeOf(a);
  const tb = typeOf(b);
  if (ta !== tb) {
    return [{ path, kind: 'type-changed', before: a, after: b, beforeType: ta, afterType: tb }];
  }
  if (ta === 'object') {
    const ao = a as { [k: string]: JsonValue };
    const bo = b as { [k: string]: JsonValue };
    const out: DiffEntry[] = [];
    const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
    for (const k of keys) {
      const p = childPath(path, k);
      const inA = Object.prototype.hasOwnProperty.call(ao, k);
      const inB = Object.prototype.hasOwnProperty.call(bo, k);
      if (inA && !inB) out.push({ path: p, kind: 'removed', before: ao[k], beforeType: typeOf(ao[k]) });
      else if (!inA && inB) out.push({ path: p, kind: 'added', after: bo[k], afterType: typeOf(bo[k]) });
      else out.push(...diffJson(ao[k], bo[k], options, p));
    }
    return out;
  }
  if (ta === 'array') {
    const aa = a as JsonValue[];
    const ba = b as JsonValue[];
    if (options.ignoreArrayOrder && aa.every(isPrimitive) && ba.every(isPrimitive)) {
      const key = (v: JsonValue) => `${typeOf(v)}:${String(v)}`;
      const countA = countBy(aa, key);
      const countB = countBy(ba, key);
      const out: DiffEntry[] = [];
      for (const [k, n] of countA) {
        const m = countB.get(k) ?? 0;
        for (let i = 0; i < n - m; i++) out.push({ path: `${path}[*]`, kind: 'removed', before: aa.find((v) => key(v) === k) });
      }
      for (const [k, n] of countB) {
        const m = countA.get(k) ?? 0;
        for (let i = 0; i < n - m; i++) out.push({ path: `${path}[*]`, kind: 'added', after: ba.find((v) => key(v) === k) });
      }
      return out;
    }
    const out: DiffEntry[] = [];
    const max = Math.max(aa.length, ba.length);
    for (let i = 0; i < max; i++) {
      const p = childPath(path, i);
      if (i >= ba.length) out.push({ path: p, kind: 'removed', before: aa[i], beforeType: typeOf(aa[i]) });
      else if (i >= aa.length) out.push({ path: p, kind: 'added', after: ba[i], afterType: typeOf(ba[i]) });
      else out.push(...diffJson(aa[i], ba[i], options, p));
    }
    return out;
  }
  if (a !== b) return [{ path, kind: 'changed', before: a, after: b, beforeType: ta, afterType: tb }];
  return [];
}

function isPrimitive(v: JsonValue): boolean {
  return v === null || typeof v !== 'object';
}

function countBy<T>(items: T[], key: (t: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
  return m;
}

export function summarizeDiff(entries: DiffEntry[]): Record<DiffKind, number> {
  const s: Record<DiffKind, number> = { added: 0, removed: 0, changed: 0, 'type-changed': 0 };
  for (const e of entries) s[e.kind]++;
  return s;
}

// ---------------------------------------------------------------------------
// Path exploration
// ---------------------------------------------------------------------------

export interface PathEntry {
  path: string;
  depth: number;
  type: JsonType;
  preview: string;
  key: string;
}

export function flattenPaths(value: JsonValue, limit = 5000): PathEntry[] {
  const out: PathEntry[] = [];
  const walk = (v: JsonValue, path: string, depth: number, key: string) => {
    if (out.length >= limit) return;
    const t = typeOf(v);
    out.push({ path, depth, type: t, key, preview: previewOf(v) });
    if (t === 'object') {
      for (const [k, child] of Object.entries(v as { [k: string]: JsonValue })) walk(child, childPath(path, k), depth + 1, k);
    } else if (t === 'array') {
      (v as JsonValue[]).forEach((child, i) => walk(child, childPath(path, i), depth + 1, `[${i}]`));
    }
  };
  walk(value, '$', 0, '$');
  return out;
}

export function previewOf(v: JsonValue): string {
  const t = typeOf(v);
  if (t === 'object') return `{${Object.keys(v as object).length}}`;
  if (t === 'array') return `[${(v as JsonValue[]).length}]`;
  if (t === 'string') {
    const s = v as string;
    return JSON.stringify(s.length > 60 ? `${s.slice(0, 57)}...` : s);
  }
  return String(v);
}

/** Resolves a simple path such as $.items[0].sku or $["odd key"] */
export function getAtPath(value: JsonValue, path: string): { found: boolean; value?: JsonValue } {
  const p = path.trim();
  if (!p.startsWith('$')) return { found: false };
  const tokens: Array<string | number> = [];
  const re = /\.([A-Za-z_$][A-Za-z0-9_$]*)|\[(\d+)\]|\[("(?:[^"\\]|\\.)*")\]/gy;
  re.lastIndex = 1;
  let consumed = 1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(p)) !== null) {
    if (m[1] !== undefined) tokens.push(m[1]);
    else if (m[2] !== undefined) tokens.push(Number(m[2]));
    else if (m[3] !== undefined) tokens.push(JSON.parse(m[3]) as string);
    consumed = re.lastIndex;
  }
  if (consumed !== p.length) return { found: false };
  let cur: JsonValue = value;
  for (const t of tokens) {
    if (typeof t === 'number') {
      if (!Array.isArray(cur) || t >= cur.length) return { found: false };
      cur = cur[t];
    } else {
      if (cur === null || typeof cur !== 'object' || Array.isArray(cur) || !Object.prototype.hasOwnProperty.call(cur, t)) return { found: false };
      cur = (cur as { [k: string]: JsonValue })[t];
    }
  }
  return { found: true, value: cur };
}

export function jsonStats(value: JsonValue): { keys: number; depth: number; arrays: number; nulls: number } {
  let keys = 0;
  let depth = 0;
  let arrays = 0;
  let nulls = 0;
  const walk = (v: JsonValue, d: number) => {
    depth = Math.max(depth, d);
    if (v === null) nulls++;
    else if (Array.isArray(v)) {
      arrays++;
      v.forEach((c) => walk(c, d + 1));
    } else if (typeof v === 'object') {
      for (const c of Object.values(v)) {
        keys++;
        walk(c, d + 1);
      }
    }
  };
  walk(value, 0);
  return { keys, depth, arrays, nulls };
}
