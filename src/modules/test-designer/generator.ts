/**
 * Deterministic API test-case generator. Template-based rules – NOT AI generated.
 * Same input always yields the same output.
 */
import type { EndpointSpec, FieldSpec, TestCase, TestCategory } from '../../types/testing';

type Value = string | number | boolean | null | Value[] | { [k: string]: Value };

export const CATEGORY_LABEL: Record<TestCategory, string> = {
  positive: 'חיובי',
  'missing-required': 'שדה חובה חסר',
  'invalid-type': 'טיפוס שגוי',
  'invalid-value': 'ערך לא מותר',
  'empty-null': 'ריק / null',
  boundary: 'ערכי גבול',
  'invalid-method': 'שיטה לא מותרת',
  auth: 'אימות והרשאות',
  'content-type': 'Content-Type',
  duplicate: 'בקשה כפולה',
  'error-handling': 'טיפול בשגיאות',
};

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

export function hasBody(spec: Pick<EndpointSpec, 'method'>): boolean {
  return BODY_METHODS.has(spec.method);
}

/** A representative valid value for a field, respecting its constraints. */
export function validValue(f: FieldSpec): Value {
  if (f.example !== undefined && f.example !== '') {
    if (f.type === 'integer' || f.type === 'number') {
      const n = Number(f.example);
      if (!Number.isNaN(n)) return n;
    }
    if (f.type === 'boolean') return f.example === 'true';
    if (f.type !== 'array' && f.type !== 'object') return f.example;
  }
  switch (f.type) {
    case 'integer': {
      const lo = f.min ?? 1;
      const hi = f.max ?? Math.max(lo, 10);
      return Math.min(hi, Math.max(lo, Math.round((lo + hi) / 2)));
    }
    case 'number': {
      const lo = f.min ?? 1;
      const hi = f.max ?? Math.max(lo, 100);
      return Math.round(((lo + hi) / 2) * 100) / 100;
    }
    case 'boolean':
      return true;
    case 'enum':
      return f.allowed?.[0] ?? 'VALUE';
    case 'email':
      return 'demo.user@example.com';
    case 'date':
      return '2026-10-13';
    case 'array':
      return Array.from({ length: Math.max(1, f.min ?? 1) }, (_, i) => `item-${i + 1}`);
    case 'object':
      return { key: 'value' };
    default: {
      const base = `demo-${f.name}`;
      const minL = f.min ?? 1;
      const maxL = f.max ?? 40;
      let s = base;
      while (s.length < minL) s += 'x';
      return s.slice(0, Math.max(minL, Math.min(maxL, s.length)));
    }
  }
}

function wrongTypeValue(f: FieldSpec): Value {
  switch (f.type) {
    case 'integer':
    case 'number':
      return 'abc';
    case 'boolean':
      return 'yes';
    case 'array':
    case 'object':
      return 'not-a-structure';
    default:
      return 12345;
  }
}

function typeLabel(v: Value): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'מערך';
  return { string: 'מחרוזת', number: 'מספר', boolean: 'בוליאני', object: 'אובייקט' }[typeof v as 'string'] ?? typeof v;
}

export function validPayload(spec: EndpointSpec, includeOptional = true): Record<string, Value> {
  const out: Record<string, Value> = {};
  for (const f of spec.fields) if (f.required || includeOptional) out[f.name] = validValue(f);
  return out;
}

function render(spec: EndpointSpec, data: Record<string, Value> | null, raw?: string): string {
  if (raw !== undefined) return raw;
  if (data === null) return '—';
  if (hasBody(spec)) return JSON.stringify(data, null, 2);
  const qs = Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v === null ? 'null' : typeof v === 'object' ? JSON.stringify(v) : String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '(ללא פרמטרים)';
}

function strOfLength(n: number): string {
  return 'a'.repeat(Math.max(0, n));
}

