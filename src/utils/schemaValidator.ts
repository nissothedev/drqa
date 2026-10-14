/**
 * DRQA JSON Schema validator — a documented, dependency-free SUBSET of JSON Schema (draft 2020-12 semantics).
 *
 * Supported keywords:
 *   type (incl. arrays of types, "integer"), enum, const,
 *   properties, required, additionalProperties (boolean or schema),
 *   items (single schema), minItems, maxItems, uniqueItems,
 *   minLength, maxLength, pattern, format (email, date, date-time, uri, uuid),
 *   minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf
 * Annotation keywords (title, description, examples, $schema, $id, default) are accepted and ignored.
 * Any other keyword (e.g. $ref, oneOf, anyOf, if/then) is reported as "unsupported" and NOT enforced.
 */

import { childPath, typeOf, type JsonValue } from './json';

export interface Schema {
  type?: SchemaType | SchemaType[];
  enum?: JsonValue[];
  const?: JsonValue;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean | Schema;
  items?: Schema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  title?: string;
  description?: string;
  [key: string]: unknown;
}

export type SchemaType = 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';

export interface ValidationError {
  path: string;
  pointer: string;
  keyword: string;
  message: string;
  hint: string;
  expected?: string;
  actual?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  unsupported: string[];
}

const SUPPORTED = new Set([
  'type', 'enum', 'const', 'properties', 'required', 'additionalProperties', 'items', 'minItems', 'maxItems', 'uniqueItems',
  'minLength', 'maxLength', 'pattern', 'format', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
  'title', 'description', 'examples', '$schema', '$id', 'default', 'readOnly', 'writeOnly', 'deprecated',
]);

const TYPE_HE: Record<string, string> = {
  object: 'אובייקט',
  array: 'מערך',
  string: 'מחרוזת',
  number: 'מספר',
  integer: 'מספר שלם',
  boolean: 'בוליאני',
  null: 'null',
};

const FORMATS: Record<string, RegExp> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  'date-time': /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/,
  uri: /^[a-zA-Z][a-zA-Z0-9+.-]*:[^\s]+$/,
  uuid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
};

function pathToPointer(path: string): string {
  if (path === '$') return '';
  const tokens: string[] = [];
  const re = /\.([A-Za-z_$][A-Za-z0-9_$]*)|\[(\d+)\]|\[("(?:[^"\\]|\\.)*")\]/g;
  for (const m of path.slice(1).matchAll(re)) tokens.push(m[1] ?? m[2] ?? (JSON.parse(m[3]) as string));
  return '/' + tokens.map((t) => t.replace(/~/g, '~0').replace(/\//g, '~1')).join('/');
}

function show(v: JsonValue | undefined): string {
  if (v === undefined) return '—';
  const s = JSON.stringify(v);
  return s.length > 60 ? `${s.slice(0, 57)}...` : s;
}

function matchesType(value: JsonValue, t: SchemaType): boolean {
  const actual = typeOf(value);
  if (t === 'integer') return actual === 'number' && Number.isInteger(value);
  if (t === 'number') return actual === 'number';
  return actual === t;
}

function deepEqual(a: JsonValue, b: JsonValue): boolean {
  return JSON.stringify(sortedClone(a)) === JSON.stringify(sortedClone(b));
}

function sortedClone(v: JsonValue): JsonValue {
  if (Array.isArray(v)) return v.map(sortedClone);
  if (v && typeof v === 'object') {
    const out: Record<string, JsonValue> = {};
    for (const k of Object.keys(v).sort()) out[k] = sortedClone(v[k]);
    return out;
  }
  return v;
}

export function collectUnsupported(schema: Schema, path = '#', out: string[] = []): string[] {
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED.has(key)) out.push(`${path}/${key}`);
  }
  if (schema.properties) for (const [k, s] of Object.entries(schema.properties)) collectUnsupported(s, `${path}/properties/${k}`, out);
  if (schema.items && typeof schema.items === 'object') collectUnsupported(schema.items, `${path}/items`, out);
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') collectUnsupported(schema.additionalProperties, `${path}/additionalProperties`, out);
  return out;
}

