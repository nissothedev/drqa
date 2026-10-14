// Fictional browser traffic for the DevTools simulator. Every host, token and cookie is synthetic.

export type ReqType = 'document' | 'fetch' | 'script' | 'stylesheet' | 'img';

export interface MockNetRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  status: number;
  type: ReqType;
  initiator: string;
  size: string;
  timeMs: number;
  phase: 'checkout' | 'error-page';
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  query?: Record<string, string>;
  payload?: string;
  response?: string;
  timing?: { queued: number; stalled: number; dns: number; connect: number; tls: number; sent: number; waiting: number; download: number };
  console?: string;
}

const COMMON_REQ = {
  Accept: 'application/json',
  Origin: 'https://shop.example.com',
  Referer: 'https://shop.example.com/checkout',
  'User-Agent': 'Mozilla/5.0 (Demo Browser)',
};

export const NET_REQUESTS: MockNetRequest[] = [
  { id: 'doc', name: 'checkout', method: 'GET', url: 'https://shop.example.com/checkout', status: 200, type: 'document', initiator: 'Other', size: '4.1 kB', timeMs: 92, phase: 'checkout', requestHeaders: { Accept: 'text/html' }, responseHeaders: { 'Content-Type': 'text/html' } },
  { id: 'js', name: 'app.3f9c.js', method: 'GET', url: 'https://shop.example.com/assets/app.3f9c.js', status: 200, type: 'script', initiator: 'checkout', size: '182 kB', timeMs: 64, phase: 'checkout', requestHeaders: {}, responseHeaders: { 'Content-Type': 'application/javascript' } },
  { id: 'css', name: 'styles.a1b2.css', method: 'GET', url: 'https://shop.example.com/assets/styles.a1b2.css', status: 200, type: 'stylesheet', initiator: 'checkout', size: '22 kB', timeMs: 31, phase: 'checkout', requestHeaders: {}, responseHeaders: { 'Content-Type': 'text/css' } },
  { id: 'logo', name: 'logo.svg', method: 'GET', url: 'https://shop.example.com/assets/logo.svg', status: 200, type: 'img', initiator: 'checkout', size: '1.3 kB', timeMs: 12, phase: 'checkout', requestHeaders: {}, responseHeaders: { 'Content-Type': 'image/svg+xml' } },
  {
    id: 'me',
    name: 'me',
    method: 'GET',
    url: 'https://api.example.com/v1/me',
    status: 200,
    type: 'fetch',
    initiator: 'app.3f9c.js:1840',
    size: '312 B',
    timeMs: 88,
    phase: 'checkout',
    requestHeaders: { ...COMMON_REQ, Authorization: 'Bearer demo-customer-token', Cookie: 'demo_session=fictional-abc123' },
    responseHeaders: { 'Content-Type': 'application/json', 'X-Correlation-Id': 'demo-11aa-0200', 'Access-Control-Allow-Origin': 'https://shop.example.com' },
    response: '{\n  "userId": "CUS-1001",\n  "displayName": "Demo Buyer",\n  "role": "customer"\n}',
  },
  {
    id: 'cart',
    name: 'cart',
    method: 'GET',
    url: 'https://api.example.com/v1/cart',
    status: 200,
    type: 'fetch',
    initiator: 'app.3f9c.js:2211',
    size: '408 B',
    timeMs: 104,
    phase: 'checkout',
    requestHeaders: { ...COMMON_REQ, Authorization: 'Bearer demo-customer-token', Cookie: 'demo_session=fictional-abc123' },
    responseHeaders: { 'Content-Type': 'application/json', 'X-Correlation-Id': 'demo-22bb-0200' },
    response: '{\n  "customerId": "CUS-1001",\n  "items": [{ "sku": "SKU-DS-1004", "quantity": 1 }],\n  "subtotal": 39\n}',
  },
  {
    id: 'reco',
    name: 'recommendations',
    method: 'GET',
    url: 'https://api.example.com/v1/recommendations?context=checkout',
    status: 503,
    type: 'fetch',
    initiator: 'app.3f9c.js:3022',
    size: '201 B',
    timeMs: 41,
    phase: 'checkout',
    query: { context: 'checkout' },
    requestHeaders: { ...COMMON_REQ },
    responseHeaders: { 'Content-Type': 'application/problem+json', 'Retry-After': '120' },
    response: '{\n  "title": "Service Unavailable",\n  "status": 503,\n  "detail": "Scheduled maintenance (simulated)"\n}',
    console: 'GET https://api.example.com/v1/recommendations?context=checkout 503 (Service Unavailable)',
  },
  {
    id: 'orders',
    name: 'orders',
    method: 'POST',
    url: 'https://api.example.com/v1/orders',
    status: 422,
    type: 'fetch',
    initiator: 'app.3f9c.js:2875',
    size: '389 B',
    timeMs: 236,
    phase: 'checkout',
    requestHeaders: { ...COMMON_REQ, 'Content-Type': 'application/json', Authorization: 'Bearer demo-customer-token', Cookie: 'demo_session=fictional-abc123', 'Idempotency-Key': 'demo-7c1e' },
    responseHeaders: { 'Content-Type': 'application/problem+json', 'X-Correlation-Id': 'demo-9f3e-0422', 'Access-Control-Allow-Origin': 'https://shop.example.com' },
    payload: '{\n  "customerId": "CUS-1001",\n  "items": [{ "sku": "SKU-DS-1004", "quantity": 1 }],\n  "shippingAddress": {\n    "street": "12 Example St",\n    "city": "Demo City"\n  }\n}',
    response: '{\n  "title": "Validation failed",\n  "status": 422,\n  "errors": [\n    { "field": "shippingAddress.zip", "rule": "required", "message": "Missing required field: zip" }\n  ],\n  "traceId": "demo-9f3e-0422"\n}',
    timing: { queued: 2, stalled: 3, dns: 0, connect: 0, tls: 0, sent: 1, waiting: 221, download: 9 },
    console: 'POST https://api.example.com/v1/orders 422 (Unprocessable Content)',
  },
  { id: 'flags', name: 'feature-flags', method: 'GET', url: 'https://api.example.com/v1/feature-flags', status: 200, type: 'fetch', initiator: 'app.3f9c.js:120', size: '96 B', timeMs: 35, phase: 'checkout', requestHeaders: { ...COMMON_REQ }, responseHeaders: { 'Content-Type': 'application/json' }, response: '{ "newCheckout": true }' },
  { id: 'err-doc', name: 'error', method: 'GET', url: 'https://shop.example.com/checkout/error', status: 200, type: 'document', initiator: 'app.3f9c.js:2890', size: '3.2 kB', timeMs: 70, phase: 'error-page', requestHeaders: { Accept: 'text/html' }, responseHeaders: { 'Content-Type': 'text/html' } },
  { id: 'err-js', name: 'app.3f9c.js', method: 'GET', url: 'https://shop.example.com/assets/app.3f9c.js', status: 200, type: 'script', initiator: 'error', size: '(disk cache)', timeMs: 2, phase: 'error-page', requestHeaders: {}, responseHeaders: {} },
];

