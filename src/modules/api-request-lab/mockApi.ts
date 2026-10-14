/**
 * Deterministic, in-browser mock of the fictional Demo Shop API (https://api.example.com/v1).
 * NO network requests are ever made. Every response is computed from the input by fixed rules.
 */
import type { HttpMethod } from '../../data/http';
import { STATUS_INFO } from '../../data/http';
import { CREATE_ORDER_SCHEMA } from '../../data/contracts';
import { validate } from '../../utils/schemaValidator';
import { parseJson, type JsonValue } from '../../utils/json';

export const MOCK_HOST = 'api.example.com';
export const MOCK_BASE = `https://${MOCK_HOST}/v1`;

export interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

export type AuthMode = 'none' | 'customer' | 'admin' | 'expired' | 'malformed';

export const AUTH_MODES: Record<AuthMode, { label: string; header?: string }> = {
  none: { label: 'ללא אימות' },
  customer: { label: 'לקוח בדוי (customer)', header: 'Bearer demo-customer-token' },
  admin: { label: 'מנהל בדוי (admin)', header: 'Bearer demo-admin-token' },
  expired: { label: 'טוקן שפג תוקפו (בדוי)', header: 'Bearer demo-expired-token' },
  malformed: { label: 'כותרת בפורמט שגוי', header: 'demo-customer-token' },
};

export interface MockRequest {
  method: HttpMethod;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  body: string;
  auth: AuthMode;
}

export interface Explanation {
  summary: string;
  details: string[];
  nextChecks: string[];
  notProof?: string;
}

export interface MockResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  /** Simulated – derived deterministically from the request, not measured. */
  timeMs: number;
  sizeBytes: number;
  rule: string;
  explanation: Explanation;
  networkError?: string;
}

// ---------------------------------------------------------------------------
// Fictional data
// ---------------------------------------------------------------------------

type Product = {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  currency: 'ILS';
  stock: number;
  status: 'active' | 'discontinued';
  tags: string[];
};

export const PRODUCTS: Product[] = [
  { id: 1001, sku: 'SKU-DS-1001', name: 'Aurora Desk Lamp', category: 'lighting', price: 49.9, currency: 'ILS', stock: 34, status: 'active', tags: ['desk', 'led'] },
  { id: 1002, sku: 'SKU-DS-1002', name: 'Nimbus Wireless Mouse', category: 'accessories', price: 89, currency: 'ILS', stock: 0, status: 'active', tags: ['wireless'] },
  { id: 1003, sku: 'SKU-DS-1003', name: 'Cedar Notebook Set', category: 'stationery', price: 24.5, currency: 'ILS', stock: 120, status: 'discontinued', tags: ['paper'] },
  { id: 1004, sku: 'SKU-DS-1004', name: 'Pulse Water Bottle', category: 'lifestyle', price: 39, currency: 'ILS', stock: 8, status: 'active', tags: ['steel'] },
  { id: 1005, sku: 'SKU-DS-1005', name: 'Orbit USB-C Hub', category: 'electronics', price: 149, currency: 'ILS', stock: 15, status: 'active', tags: ['usb-c', 'hub'] },
];

const ORDERS = [
  { orderId: 'ORD-50017', customerId: 'CUS-1001', status: 'paid', items: [{ sku: 'SKU-DS-1001', quantity: 3, unitPrice: 49.9 }], total: 149.7, currency: 'ILS', createdAt: '2026-10-01T09:30:00Z' },
  { orderId: 'ORD-50018', customerId: 'CUS-1002', status: 'shipped', items: [{ sku: 'SKU-DS-1005', quantity: 1, unitPrice: 149 }], total: 149, currency: 'ILS', createdAt: '2026-10-02T14:05:00Z' },
];

const TOKENS: Record<string, { sub: string; role: 'customer' | 'admin' } | 'expired'> = {
  'demo-customer-token': { sub: 'CUS-1001', role: 'customer' },
  'demo-admin-token': { sub: 'ADM-0001', role: 'admin' },
  'demo-expired-token': 'expired',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function utf8Size(s: string): number {
  return new TextEncoder().encode(s).length;
}

/** Merges enabled header rows and the auth mode into the effective header map (case-insensitive keys). */
export function effectiveHeaders(req: Pick<MockRequest, 'headers' | 'auth'>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const h of req.headers) if (h.enabled && h.key.trim()) out[h.key.trim().toLowerCase()] = h.value;
  const auth = AUTH_MODES[req.auth].header;
  if (auth && !out.authorization) out.authorization = auth;
  return out;
}

