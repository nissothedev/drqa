/** Parses KEY=VALUE config text and compares two environments. Pure and local. */

export interface EnvParse {
  values: Map<string, string>;
  duplicates: string[];
  invalidLines: number[];
}

export function parseEnv(text: string): EnvParse {
  const values = new Map<string, string>();
  const duplicates: string[] = [];
  const invalidLines: number[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*[=:]\s*(.*)$/);
    if (!m) {
      invalidLines.push(i + 1);
      return;
    }
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (values.has(m[1])) duplicates.push(m[1]);
    values.set(m[1], v);
  });
  return { values, duplicates, invalidLines };
}

export type DiffStatus = 'same' | 'different' | 'onlyA' | 'onlyB';

export interface EnvDiffRow {
  key: string;
  a?: string;
  b?: string;
  status: DiffStatus;
  sensitive: boolean;
  hint?: string;
}

const SENSITIVE = /(SECRET|PASSWORD|PASSWD|PWD|TOKEN|API_?KEY|PRIVATE|CREDENTIAL|CONNECTION_STRING)/i;

const HINTS: Array<{ re: RegExp; hint: string }> = [
  { re: /(URL|HOST|ENDPOINT|BASE)/i, hint: 'כתובת שונה – בקשות עשויות להגיע לשירות או לסביבה אחרת.' },
  { re: /TIMEOUT/i, hint: 'timeout שונה – עשוי להסביר 504 / timeout רק בסביבה אחת.' },
  { re: /(FEATURE|FLAG|ENABLE)/i, hint: 'דגל שונה – אותו קוד, התנהגות שונה.' },
  { re: /RATE_?LIMIT/i, hint: 'מגבלת קצב שונה – עשויה להסביר 429.' },
  { re: /(CORS|ORIGIN)/i, hint: 'רשימת Origins שונה – עשויה להסביר שגיאות CORS.' },
  { re: /(AUTH|ISSUER|AUDIENCE|JWT)/i, hint: 'הגדרת אימות שונה – עשויה להסביר 401 עם טוקן "תקין".' },
  { re: /(CURRENCY|LOCALE|TZ|TIMEZONE)/i, hint: 'אזור/מטבע שונה – עשוי להסביר פורמטים וחישובים שונים.' },
  { re: /(VERSION|BUILD|RELEASE)/i, hint: 'גרסה שונה – בדקו אם השינוי הרלוונטי פרוס בשתי הסביבות.' },
  { re: /(CACHE|TTL)/i, hint: 'מטמון שונה – עשוי להסביר נתונים "ישנים" בסביבה אחת.' },
  { re: /LOG/i, hint: 'רמת לוג שונה – בסביבה אחת אולי לא תראו את הראיה.' },
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE.test(key);
}

export function hintFor(key: string): string | undefined {
  return HINTS.find((h) => h.re.test(key))?.hint;
}

export function diffEnv(a: Map<string, string>, b: Map<string, string>): EnvDiffRow[] {
  const keys = [...new Set([...a.keys(), ...b.keys()])].sort();
  const order: Record<DiffStatus, number> = { different: 0, onlyA: 1, onlyB: 2, same: 3 };
  return keys
    .map((key) => {
      const av = a.get(key);
      const bv = b.get(key);
      const status: DiffStatus = av === undefined ? 'onlyB' : bv === undefined ? 'onlyA' : av === bv ? 'same' : 'different';
      return { key, a: av, b: bv, status, sensitive: isSensitiveKey(key), hint: status === 'same' ? undefined : hintFor(key) };
    })
    .sort((x, y) => order[x.status] - order[y.status] || x.key.localeCompare(y.key));
}

export function mask(v: string | undefined): string {
  if (v === undefined) return '—';
  if (v.length <= 4) return '••••';
  return `${v.slice(0, 2)}••••${v.slice(-2)}`;
}