export function curlFor(r: MockNetRequest): string {
  const parts = [`curl '${r.url}'`];
  if (r.method !== 'GET') parts.push(`  -X ${r.method}`);
  for (const [k, v] of Object.entries(r.requestHeaders)) parts.push(`  -H '${k.toLowerCase()}: ${v}'`);
  if (r.payload) parts.push(`  --data-raw '${r.payload.replace(/\s*\n\s*/g, ' ')}'`);
  return parts.join(' \\\n');
}

export type SimTab = 'elements' | 'console' | 'network';
export type DetailTab = 'headers' | 'payload' | 'response' | 'timing';
export type Filter = 'all' | 'fetch' | 'document' | 'script' | 'stylesheet' | 'img';

export interface SimState {
  tab: SimTab;
  preserveLog: boolean;
  filter: Filter;
  selected: string | null;
  detailTab: DetailTab;
  placed: boolean;
  lostLog: boolean;
  curlCopied: boolean;
}

export interface LessonStep {
  id: string;
  title: string;
  body: string[];
  task?: string;
  done?: (s: SimState) => boolean;
  tip?: string;
}

export const LESSON: LessonStep[] = [
  {
    id: 'open',
    title: 'פתיחת DevTools ולשונית Network',
    body: ['פתחו את כלי המפתחים עם F12 או Ctrl+Shift+I (ב-Mac: ‎⌘⌥I).', 'לשונית Network מציגה כל בקשה שהדף שולח: מסמכים, סקריפטים, תמונות וקריאות API.'],
    task: 'בסימולטור: לחצו על הלשונית Network.',
    done: (s) => s.tab === 'network',
  },
  {
    id: 'preserve',
    title: 'הפעלת Preserve log',
    body: ['כשהדף מנווט לעמוד אחר (למשל עמוד שגיאה), DevTools מנקה את הרשימה כברירת מחדל – והבקשה הכושלת נעלמת.', 'Preserve log שומר את הבקשות גם אחרי ניווט.'],
    task: 'סמנו את Preserve log בסרגל הכלים.',
    done: (s) => s.preserveLog,
    tip: 'אם כבר לחצתם "ביצוע הזמנה" בלי Preserve log – ראיתם בדיוק למה זה חשוב.',
  },
  {
    id: 'reproduce',
    title: 'שחזור הפעולה',
    body: ['בצעו את הפעולה שנכשלת – כאן: לחיצה על "ביצוע הזמנה" בחנות הבדויה.', 'שחזרו פעם אחת ובאופן ממוקד, כדי שהרשימה לא תתמלא ברעש.'],
    task: 'לחצו על "ביצוע הזמנה" כש-Preserve log פעיל.',
    done: (s) => s.placed && s.preserveLog && !s.lostLog,
  },
  {
    id: 'filter',
    title: 'סינון Fetch/XHR',
    body: ['רוב הבקשות הן קבצים סטטיים. הסינון Fetch/XHR משאיר רק קריאות API.'],
    task: 'בחרו בסינון Fetch/XHR.',
    done: (s) => s.filter === 'fetch',
  },
  {
    id: 'identify',
    title: 'איתור הבקשה הנכונה',
    body: ['לא כל שורה אדומה היא הסיבה. כאן יש שתי שגיאות: 503 ב-recommendations ו-422 ב-orders.', 'שאלו: איזו בקשה קשורה לפעולה שנכשלה? ההזמנה – לא ההמלצות. עמודת Initiator ושעת הבקשה עוזרות לקשר.'],
    task: 'בחרו את הבקשה שגרמה לכשל ההזמנה.',
    done: (s) => s.selected === 'orders',
    tip: 'ה-503 של ההמלצות הוא רעש: תקלה אמיתית, אבל לא זו שמונעת את ההזמנה.',
  },
  {
    id: 'headers',
    title: 'URL, שיטה וכותרות',
    body: ['בלשונית Headers – General: Request URL, Method, Status Code.', 'Request Headers: Content-Type, Authorization, Cookie, Origin. Response Headers: Content-Type, X-Correlation-Id.', 'רשמו את ה-Correlation ID – זה המפתח לחיפוש בלוגים.'],
    task: 'פתחו את לשונית Headers של הבקשה.',
    done: (s) => s.selected === 'orders' && s.detailTab === 'headers',
  },
  {
    id: 'payload',
    title: 'גוף הבקשה (Payload)',
    body: ['Payload מציג את מה שנשלח בפועל – לא את מה שהטופס הציג.', 'השוו לחוזה: האם כל שדות החובה קיימים? האם הטיפוסים נכונים?'],
    task: 'פתחו את לשונית Payload.',
    done: (s) => s.selected === 'orders' && s.detailTab === 'payload',
    tip: 'שימו לב: ב-shippingAddress חסר השדה zip.',
  },
  {
    id: 'response',
    title: 'סטטוס וגוף התגובה',
    body: ['Response מציג את גוף התגובה הגולמי; Preview מציג אותו כעץ.', 'כאן ה-422 מפרט: shippingAddress.zip חסר. זו עובדה שנצפתה – עכשיו צריך לברר למה ה-UI לא שלח את השדה.'],
    task: 'פתחו את לשונית Response.',
    done: (s) => s.selected === 'orders' && s.detailTab === 'response',
  },
  {
    id: 'timing',
    title: 'Timing – לאן הלך הזמן',
    body: ['Waiting (TTFB) גבוה = עיבוד מאחורי החיבור. Stalled / Connect גבוהים = בעיית רשת/חיבורים.', 'Timing מצמצם חשודים, אבל לא מבחין בין Gateway, שירות או מסד נתונים.'],
    task: 'פתחו את לשונית Timing.',
    done: (s) => s.selected === 'orders' && s.detailTab === 'timing',
  },
  {
    id: 'console',
    title: 'שגיאות Console',
    body: ['Console מציג שגיאות JavaScript, שגיאות רשת ו-CORS.', 'קשרו כל הודעה לבקשה המתאימה. הודעת CORS יכולה להסתיר סטטוס אמיתי.'],
    task: 'פתחו את לשונית Console.',
    done: (s) => s.tab === 'console',
  },
  {
    id: 'curl',
    title: 'Copy as cURL',
    body: ['קליק ימני על הבקשה ← Copy ← Copy as cURL (bash). מתקבלת פקודה מלאה עם URL, שיטה, כותרות וגוף.', '⚠️ הפקודה כוללת Cookies וטוקנים אמיתיים בעולם האמיתי. לעולם אל תשתפו אותה כמו שהיא.'],
    task: 'חזרו ל-Network, בחרו את בקשת orders ולחצו "Copy as cURL".',
    done: (s) => s.curlCopied,
  },
  {
    id: 'postman',
    title: 'ייבוא ל-Postman',
    body: ['ב-Postman: Import ← Raw text ← הדביקו את פקודת ה-cURL ← Continue ← Import.', 'Postman יוצר בקשה עם אותו URL, שיטה, כותרות וגוף.', 'החליפו ערכים רגישים במשתני סביבה ({{token}}), והסירו Cookies שאינם נחוצים.'],
  },
  {
    id: 'compare',
    title: 'השוואת דפדפן מול Postman',
    body: ['גם אחרי ייבוא, הבקשות עשויות להתנהג אחרת: Cookies ו-session, טוקן שפג, Origin ו-CORS, כותרות שה-interceptor מוסיף, או סביבה שונה במשתני Postman.', 'בדקו את טבלת ההבדלים בהמשך העמוד – וזכרו: שחזור ב-Postman לא מוכיח שהבעיה בשרת.'],
  },
];