export function buildUrl(url: string, params: KeyValue[]): string {
  const active = params.filter((p) => p.enabled && p.key.trim());
  if (active.length === 0) return url;
  const qs = active.map((p) => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value)}`).join('&');
  return url + (url.includes('?') ? '&' : '?') + qs;
}

const HEADER_CASE: Record<string, string> = {
  'content-type': 'Content-Type',
  authorization: 'Authorization',
  accept: 'Accept',
  'idempotency-key': 'Idempotency-Key',
  'x-demo-simulate': 'X-Demo-Simulate',
  'x-request-id': 'X-Request-Id',
};

export function displayHeader(k: string): string {
  return HEADER_CASE[k] ?? k.replace(/(^|-)([a-z])/g, (_m, d: string, c: string) => d + c.toUpperCase());
}


export function toRawHttp(req: MockRequest): string {
  const full = buildUrl(req.url, req.params);
  let path = full;
  let host = MOCK_HOST;
  try {
    const u = new URL(full);
    path = u.pathname + u.search;
    host = u.host;
  } catch {
    /* keep raw */
  }
  const headers = effectiveHeaders(req);
  const lines = [`${req.method} ${path} HTTP/1.1`, `Host: ${host}`];
  for (const [k, v] of Object.entries(headers)) lines.push(`${displayHeader(k)}: ${v}`);
  const hasBody = req.body.trim() && !['GET', 'HEAD'].includes(req.method);
  return lines.join('\n') + (hasBody ? `\n\n${req.body}` : '');
}

export function toCurl(req: MockRequest): string {
  const full = buildUrl(req.url, req.params);
  const parts = [`curl -X ${req.method} '${full}'`];
  for (const [k, v] of Object.entries(effectiveHeaders(req))) parts.push(`  -H '${displayHeader(k)}: ${v.replace(/'/g, "'\\''")}'`);
  if (req.body.trim() && !['GET', 'HEAD'].includes(req.method)) parts.push(`  --data-raw '${req.body.replace(/'/g, "'\\''")}'`);
  return parts.join(' \\\n');
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

interface Ctx {
  req: MockRequest;
  headers: Record<string, string>;
  path: string;
  query: URLSearchParams;
  correlationId: string;
}

type Result = Omit<MockResponse, 'timeMs' | 'sizeBytes' | 'statusText'> & { latency?: number };

function json(status: number, body: JsonValue | null, rule: string, explanation: Explanation, extraHeaders: Record<string, string> = {}, c?: Ctx): Result {
  const isProblem = status >= 400;
  const headers: Record<string, string> = {
    ...(body !== null ? { 'Content-Type': isProblem ? 'application/problem+json' : 'application/json; charset=utf-8' } : {}),
    'X-Correlation-Id': c?.correlationId ?? 'demo-0000',
    'X-Simulated': 'true',
    ...extraHeaders,
  };
  return { status, headers, body: body === null ? '' : JSON.stringify(body, null, 2), rule, explanation };
}

function problem(status: number, title: string, detail: string, c: Ctx, extra: Record<string, JsonValue> = {}): JsonValue {
  return { type: `https://api.example.com/problems/${title.toLowerCase().replace(/[^a-z]+/g, '-')}`, title, status, detail, traceId: c.correlationId, ...extra };
}

type Principal = { sub: string; role: 'customer' | 'admin' };

function authenticate(c: Ctx): { ok: true; principal: Principal } | { ok: false; result: Result } {
  const raw = c.headers.authorization;
  if (!raw) {
    return {
      ok: false,
      result: json(401, problem(401, 'Unauthorized', 'Authentication is required for this endpoint', c), 'auth.missing', {
        summary: 'ה-endpoint מוגן, והבקשה נשלחה ללא כותרת Authorization.',
        details: ['401 עוסק באימות זהות – השרת לא קיבל הוכחת זהות.', 'כותרת WWW-Authenticate מצביעה על סוג האימות הנדרש (Bearer).'],
        nextChecks: ['בחרו מצב אימות "לקוח בדוי" ושלחו שוב.', 'באפליקציה אמיתית: בדקו שה-interceptor מצרף את הטוקן לבקשה זו.'],
        notProof: 'זה לא אומר שלמשתמש אין הרשאה – רק שלא הוצגה זהות.',
      }, { 'WWW-Authenticate': 'Bearer realm="demo-shop"' }, c),
    };
  }
  const m = raw.match(/^Bearer\s+(\S+)$/);
  if (!m) {
    return {
      ok: false,
      result: json(401, problem(401, 'Unauthorized', 'Authorization header must use the Bearer scheme', c), 'auth.malformed', {
        summary: 'כותרת Authorization קיימת אך אינה בפורמט Bearer <token>.',
        details: [`התקבל: "${raw.slice(0, 40)}"`, 'חסרה המילה Bearer או שיש תווים מיותרים.'],
        nextChecks: ['תקנו לפורמט: Authorization: Bearer <token>', 'ב-Postman השתמשו בלשונית Authorization במקום כותרת ידנית.'],
      }, { 'WWW-Authenticate': 'Bearer error="invalid_request"' }, c),
    };
  }
  const t = TOKENS[m[1]];
  if (t === 'expired') {
    return {
      ok: false,
      result: json(401, problem(401, 'Unauthorized', 'The access token expired', c), 'auth.expired', {
        summary: 'הטוקן מזוהה אך פג תוקפו (בסימולציה).',
        details: ['WWW-Authenticate: error="invalid_token" מציין טוקן לא תקף.', 'תרחיש נפוץ: טוקן שהועתק ל-Postman לפני שעות.'],
        nextChecks: ['הנפיקו טוקן חדש (בחרו "לקוח בדוי").', 'בדקו את ה-claim exp בכלי מקומי – לא באתר חיצוני.'],
        notProof: 'שגיאה זו אינה מעידה על תקלה בשרת האימות.',
      }, { 'WWW-Authenticate': 'Bearer error="invalid_token", error_description="The access token expired"' }, c),
    };
  }
  if (!t) {
    return {
      ok: false,
      result: json(401, problem(401, 'Unauthorized', 'Unknown or revoked token', c), 'auth.unknown', {
        summary: 'הטוקן אינו מוכר לשרת המדומה.',
        details: ['טוקנים בדויים מוכרים: demo-customer-token, demo-admin-token, demo-expired-token.'],
        nextChecks: ['השתמשו בתפריט מצב האימות.', 'במערכת אמיתית: בדקו שהטוקן הונפק לאותה סביבה (aud/iss).'],
      }, { 'WWW-Authenticate': 'Bearer error="invalid_token"' }, c),
    };
  }
  return { ok: true, principal: t };
}