export function validate(value: JsonValue, schema: Schema): ValidationResult {
  const errors: ValidationError[] = [];
  const push = (path: string, keyword: string, message: string, hint: string, expected?: string, actual?: string) =>
    errors.push({ path, pointer: pathToPointer(path), keyword, message, hint, expected, actual });

  const visit = (v: JsonValue, s: Schema, path: string) => {
    // type
    if (s.type !== undefined) {
      const types = Array.isArray(s.type) ? s.type : [s.type];
      if (!types.some((t) => matchesType(v, t))) {
        const actual = typeOf(v) === 'number' && types.includes('integer') ? 'מספר לא שלם' : TYPE_HE[typeOf(v)];
        push(
          path,
          'type',
          `טיפוס שגוי: צפוי ${types.map((t) => TYPE_HE[t]).join(' או ')}, התקבל ${actual}`,
          typeOf(v) === 'string' && types.some((t) => t === 'number' || t === 'integer')
            ? 'נראה שמספר נשלח כמחרוזת (במירכאות). הסירו את המירכאות.'
            : typeOf(v) === 'null'
              ? 'השדה נשלח כ-null אך הסכמה לא מאפשרת null.'
              : 'בדקו את המיפוי בצד ששולח את הנתון.',
          types.join(' | '),
          `${typeOf(v)} ${show(v)}`,
        );
        return; // further checks on wrong type are noise
      }
    }
    if (s.const !== undefined && !deepEqual(v, s.const)) {
      push(path, 'const', `הערך חייב להיות בדיוק ${show(s.const)}`, 'ערך קבוע לפי החוזה.', show(s.const), show(v));
    }
    if (s.enum && !s.enum.some((e) => deepEqual(e, v))) {
      push(path, 'enum', `ערך לא מותר: ${show(v)}`, `ערכים מותרים: ${s.enum.map(show).join(', ')}. שימו לב לרישיות.`, s.enum.map(show).join(' | '), show(v));
    }

    const t = typeOf(v);
    if (t === 'string') {
      const str = v as string;
      const len = [...str].length;
      if (s.minLength !== undefined && len < s.minLength)
        push(path, 'minLength', `קצר מדי: ${len} תווים (מינימום ${s.minLength})`, len === 0 ? 'מחרוזת ריקה אינה שקולה לשדה חסר – אך גם היא נדחית.' : 'הוסיפו תווים או בדקו חיתוך.', `≥ ${s.minLength}`, String(len));
      if (s.maxLength !== undefined && len > s.maxLength) push(path, 'maxLength', `ארוך מדי: ${len} תווים (מקסימום ${s.maxLength})`, 'קצרו את הערך או בדקו את מגבלת השדה.', `≤ ${s.maxLength}`, String(len));
      if (s.pattern !== undefined) {
        let re: RegExp | null = null;
        try {
          re = new RegExp(s.pattern, 'u');
        } catch {
          push(path, 'pattern', `תבנית לא תקינה בסכמה: ${s.pattern}`, 'תקנו את ה-pattern בסכמה.');
        }
        if (re && !re.test(str)) push(path, 'pattern', `הערך לא תואם לתבנית ${s.pattern}`, 'בדקו פורמט, קידומת ותווים מיוחדים.', s.pattern, show(v));
      }
      if (s.format && FORMATS[s.format] && !FORMATS[s.format].test(str)) {
        push(path, 'format', `פורמט ${s.format} לא תקין`, s.format === 'date-time' ? 'צפוי ISO 8601, למשל 2026-10-13T09:30:00Z' : s.format === 'date' ? 'צפוי YYYY-MM-DD' : 'בדקו את מבנה הערך.', s.format, show(v));
      }
    }

    if (t === 'number') {
      const n = v as number;
      if (s.minimum !== undefined && n < s.minimum) push(path, 'minimum', `ערך קטן מהמינימום ${s.minimum}`, 'ערך גבול תחתון – כדאי לבדוק גם min-1, min.', `≥ ${s.minimum}`, String(n));
      if (s.maximum !== undefined && n > s.maximum) push(path, 'maximum', `ערך גדול מהמקסימום ${s.maximum}`, 'ערך גבול עליון – כדאי לבדוק גם max, max+1.', `≤ ${s.maximum}`, String(n));
      if (s.exclusiveMinimum !== undefined && n <= s.exclusiveMinimum) push(path, 'exclusiveMinimum', `הערך חייב להיות גדול מ-${s.exclusiveMinimum}`, 'הגבול עצמו אינו כלול.', `> ${s.exclusiveMinimum}`, String(n));
      if (s.exclusiveMaximum !== undefined && n >= s.exclusiveMaximum) push(path, 'exclusiveMaximum', `הערך חייב להיות קטן מ-${s.exclusiveMaximum}`, 'הגבול עצמו אינו כלול.', `< ${s.exclusiveMaximum}`, String(n));
      if (s.multipleOf !== undefined && Math.abs(n / s.multipleOf - Math.round(n / s.multipleOf)) > 1e-9) push(path, 'multipleOf', `הערך חייב להיות כפולה של ${s.multipleOf}`, 'למשל מחירים בדיוק של אגורות.', `× ${s.multipleOf}`, String(n));
    }

    if (t === 'array') {
      const arr = v as JsonValue[];
      if (s.minItems !== undefined && arr.length < s.minItems) push(path, 'minItems', `מעט מדי פריטים: ${arr.length} (מינימום ${s.minItems})`, arr.length === 0 ? 'מערך ריק – האם זה מצב עסקי חוקי?' : 'הוסיפו פריטים.', `≥ ${s.minItems}`, String(arr.length));
      if (s.maxItems !== undefined && arr.length > s.maxItems) push(path, 'maxItems', `יותר מדי פריטים: ${arr.length} (מקסימום ${s.maxItems})`, 'צמצמו את מספר הפריטים.', `≤ ${s.maxItems}`, String(arr.length));
      if (s.uniqueItems) {
        const seen = new Set<string>();
        arr.forEach((it, i) => {
          const key = JSON.stringify(sortedClone(it));
          if (seen.has(key)) push(childPath(path, i), 'uniqueItems', 'פריט כפול במערך', 'הסכמה דורשת פריטים ייחודיים.');
          seen.add(key);
        });
      }
      if (s.items) arr.forEach((it, i) => visit(it, s.items!, childPath(path, i)));
    }

    if (t === 'object') {
      const obj = v as Record<string, JsonValue>;
      for (const r of s.required ?? []) {
        if (!Object.prototype.hasOwnProperty.call(obj, r)) {
          push(childPath(path, r), 'required', `שדה חובה חסר: ${r}`, 'בדקו שם שדה (רישיות, camelCase/snake_case) ושהשדה נשלח בכלל.', r, 'missing');
        }
      }
      for (const [k, child] of Object.entries(obj)) {
        const ps = s.properties?.[k];
        if (ps) visit(child, ps, childPath(path, k));
        else if (s.additionalProperties === false) {
          const similar = Object.keys(s.properties ?? {}).find((p) => p.toLowerCase() === k.toLowerCase() || p.replace(/_/g, '').toLowerCase() === k.replace(/_/g, '').toLowerCase());
          push(childPath(path, k), 'additionalProperties', `שדה לא צפוי: ${k}`, similar ? `האם התכוונתם ל-"${similar}"?` : 'השדה אינו מוגדר בחוזה.', 'not allowed', show(child));
        } else if (typeof s.additionalProperties === 'object') visit(child, s.additionalProperties, childPath(path, k));
      }
    }
  };

  visit(value, schema, '$');
  return { valid: errors.length === 0, errors, unsupported: collectUnsupported(schema) };
}