export function generateTestCases(spec: EndpointSpec): TestCase[] {
  const cases: Omit<TestCase, 'id'>[] = [];
  const target = `${spec.method} ${spec.path}`;
  const where = hasBody(spec) ? 'בגוף הבקשה' : 'בפרמטרי ה-query';
  const authPre = spec.authRequired ? ['משתמש בדיקה בדוי בעל הרשאה מתאימה וטוקן בתוקף'] : [];
  const basePre = ['סביבת בדיקה זמינה', ...authPre];
  const sendSteps = (extra?: string) => [
    `הכינו בקשת ${target}${hasBody(spec) ? ' עם Content-Type: application/json' : ''}${spec.authRequired ? ' וכותרת Authorization תקפה' : ''}`,
    `השתמשו בנתוני הבדיקה ${where}${extra ? ` (${extra})` : ''}`,
    'שלחו את הבקשה ותעדו סטטוס, גוף, כותרות ו-Correlation ID',
  ];
  const validationExpected = (detail: string) =>
    `סטטוס ${spec.validationStatus}; גוף השגיאה מציין ${detail}; לא נוצר/השתנה מידע במערכת`;

  // ---------- Positive ----------
  cases.push({
    category: 'positive',
    title: 'בקשה תקינה עם כל השדות',
    priority: 'High',
    preconditions: basePre,
    testData: render(spec, validPayload(spec, true)),
    steps: sendSteps(),
    expected: `סטטוס ${spec.successStatus}; מבנה התגובה תואם לחוזה${spec.successStatus === 201 ? '; כותרת Location מצביעה על המשאב החדש' : ''}`,
  });
  if (spec.fields.some((f) => !f.required)) {
    cases.push({
      category: 'positive',
      title: 'בקשה תקינה עם שדות חובה בלבד',
      priority: 'High',
      preconditions: basePre,
      testData: render(spec, validPayload(spec, false)),
      steps: sendSteps('ללא שדות אופציונליים'),
      expected: `סטטוס ${spec.successStatus}; שדות אופציונליים מקבלים ערך ברירת מחדל לפי החוזה`,
    });
  }

  // ---------- Missing required ----------
  for (const f of spec.fields.filter((x) => x.required)) {
    const d = validPayload(spec, true);
    delete d[f.name];
    cases.push({
      category: 'missing-required',
      title: `שדה חובה חסר: ${f.name}`,
      priority: 'High',
      preconditions: basePre,
      testData: render(spec, d),
      steps: sendSteps(`השמיטו לגמרי את ${f.name}`),
      expected: validationExpected(`ש-${f.name} חסר`),
    });
  }

  // ---------- Invalid types ----------
  for (const f of spec.fields) {
    const bad = wrongTypeValue(f);
    cases.push({
      category: 'invalid-type',
      title: `טיפוס שגוי: ${f.name} כ${typeLabel(bad)}`,
      priority: 'Medium',
      preconditions: basePre,
      testData: render(spec, { ...validPayload(spec, true), [f.name]: bad }),
      steps: sendSteps(`${f.name} = ${JSON.stringify(bad)}`),
      expected: validationExpected(`טיפוס שגוי ב-${f.name} (צפוי ${f.type})`),
    });
  }

  // ---------- Invalid values ----------
  for (const f of spec.fields.filter((x) => x.type === 'enum' && x.allowed?.length)) {
    cases.push({
      category: 'invalid-value',
      title: `ערך שאינו ברשימה המותרת: ${f.name}`,
      priority: 'Medium',
      preconditions: basePre,
      testData: render(spec, { ...validPayload(spec, true), [f.name]: 'NOT_ALLOWED' }),
      steps: sendSteps(`ערכים מותרים: ${f.allowed!.join(', ')}`),
      expected: validationExpected(`ערך לא מותר ב-${f.name}`),
    });
    const first = f.allowed![0];
    const flipped = first === first.toUpperCase() ? first.toLowerCase() : first.toUpperCase();
    if (flipped !== first) {
      cases.push({
        category: 'invalid-value',
        title: `רגישות לרישיות: ${f.name} = "${flipped}"`,
        priority: 'Low',
        preconditions: basePre,
        testData: render(spec, { ...validPayload(spec, true), [f.name]: flipped }),
        steps: sendSteps('אותו ערך ברישיות שונה'),
        expected: `התנהגות לפי החוזה: אם הערכים רגישים לרישיות – ${spec.validationStatus}; אחרת ${spec.successStatus}. יש לאמת מול החוזה ולתעד.`,
      });
    }
  }
  for (const f of spec.fields.filter((x) => x.type === 'email' || x.type === 'date')) {
    const bad = f.type === 'email' ? 'not-an-email' : '13/10/2026';
    cases.push({
      category: 'invalid-value',
      title: `פורמט שגוי: ${f.name}`,
      priority: 'Medium',
      preconditions: basePre,
      testData: render(spec, { ...validPayload(spec, true), [f.name]: bad }),
      steps: sendSteps(f.type === 'date' ? 'פורמט תאריך שאינו ISO 8601' : 'כתובת ללא @ ודומיין'),
      expected: validationExpected(`פורמט לא תקין ב-${f.name}`),
    });
  }

  // ---------- Empty / null ----------
  for (const f of spec.fields) {
    if (f.type === 'string' || f.type === 'email') {
      cases.push({
        category: 'empty-null',
        title: `מחרוזת ריקה: ${f.name}`,
        priority: 'Medium',
        preconditions: basePre,
        testData: render(spec, { ...validPayload(spec, true), [f.name]: '' }),
        steps: sendSteps(`${f.name} = ""`),
        expected: f.required || (f.min ?? 0) > 0 ? validationExpected(`ש-${f.name} ריק`) : `התנהגות לפי החוזה – לתעד אם "" נשמר כערך או נדחה`,
      });
    }
    if (f.type === 'array') {
      cases.push({
        category: 'empty-null',
        title: `מערך ריק: ${f.name}`,
        priority: 'Medium',
        preconditions: basePre,
        testData: render(spec, { ...validPayload(spec, true), [f.name]: [] }),
        steps: sendSteps(`${f.name} = []`),
        expected: (f.min ?? 0) > 0 || f.required ? validationExpected(`ש-${f.name} ריק`) : `סטטוס ${spec.successStatus} – מערך ריק מותר`,
      });
    }
    cases.push({
      category: 'empty-null',
      title: `ערך null: ${f.name}`,
      priority: f.required ? 'Medium' : 'Low',
      preconditions: basePre,
      testData: render(spec, { ...validPayload(spec, true), [f.name]: null }),
      steps: sendSteps(`${f.name} = null`),
      expected: f.nullable ? `סטטוס ${spec.successStatus} – השדה מוגדר nullable` : f.required ? validationExpected(`ש-${f.name} אינו יכול להיות null`) : `לפי החוזה: שדה שאינו nullable צפוי להידחות ב-${spec.validationStatus}. לאמת ולתעד – null אינו זהה להשמטת השדה.`,
    });
  }

  // ---------- Boundaries ----------
  for (const f of spec.fields) {
    const numeric = f.type === 'integer' || f.type === 'number';
    const lengthBased = f.type === 'string' || f.type === 'array';
    if (!numeric && !lengthBased) continue;
    const unit = numeric ? '' : f.type === 'array' ? ' פריטים' : ' תווים';
    const make = (n: number): Value => (numeric ? n : f.type === 'array' ? Array.from({ length: n }, (_, i) => `item-${i + 1}`) : strOfLength(n));
    const step = f.type === 'number' ? 0.01 : 1;
    const fmt = (n: number) => (f.type === 'number' ? Math.round(n * 100) / 100 : n);
    const points: Array<{ n: number; ok: boolean; label: string }> = [];
    if (f.min !== undefined) {
      points.push({ n: fmt(f.min - step), ok: false, label: 'מתחת למינימום' }, { n: f.min, ok: true, label: 'בדיוק המינימום' });
    }
    if (f.max !== undefined) {
      points.push({ n: f.max, ok: true, label: 'בדיוק המקסימום' }, { n: fmt(f.max + step), ok: false, label: 'מעל המקסימום' });
    }
    for (const p of points) {
      if (lengthBased && p.n < 0) continue;
      cases.push({
        category: 'boundary',
        title: `גבול ${f.name}: ${p.label} (${p.n}${unit})`,
        priority: p.ok ? 'Medium' : 'High',
        preconditions: basePre,
        testData: render(spec, { ...validPayload(spec, true), [f.name]: make(p.n) }),
        steps: sendSteps(`${f.name} ${numeric ? '=' : 'באורך'} ${p.n}${unit}`),
        expected: p.ok ? `סטטוס ${spec.successStatus} – ערך הגבול כלול בטווח` : validationExpected(`חריגה מהטווח ב-${f.name}`),
      });
    }
  }

  // ---------- Invalid method ----------
  const alt = spec.method === 'GET' ? 'DELETE' : spec.method === 'DELETE' ? 'PATCH' : spec.method === 'PATCH' ? 'PUT' : 'PATCH';
  cases.push({
    category: 'invalid-method',
    title: `שיטה לא נתמכת: ${alt} ${spec.path}`,
    priority: 'Low',
    preconditions: [...basePre, `החוזה אינו מגדיר ${alt} עבור ${spec.path}`],
    testData: '—',
    steps: [`שלחו ${alt} לאותו נתיב`, 'בדקו סטטוס וכותרות'],
    expected: 'סטטוס 405; כותרת Allow מפרטת את השיטות המותרות; אין שינוי בנתונים',
  });

  // ---------- Auth ----------
  if (spec.authRequired) {
    const data = render(spec, validPayload(spec, true));
    cases.push(
      { category: 'auth', title: 'ללא כותרת Authorization', priority: 'High', preconditions: ['סביבת בדיקה זמינה'], testData: data, steps: ['שלחו בקשה תקינה ללא כותרת Authorization'], expected: 'סטטוס 401; כותרת WWW-Authenticate; אין חשיפת מידע בגוף התגובה' },
      { category: 'auth', title: 'טוקן שפג תוקפו / לא תקין', priority: 'High', preconditions: ['טוקן בדוי שפג תוקפו'], testData: data, steps: ['שלחו בקשה תקינה עם טוקן שפג תוקפו'], expected: 'סטטוס 401 עם error="invalid_token" (או מקבילה לפי החוזה)' },
      { category: 'auth', title: 'משתמש ללא הרשאה מתאימה', priority: 'High', preconditions: ['משתמש בדיקה מאומת ללא ה-role הנדרש'], testData: data, steps: ['שלחו בקשה תקינה עם טוקן של משתמש ללא הרשאה'], expected: 'סטטוס 403; הפעולה לא בוצעה' },
    );
  }

  // ---------- Content-Type ----------
  if (hasBody(spec)) {
    const valid = JSON.stringify(validPayload(spec, true), null, 2);
    cases.push(
      { category: 'content-type', title: 'ללא כותרת Content-Type', priority: 'Medium', preconditions: basePre, testData: valid, steps: ['שלחו גוף JSON תקין ללא כותרת Content-Type'], expected: 'סטטוס 415 (או 400 לפי החוזה); הבקשה לא עובדה' },
      { category: 'content-type', title: 'Content-Type: text/plain', priority: 'Medium', preconditions: basePre, testData: valid, steps: ['שלחו גוף JSON תקין עם Content-Type: text/plain'], expected: 'סטטוס 415; הודעה מציינת את הפורמט הנתמך' },
      { category: 'content-type', title: 'גוף JSON לא תקין תחבירית', priority: 'Medium', preconditions: basePre, testData: valid.replace(/\n}$/, ',\n}'), steps: ['שלחו גוף עם פסיק מיותר לפני }'], expected: 'סטטוס 400; שגיאת פענוח ברורה, ללא stack trace' },
    );
  }

  // ---------- Duplicate ----------
  const uniqueFields = spec.fields.filter((f) => f.unique);
  if (spec.duplicateCheck || uniqueFields.length) {
    cases.push({
      category: 'duplicate',
      title: uniqueFields.length ? `ערך כפול בשדה ייחודי: ${uniqueFields.map((f) => f.name).join(', ')}` : 'שליחה כפולה של אותה בקשה',
      priority: 'High',
      preconditions: basePre,
      testData: render(spec, validPayload(spec, true)),
      steps: ['שלחו את הבקשה התקינה', 'שלחו שוב בדיוק את אותה בקשה', 'בדקו (בקריאה בלבד) כמה רשומות נוצרו'],
      expected: 'הבקשה הראשונה מצליחה; השנייה מחזירה 409 (או תשובה אידמפוטנטית לפי החוזה); לא נוצרת רשומה כפולה',
    });
  }

  // ---------- Error handling ----------
  cases.push({
    category: 'error-handling',
    title: 'מבנה תגובת שגיאה עקבי ובטוח',
    priority: 'Low',
    preconditions: basePre,
    testData: '(כל אחד ממקרי השגיאה לעיל)',
    steps: ['הריצו מקרה שגיאה כלשהו', 'בדקו את מבנה גוף השגיאה וכותרותיה'],
    expected: 'פורמט שגיאה אחיד לפי החוזה (למשל problem+json); כולל Correlation ID; ללא stack trace, SQL או נתיבי שרת',
  });
  if (hasBody(spec)) {
    cases.push({
      category: 'error-handling',
      title: 'שדה לא מוכר בגוף הבקשה',
      priority: 'Low',
      preconditions: basePre,
      testData: render(spec, { ...validPayload(spec, true), unexpectedField: 'demo' }),
      steps: sendSteps('הוסיפו שדה שאינו מוגדר בחוזה'),
      expected: `לפי החוזה: נדחה ב-${spec.validationStatus} (additionalProperties: false) או מתעלמים ממנו – לאמת ולתעד`,
    });
  }

  const slug = spec.path.replace(/[{}]/g, '').split('/').filter(Boolean).pop()?.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'API';
  return cases.map((c, i) => ({ id: `TC-${spec.method}-${slug}-${String(i + 1).padStart(3, '0')}`, ...c }));
}

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

/** CSV with UTF-8 BOM so Excel renders Hebrew correctly. */
export function toCsv(cases: TestCase[]): string {
  const header = ['ID', 'Category', 'Title', 'Priority', 'Preconditions', 'Test Data', 'Steps', 'Expected Result'];
  const rows = cases.map((c) =>
    [c.id, CATEGORY_LABEL[c.category], c.title, c.priority, c.preconditions.join('\n'), c.testData, c.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'), c.expected].map(csvCell).join(','),
  );
  return '﻿' + [header.map(csvCell).join(','), ...rows].join('\r\n');
}

export function toText(cases: TestCase[]): string {
  return cases
    .map((c) =>
      [
        `${c.id} · ${c.title}`,
        `קטגוריה: ${CATEGORY_LABEL[c.category]} | עדיפות: ${c.priority}`,
        `תנאים מקדימים: ${c.preconditions.join('; ')}`,
        `נתוני בדיקה:\n${c.testData}`,
        `צעדים:\n${c.steps.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`,
        `תוצאה צפויה: ${c.expected}`,
      ].join('\n'),
    )
    .join('\n\n' + '-'.repeat(40) + '\n\n');
}