function forbidden(c: Ctx, detail: string, explanation: Explanation): Result {
  return json(403, problem(403, 'Forbidden', detail, c), 'auth.forbidden', explanation, {}, c);
}

function methodNotAllowed(c: Ctx, allow: string[]): Result {
  return json(405, problem(405, 'Method Not Allowed', `${c.req.method} is not supported on ${c.path}`, c), 'route.method', {
    summary: `הנתיב ${c.path} קיים, אך השיטה ${c.req.method} אינה נתמכת בו.`,
    details: [`כותרת Allow מפרטת את השיטות המותרות: ${allow.join(', ')}.`, 'בדקו אם התכוונתם לרמת collection או לפריט בודד.'],
    nextChecks: ['החליפו שיטה לפי Allow.', 'בדקו את התיעוד לגבי הנתיב והשיטה.'],
  }, { Allow: allow.join(', ') }, c);
}

function requireJson(c: Ctx): Result | { data: JsonValue } {
  const ct = (c.headers['content-type'] ?? '').toLowerCase();
  if (!ct.startsWith('application/json')) {
    return json(415, problem(415, 'Unsupported Media Type', 'Expected Content-Type: application/json', c), 'body.content-type', {
      summary: ct ? `נשלח Content-Type: ${ct}, אך ה-endpoint מקבל רק application/json.` : 'לא נשלחה כותרת Content-Type, וה-endpoint דורש application/json.',
      details: ['השרת בוחר את אופן פענוח הגוף לפי Content-Type – עוד לפני שהוא קורא אותו.', 'גם גוף JSON תקין יידחה אם הכותרת שגויה.'],
      nextChecks: ['הוסיפו כותרת Content-Type: application/json.', 'ב-Postman: Body ← raw ← JSON.'],
      notProof: 'זה לא אומר שגוף הבקשה שגוי.',
    }, { 'Accept-Post': 'application/json' }, c);
  }
  const parsed = parseJson(c.req.body);
  if (!parsed.ok) {
    return json(400, problem(400, 'Malformed request body', parsed.error.line ? `Invalid JSON at line ${parsed.error.line}, column ${parsed.error.column}` : 'Request body is not valid JSON', c), 'body.malformed', {
      summary: 'גוף הבקשה אינו JSON תקין, ולכן לא ניתן לפענח אותו.',
      details: [parsed.error.message, ...(parsed.error.line ? [`מיקום משוער: שורה ${parsed.error.line}, עמודה ${parsed.error.column}.`] : [])],
      nextChecks: ['בדקו את הגוף ב-JSON Studio.', 'בררו מי יצר את הגוף (UI, סקריפט, העתקה ידנית).'],
      notProof: 'השגיאה לא אומרת אם השדות עצמם תואמים לחוזה – הפענוח נכשל לפני כן.',
    }, {}, c);
  }
  return { data: parsed.value };
}

function isResult(x: Result | { data: JsonValue }): x is Result {
  return (x as Result).status !== undefined;
}