export const DIFFERENCES = [
  { id: 'cookies', title: 'Cookies ו-Session', browser: 'הדפדפן שולח Cookies של הדומיין אוטומטית.', postman: 'נשלחים רק אם יובאו או הוגדרו ב-Cookie jar.', effect: 'שירות שמבוסס session יחזיר 401 ב-Postman בלבד.' },
  { id: 'auth', title: 'כותרת Authorization', browser: 'interceptor באפליקציה מוסיף טוקן עדכני.', postman: 'טוקן שהועתק פעם אחת – עלול לפוג.', effect: '401 ב-Postman אחרי זמן מה, בזמן שהאפליקציה עובדת.' },
  { id: 'content-type', title: 'Content-Type', browser: 'נקבע בקוד (לרוב application/json).', postman: 'תלוי בהגדרת Body (raw/JSON מול Text).', effect: '415 או 400 בכלי אחד בלבד.' },
  { id: 'cors', title: 'CORS ו-Origin', browser: 'הדפדפן אוכף CORS ושולח Origin + Preflight.', postman: 'אין אכיפת CORS ואין Preflight.', effect: '"עובד ב-Postman, נחסם בדפדפן" – אופייני לבעיית CORS.' },
  { id: 'env', title: 'סביבה ו-Base URL', browser: 'האפליקציה פונה ל-API של הסביבה שבה היא רצה.', postman: 'תלוי במשתנה הסביבה שנבחר ב-Postman.', effect: 'בדיקה מול QA בזמן שהאפליקציה מדברת עם UAT.' },
  { id: 'headers', title: 'כותרות מותאמות', browser: 'האפליקציה מוסיפה כותרות (גרסה, שפה, Idempotency-Key).', postman: 'רק מה שהוגדר ידנית או יובא.', effect: 'ולידציה שנכשלת רק בכלי אחד.' },
  { id: 'expired', title: 'תוקף טוקן', browser: 'רענון טוקן אוטומטי (refresh).', postman: 'ללא רענון אלא אם הוגדר.', effect: '401 "invalid_token" ב-Postman בלבד.' },
];