function route(c: Ctx): Result {
  const { req, path, query } = c;
  const segs = path.split('/').filter(Boolean); // ['v1', 'products', '1001']

  if (segs[0] !== 'v1') {
    return json(404, problem(404, 'Not Found', `No route for ${path}`, c), 'route.version', {
      summary: segs[0]?.startsWith('v') ? `גרסת ה-API "${segs[0]}" אינה קיימת – ה-base path הנכון הוא /v1.` : 'הנתיב חסר את קידומת הגרסה /v1.',
      details: ['זהו 404 ברמת ניתוב: השרת לא מצא נתיב מתאים, עוד לפני חיפוש משאב.'],
      nextChecks: ['תקנו את ה-base path ל-https://api.example.com/v1.', 'השוו את ה-URL לתיעוד תו-בתו.'],
    }, {}, c);
  }

  if (req.method === 'OPTIONS') {
    return json(204, null, 'cors.preflight', {
      summary: 'בקשת OPTIONS (Preflight) – השרת המדומה מצהיר על שיטות וכותרות מותרות.',
      details: ['דפדפנים שולחים OPTIONS לפני בקשות "לא פשוטות" בין Origins.', 'Postman אינו שולח Preflight אוטומטית.'],
      nextChecks: ['השוו את Access-Control-Allow-Origin ל-Origin של האפליקציה.'],
    }, {
      Allow: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Origin': 'https://shop.example.com',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key',
    }, c);
  }

  const resource = segs[1];
  const id = segs[2];

  // ---- /v1/health
  if (resource === 'health' && segs.length === 2) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return methodNotAllowed(c, ['GET', 'HEAD']);
    return json(200, { status: 'ok', service: 'demo-shop-api', simulated: true }, 'health.ok', {
      summary: 'בדיקת בריאות מדומה הצליחה.',
      details: ['endpoint בריאות מראה שהשירות עונה – לא שכל היכולות והתלויות תקינות.'],
      nextChecks: ['המשיכו ל-endpoint הספציפי שמעניין אתכם.'],
    }, {}, c);
  }

  // ---- /v1/products
  if (resource === 'products' && !id) {
    if (req.method === 'GET' || req.method === 'HEAD') {
      const limitRaw = query.get('limit');
      const limit = limitRaw === null ? 20 : Number(limitRaw);
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        return json(400, problem(400, 'Invalid query parameter', 'limit must be an integer between 1 and 50', c, { errors: [{ param: 'limit', message: 'must be integer 1..50' }] }), 'products.limit', {
          summary: `פרמטר limit="${limitRaw}" אינו בטווח המותר (1–50).`,
          details: ['ה-400 נובע מפרמטר query, לא מגוף הבקשה.', 'זהו מקרה גבול קלאסי: נסו 0, 1, 50, 51.'],
          nextChecks: ['שלחו limit=50 ו-limit=51 כדי לאמת את הגבול.'],
        }, {}, c);
      }
      const cat = query.get('category');
      let list = PRODUCTS;
      if (cat) list = list.filter((p) => p.category === cat);
      const items = list.slice(0, limit);
      return json(200, { items, page: 1, limit, total: list.length }, 'products.list', {
        summary: `הוחזרו ${items.length} מוצרים${cat ? ` בקטגוריה ${cat}` : ''}.`,
        details: cat && items.length === 0 ? ['רשימה ריקה עם 200 היא תוצאה תקינה – לא שגיאה. הקטגוריה לא נמצאה או ריקה.'] : ['מבנה תגובה עם עימוד: items, page, limit, total.'],
        nextChecks: ['נסו ?category=lighting או ?limit=0 כדי לראות התנהגות שגיאה.'],
      }, {}, c);
    }
    if (req.method === 'POST') {
      const a = authenticate(c);
      if (!a.ok) return a.result;
      if (a.principal.role !== 'admin')
        return forbidden(c, "Role 'customer' cannot perform 'products:create'", {
          summary: 'הזהות אומתה (לקוח), אך אין לו הרשאה ליצור מוצרים.',
          details: ['זה 403 ולא 401: אימות מחדש עם אותו משתמש לא ישנה את התוצאה.'],
          nextChecks: ['בחרו מצב אימות "מנהל בדוי".'],
          notProof: '403 כאן הוא התנהגות רצויה לפי מדיניות ההרשאות המדומה.',
        });
      const body = requireJson(c);
      if (isResult(body)) return body;
      return json(201, { id: 1006, ...(body.data as object), status: 'active' }, 'products.create', {
        summary: 'מוצר נוצר (בסימולציה – שום דבר לא נשמר).',
        details: ['201 Created עם כותרת Location שמצביעה על המשאב החדש.'],
        nextChecks: ['בדקו את גוף התגובה מול סכמת Product ב-Contract Validator.'],
      }, { Location: `${MOCK_BASE}/products/1006` }, c);
    }
    return methodNotAllowed(c, ['GET', 'HEAD', 'POST']);
  }

  // ---- /v1/products/{id}
  if (resource === 'products' && id && segs.length === 3) {
    if (!/^\d+$/.test(id)) {
      return json(400, problem(400, 'Invalid path parameter', 'id must be numeric', c), 'products.bad-id', {
        summary: `מזהה המוצר "${id}" אינו מספרי.`,
        details: ['השרת המדומה מבחין בין מזהה בפורמט שגוי (400) למזהה תקין שלא קיים (404).', 'לא כל API עושה הבחנה זו – החוזה קובע.'],
        nextChecks: ['השתמשו במזהה מספרי, למשל 1001.'],
      }, {}, c);
    }
    const p = PRODUCTS.find((x) => x.id === Number(id));
    if (req.method === 'GET' || req.method === 'HEAD') {
      if (!p) {
        return json(404, problem(404, 'Product not found', `No product with id ${id}`, c), 'products.not-found', {
          summary: `הנתיב תקין, אך מוצר ${id} אינו קיים בנתוני הסביבה המדומה.`,
          details: ['זהו 404 ברמת משאב (לא ברמת ניתוב): גוף השגיאה בפורמט של השירות ומזכיר את ה-ID.', 'מזהים קיימים: 1001–1005.'],
          nextChecks: ['בדקו את רשימת המוצרים (GET /v1/products).', 'בררו מאיפה הגיע ה-ID (UI, נתוני בדיקה, סביבה אחרת).'],
          notProof: 'זה לא מוכיח שהמוצר לא קיים בשום סביבה – רק שאינו קיים כאן.',
        }, {}, c);
      }
      return json(200, p as unknown as JsonValue, 'products.get', {
        summary: `מוצר ${p.id} הוחזר בהצלחה.`,
        details: p.stock === 0 ? ['שימו לב: stock=0 – ניסיון להזמין אותו יחזיר 409.'] : p.status === 'discontinued' ? ['שימו לב: status=discontinued – ניסיון להזמין אותו יחזיר 422.'] : ['התגובה תואמת לסכמת Product.'],
        nextChecks: ['אמתו את התגובה מול הסכמה ב-Contract Validator.'],
      }, { ETag: `"p${p.id}-v3"` }, c);
    }
    if (['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const a = authenticate(c);
      if (!a.ok) return a.result;
      if (a.principal.role !== 'admin')
        return forbidden(c, `Role 'customer' cannot perform 'products:${req.method === 'DELETE' ? 'delete' : 'update'}'`, {
          summary: 'משתמש מסוג customer מנסה פעולת ניהול.',
          details: ['האימות הצליח – ההרשאה חסרה. זה ההבדל המהותי בין 401 ל-403.'],
          nextChecks: ['נסו עם "מנהל בדוי" כדי לוודא שהפעולה עצמה תקינה.'],
        });
      if (!p) return json(404, problem(404, 'Product not found', `No product with id ${id}`, c), 'products.not-found', { summary: `מוצר ${id} אינו קיים.`, details: [], nextChecks: ['השתמשו במזהה 1001–1005.'] }, {}, c);
      if (req.method === 'DELETE') return json(204, null, 'products.delete', { summary: 'המוצר "נמחק" (בסימולציה).', details: ['204 No Content: הצלחה ללא גוף תגובה – גוף ריק כאן תקין.'], nextChecks: ['במערכת אמיתית: אמתו שהמוצר לא מוחזר יותר ב-GET.'] }, {}, c);
      const body = requireJson(c);
      if (isResult(body)) return body;
      return json(200, { ...p, ...(body.data as object) } as JsonValue, 'products.update', { summary: 'המוצר עודכן (בסימולציה).', details: [], nextChecks: ['בצעו GET כדי לראות שהשינוי לא נשמר – זו סימולציה.'] }, {}, c);
    }
    return methodNotAllowed(c, ['GET', 'HEAD', 'PUT', 'PATCH', 'DELETE']);
  }

  // ---- /v1/orders
  if (resource === 'orders' && !id) {
    if (req.method === 'GET') {
      const a = authenticate(c);
      if (!a.ok) return a.result;
      const own = a.principal.role === 'admin' ? ORDERS : ORDERS.filter((o) => o.customerId === a.principal.sub);
      return json(200, { items: own, total: own.length } as unknown as JsonValue, 'orders.list', {
        summary: `הוחזרו ${own.length} הזמנות${a.principal.role === 'admin' ? ' (מנהל רואה הכל)' : ' של הלקוח המאומת בלבד'}.`,
        details: ['אותה בקשה מחזירה תוצאות שונות לפי זהות המשתמש – חשוב לזכור בהשוואות.'],
        nextChecks: ['השוו את התוצאה בין customer ל-admin.'],
      }, {}, c);
    }
    if (req.method === 'POST') {
      const a = authenticate(c);
      if (!a.ok) return a.result;
      const body = requireJson(c);
      if (isResult(body)) return body;
      const v = validate(body.data, CREATE_ORDER_SCHEMA);
      if (!v.valid) {
        return json(422, problem(422, 'Validation failed', 'The request body does not match the CreateOrder contract', c, { errors: v.errors.map((e) => ({ field: e.path.replace(/^\$\.?/, ''), rule: e.keyword, message: e.message })) }), 'orders.validation', {
          summary: `גוף הבקשה תקין תחבירית, אך נכשל ב-${v.errors.length} כללי ולידציה של החוזה.`,
          details: v.errors.slice(0, 6).map((e) => `${e.path}: ${e.message}`),
          nextChecks: ['בדקו כל שדה מול סכמת CreateOrderRequest ב-Contract Validator.', 'בררו מי בונה את הבקשה (UI / סקריפט).'],
          notProof: 'ב-Demo Shop ולידציה מחזירה 422. API אחר עשוי להחזיר 400 – החוזה קובע.',
        }, {}, c);
      }
      const data = body.data as { customerId: string; items: Array<{ sku: string; quantity: number }> };
      if (c.headers['idempotency-key'] === 'demo-dup-key') {
        return json(409, problem(409, 'Duplicate request', 'An order with this Idempotency-Key already exists', c, { existingOrderId: 'ORD-50017' }), 'orders.duplicate', {
          summary: 'Idempotency-Key כבר שימש ליצירת הזמנה – השרת מונע כפילות.',
          details: ['זו התנהגות מגינה ורצויה: retry לא ייצור הזמנה שנייה.'],
          nextChecks: ['בדקו אם הלקוח שולח פעמיים (לחיצה כפולה / retry).'],
          notProof: '409 כאן אינו באג – אלא אם הדרישה אומרת אחרת.',
        }, {}, c);
      }
      if (a.principal.role === 'customer' && data.customerId !== a.principal.sub) {
        return forbidden(c, 'Customers can only create orders for themselves', {
          summary: `הלקוח המאומת (${a.principal.sub}) מנסה ליצור הזמנה עבור ${data.customerId}.`,
          details: ['בדיקת בעלות (object-level authorization) – זהות תקינה, פעולה אסורה.'],
          nextChecks: ['השתמשו ב-customerId: "CUS-1001" עם הלקוח הבדוי.'],
        });
      }
      for (const it of data.items) {
        const p = PRODUCTS.find((x) => x.sku === it.sku);
        if (!p) {
          return json(422, problem(422, 'Validation failed', `Unknown SKU ${it.sku}`, c, { errors: [{ field: 'items[].sku', rule: 'exists', message: `SKU ${it.sku} not found` }] }), 'orders.unknown-sku', {
            summary: `המק"ט ${it.sku} תקין בפורמט אך אינו קיים בקטלוג.`,
            details: ['זו ולידציה עסקית (קיום), לא סכמטית – הסכמה לבדה לא תתפוס אותה.'],
            nextChecks: ['השתמשו ב-SKU-DS-1001 עד SKU-DS-1005.'],
          }, {}, c);
        }
        if (p.status === 'discontinued') {
          return json(422, problem(422, 'Validation failed', `Product ${p.sku} is discontinued`, c, { errors: [{ field: 'items[].sku', rule: 'active', message: 'product is not active' }] }), 'orders.discontinued', {
            summary: `המוצר ${p.sku} אינו פעיל (discontinued).`,
            details: ['כלל עסקי: לא ניתן להזמין מוצר שהופסק.', 'הבקשה עומדת בסכמה – הדחייה נובעת ממצב הנתונים.'],
            nextChecks: ['אמתו את סטטוס המוצר (GET /v1/products/1003).'],
          }, {}, c);
        }
        if (it.quantity > p.stock) {
          return json(409, problem(409, 'Insufficient stock', `Requested ${it.quantity} of ${p.sku}, available ${p.stock}`, c, { sku: p.sku, available: p.stock }), 'orders.stock', {
            summary: `הכמות המבוקשת (${it.quantity}) גדולה מהמלאי הזמין (${p.stock}).`,
            details: ['409 משקף התנגשות עם מצב המשאב (מלאי) – הבקשה עצמה תקינה.'],
            nextChecks: ['בדקו את המלאי (GET /v1/products/{id}).', 'בדקו אם נתוני הבדיקה עדכניים.'],
          }, {}, c);
        }
      }
      const total = Math.round(data.items.reduce((s, it) => s + it.quantity * PRODUCTS.find((p) => p.sku === it.sku)!.price, 0) * 100) / 100;
      const orderId = `ORD-${50100 + (hash(c.req.body) % 800)}`;
      return json(201, { orderId, customerId: data.customerId, status: 'pending', items: data.items.map((it) => ({ ...it, unitPrice: PRODUCTS.find((p) => p.sku === it.sku)!.price })), total, currency: 'ILS', createdAt: '2026-10-13T09:30:00Z' }, 'orders.create', {
        summary: `הזמנה ${orderId} נוצרה (בסימולציה – לא נשמרה).`,
        details: ['201 Created + כותרת Location.', 'total חושב מהמחירים בקטלוג המדומה.'],
        nextChecks: ['אמתו את התגובה מול סכמת Order.', 'נסו Idempotency-Key: demo-dup-key כדי לראות 409.'],
      }, { Location: `${MOCK_BASE}/orders/${orderId}` }, c);
    }
    return methodNotAllowed(c, ['GET', 'POST']);
  }

  // ---- /v1/orders/{id}
  if (resource === 'orders' && id && segs.length === 3) {
    if (req.method !== 'GET') return methodNotAllowed(c, ['GET']);
    const a = authenticate(c);
    if (!a.ok) return a.result;
    const o = ORDERS.find((x) => x.orderId === id);
    if (!o) return json(404, problem(404, 'Order not found', `No order ${id}`, c), 'orders.not-found', { summary: `הזמנה ${id} לא נמצאה.`, details: ['הזמנות קיימות: ORD-50017 (של CUS-1001), ORD-50018 (של CUS-1002).'], nextChecks: ['בדקו את המזהה ואת הסביבה.'] }, {}, c);
    if (a.principal.role === 'customer' && o.customerId !== a.principal.sub) {
      return forbidden(c, 'You do not have access to this order', {
        summary: `ההזמנה ${id} שייכת ללקוח אחר.`,
        details: ['בדיקת בעלות. חלק מה-APIs מחזירים כאן 404 כדי לא לחשוף קיום – ב-Demo Shop הוחלט על 403.'],
        nextChecks: ['נסו ORD-50017 (שייכת ללקוח הבדוי).'],
      });
    }
    return json(200, o as unknown as JsonValue, 'orders.get', { summary: `הזמנה ${id} הוחזרה.`, details: ['התגובה תואמת לסכמת Order.'], nextChecks: ['אמתו את התגובה ב-Contract Validator.'] }, {}, c);
  }

  // ---- /v1/me
  if (resource === 'me' && segs.length === 2) {
    if (req.method !== 'GET') return methodNotAllowed(c, ['GET']);
    const a = authenticate(c);
    if (!a.ok) return a.result;
    return json(200, { userId: a.principal.role === 'admin' ? 'CUS-0001' : a.principal.sub, email: a.principal.role === 'admin' ? 'demo.admin@example.com' : 'demo.buyer@example.com', displayName: a.principal.role === 'admin' ? 'Demo Admin' : 'Demo Buyer', role: a.principal.role, marketingOptIn: false, lastLoginAt: null }, 'me.get', {
      summary: 'פרופיל המשתמש המאומת (בדוי).',
      details: ['שימושי לאימות מהיר: "מי אני לפי הטוקן?"'],
      nextChecks: ['השוו role לפעולה שנכשלת ב-403.'],
    }, {}, c);
  }

  // ---- /v1/search
  if (resource === 'search' && segs.length === 2) {
    if (req.method !== 'GET') return methodNotAllowed(c, ['GET']);
    const q = query.get('q');
    if (q === null || q.trim() === '') {
      return json(400, problem(400, 'Missing query parameter', 'q is required', c, { errors: [{ param: 'q', message: 'is required' }] }), 'search.missing-q', {
        summary: 'פרמטר החובה q חסר או ריק.',
        details: ['400 על פרמטר query – בדקו שהפרמטר נוסף לטבלת Params ומסומן כפעיל.'],
        nextChecks: ['הוסיפו q=lamp.'],
      }, {}, c);
    }
    if (q === '*' || query.get('limit') === '100000') {
      return { ...json(504, null, 'search.timeout', {
        summary: 'סימולציה: חיפוש רחב מדי – ה-Gateway המדומה ויתר אחרי 30 שניות.',
        details: ['504 נוצר ברכיב ביניים. הוא מזהה מי ויתר – לא מי איטי.', 'הגוף הוא HTML של ה-Gateway, לא JSON של השירות.'],
        nextChecks: ['צמצמו את החיפוש.', 'במערכת אמיתית: בדקו trace לפירוק זמנים.'],
        notProof: 'זה לא מוכיח שמסד הנתונים איטי.',
      }, { Server: 'demo-gateway', 'Content-Type': 'text/html' }, c), body: '<html><body>504 Gateway Time-out</body></html>', latency: 30000 };
    }
    const term = q.toLowerCase();
    const items = PRODUCTS.filter((p) => p.name.toLowerCase().includes(term) || p.tags.some((t) => t.includes(term)));
    return json(200, { query: q, items: items.map(({ id, sku, name, price }) => ({ id, sku, name, price })) }, 'search.ok', {
      summary: `נמצאו ${items.length} תוצאות עבור "${q}".`,
      details: items.length === 0 ? ['אין תוצאות – וזו תשובה תקינה (200 עם מערך ריק).'] : ['חיפוש לפי שם ותגיות.'],
      nextChecks: ['נסו q=* כדי לראות 504 מדומה.'],
    }, {}, c);
  }

  // ---- /v1/reports/sales
  if (resource === 'reports' && segs[2] === 'sales' && segs.length === 3) {
    if (req.method !== 'GET') return methodNotAllowed(c, ['GET']);
    const a = authenticate(c);
    if (!a.ok) return a.result;
    if (a.principal.role !== 'admin') return forbidden(c, 'Reports require admin role', { summary: 'דוחות זמינים למנהלים בלבד.', details: [], nextChecks: ['בחרו "מנהל בדוי".'] });
    const from = query.get('from') ?? '2026-10-01';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      return json(500, { title: 'Internal Server Error', status: 500, traceId: c.correlationId }, 'reports.unhandled', {
        summary: 'סימולציה: תאריך בפורמט לא צפוי גרם לחריגה לא מטופלת בשירות.',
        details: [`from="${from}" לא נדחה בוולידציה והגיע לקוד שהניח פורמט YYYY-MM-DD.`, 'התגובה גנרית – הראיה האמיתית תהיה בלוג לפי traceId.'],
        nextChecks: ['חפשו את X-Correlation-Id בלוגים (בעולם האמיתי).', 'נסו from=2026-10-01 – אם עובד, הכשל תלוי קלט.'],
        notProof: '500 לא מוכיח שהבעיה בקוד הדוח – רק שהשירות נכשל. כאן, ה"לוג" המדומה מראה שזו בעיית טיפול בקלט.',
      }, {}, c);
    }
    return json(200, { from, currency: 'ILS', orders: 2, revenue: 298.7, simulated: true }, 'reports.ok', { summary: 'דוח מכירות מדומה.', details: [], nextChecks: ['נסו from=01/10/2026 כדי לראות 500 תלוי-קלט.'] }, {}, c);
  }

  // ---- /v1/recommendations
  if (resource === 'recommendations' && segs.length === 2) {
    return json(503, problem(503, 'Service Unavailable', 'Recommendation engine is in scheduled maintenance (simulated)', c), 'reco.maintenance', {
      summary: 'השירות המדומה בחלון תחזוקה.',
      details: ['Retry-After מציין מתי לנסות שוב.', '503 עשוי להיות מכוון – לא בהכרח "קריסה".'],
      nextChecks: ['בדקו הודעות תחזוקה / סטטוס.', 'ודאו שה-UI מטפל ב-503 בצורה ידידותית.'],
    }, { 'Retry-After': '120' }, c);
  }

  if (resource === 'cart' && segs.length === 2) {
    if (req.method !== 'GET') return methodNotAllowed(c, ['GET']);
    const a = authenticate(c);
    if (!a.ok) return a.result;
    return json(200, { customerId: a.principal.sub, items: [{ sku: 'SKU-DS-1004', quantity: 1 }], subtotal: 39 }, 'cart.get', { summary: 'עגלת קניות מדומה.', details: [], nextChecks: [] }, {}, c);
  }

  return json(404, problem(404, 'Not Found', `No route for ${req.method} ${path}`, c), 'route.unknown', {
    summary: `לא קיים נתיב ${path} ב-API המדומה.`,
    details: ['404 ברמת ניתוב – בדקו שם משאב (יחיד/רבים), איות וגרסה.', 'נתיבים זמינים: /health, /products, /products/{id}, /orders, /orders/{id}, /me, /cart, /search, /reports/sales, /recommendations.'],
    nextChecks: ['השוו את הנתיב לתיעוד.'],
  }, {}, c);
}

const SIMULATE: Record<string, { status: number; explanation: Explanation; headers?: Record<string, string>; body?: string; latency?: number }> = {
  '429': { status: 429, headers: { 'Retry-After': '30', 'RateLimit-Limit': '60', 'RateLimit-Remaining': '0' }, explanation: { summary: 'סימולציה: חריגה ממגבלת קצב.', details: ['RateLimit-Remaining: 0 ו-Retry-After מראים שהמכסה מוצתה.'], nextChecks: ['בדקו לולאות / retry בלקוח.', 'בררו אם המכסה משותפת.'] } },
  '500': { status: 500, explanation: { summary: 'סימולציה: כשל לא מטופל בשירות.', details: ['התגובה גנרית; הראיה תהיה בלוגים לפי ה-correlation ID.'], nextChecks: ['חפשו את ה-ID בלוגים.'], notProof: '500 אינו מזהה את שורש הבעיה.' } },
  '502': { status: 502, headers: { Server: 'demo-gateway', 'Content-Type': 'text/html' }, body: '<html><body>502 Bad Gateway</body></html>', explanation: { summary: 'סימולציה: ה-Gateway קיבל תגובה לא תקינה מה-upstream.', details: ['גוף HTML וכותרת Server של Gateway – התגובה לא הגיעה מהשירות.'], nextChecks: ['בדקו לוגי Gateway ובריאות השירות.'] } },
  '503': { status: 503, headers: { 'Retry-After': '60' }, explanation: { summary: 'סימולציה: השירות זמנית לא זמין.', details: ['ייתכן תחזוקה, עומס או היעדר מופעים בריאים.'], nextChecks: ['בדקו ניטור ומצב מופעים.'] } },
  '504': { status: 504, headers: { Server: 'demo-gateway', 'Content-Type': 'text/html' }, body: '<html><body>504 Gateway Time-out</body></html>', latency: 30000, explanation: { summary: 'סימולציה: ה-Gateway לא קיבל תגובה בזמן.', details: ['504 מזהה מי ויתר – לא מי איטי.'], nextChecks: ['בדקו פירוק זמנים ב-trace.'] } },
};

export function simulate(req: MockRequest): MockResponse {
  const full = buildUrl(req.url.trim(), req.params);
  const headers = effectiveHeaders(req);
  const seed = hash(`${req.method} ${full} ${req.body} ${JSON.stringify(headers)}`);
  const correlationId = `demo-${(seed % 0xffff).toString(16).padStart(4, '0')}-${(seed >>> 16).toString(16).slice(0, 4)}`;

  let url: URL;
  try {
    url = new URL(full);
  } catch {
    return finalize({
      status: 0,
      headers: {},
      body: '',
      rule: 'client.invalid-url',
      networkError: 'TypeError: Invalid URL',
      explanation: { summary: 'ה-URL אינו תקין – הבקשה לא נשלחה כלל.', details: ['ודאו שה-URL מתחיל ב-https:// וכולל שם מארח.'], nextChecks: [`השתמשו ב-${MOCK_BASE}/products`] },
    }, seed);
  }
  if (url.hostname !== MOCK_HOST) {
    return finalize({
      status: 0,
      headers: {},
      body: '',
      rule: 'network.dns',
      networkError: `getaddrinfo ENOTFOUND ${url.hostname} (simulated)`,
      explanation: {
        summary: `סימולציה: שם המארח "${url.hostname}" לא נפתר. במעבדה רק ${MOCK_HOST} "קיים".`,
        details: ['אין תגובת HTTP ואין קוד סטטוס – הבקשה לא יצאה.', 'המעבדה לעולם לא שולחת בקשות רשת אמיתיות, גם לא לכתובות אחרות.'],
        nextChecks: ['בדקו איות של שם המארח.', 'ראו את תרחיש DNS ב-API Doctor.'],
      },
    }, seed);
  }

  const c: Ctx = { req, headers, path: url.pathname.replace(/\/+$/, '') || '/', query: url.searchParams, correlationId };

  const sim = headers['x-demo-simulate'];
  if (sim && SIMULATE[sim]) {
    const s = SIMULATE[sim];
    const base = json(s.status, s.body ? null : (problem(s.status, STATUS_INFO[s.status].reason, 'Simulated via X-Demo-Simulate header', c) as JsonValue), `simulate.${sim}`, s.explanation, s.headers ?? {}, c);
    return finalize({ ...base, body: s.body ?? base.body, latency: s.latency }, seed);
  }
  if (sim === 'timeout') {
    return finalize({
      status: 0,
      headers: {},
      body: '',
      rule: 'simulate.timeout',
      networkError: 'ESOCKETTIMEDOUT – no response within 30000 ms (simulated)',
      latency: 30000,
      explanation: { summary: 'סימולציה: Timeout בצד הלקוח – לא התקבלה תגובה.', details: ['אין קוד סטטוס: הלקוח הפסיק לחכות.', 'לא ידוע אם השרת השלים את הפעולה.'], nextChecks: ['בדקו Timing ב-DevTools.', 'ראו את תרחיש Timeout ב-API Doctor.'], notProof: 'Timeout אינו מזהה את הרכיב האיטי.' },
    }, seed);
  }

  const result = route(c);
  if (req.method === 'HEAD') result.body = '';
  return finalize(result, seed);
}

function finalize(r: Result, seed: number): MockResponse {
  const { latency, ...rest } = r;
  const base = r.status >= 500 ? 180 : r.status === 0 ? 0 : 40;
  const timeMs = latency ?? base + (seed % 160);
  return { ...rest, statusText: STATUS_INFO[r.status]?.reason ?? '', timeMs, sizeBytes: utf8Size(r.body) };
}
