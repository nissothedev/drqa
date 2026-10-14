import type { DiagnosticScenario } from '../../../types/diagnostics';

export const HTTP_500: DiagnosticScenario = {
  id: 'http-500',
  code: 500,
  title: 'HTTP 500 Internal Server Error',
  shortTitle: '500',
  category: 'server',
  tagline: 'הרכיב שענה נתקל בכשל שלא טופל בזמן עיבוד הבקשה.',
  meaning:
    '500 היא תגובת כשל בצד השרת: משהו בעיבוד נכשל ולא תורגם לשגיאה ספציפית. הקוד מציין איפה התגובה נוצרה – לא מה שורש הבעיה. הגורם יכול להיות קוד, נתונים, קונפיגורציה, תלות – או קלט חריג שהיה אמור לקבל 4xx.',
  notProof: [
    '500 אינו מוכיח באג בקוד של ה-endpoint – ייתכן כשל תלות, נתונים או קונפיגורציה.',
    '500 אינו מוכיח בעיית מסד נתונים, גם אם ההודעה מזכירה SQL.',
    'קלט שגוי שגרם ל-500 מצביע על חוסר טיפול בשגיאה בשרת – אבל גם על בקשה שגויה.',
  ],
  demo: {
    request: `GET /v1/reports/sales?from=2026-01-01 HTTP/1.1
Host: api.example.com
Authorization: Bearer demo-admin-token`,
    response: `HTTP/1.1 500 Internal Server Error
Content-Type: application/problem+json
X-Correlation-Id: demo-77b0-0500

{
  "title": "Internal Server Error",
  "status": 500,
  "traceId": "demo-77b0-0500"
}`,
  },
  startNode: '500.body',
  hypotheses: { 'unhandled-exception': 2, 'bad-input-unhandled': 1, 'db-error': 1, 'dependency-failure': 1, 'config-missing': 1, 'recent-deploy': 1 },
  checks: ['correlation-logs', 'read-error-body'],
  evidence: ['Correlation / Trace ID ושעה מדויקת', 'הבקשה המלאה (ללא סודות)', 'רשומות לוג של השירות עבור ה-ID', 'האם בקשות דומות עם קלט אחר מצליחות', 'פריסות/שינויים סמוכים'],
  nodes: [
    {
      id: '500.body',
      phase: 'response',
      question: 'מה מכיל גוף התגובה?',
      options: [
        { id: 'trace', label: 'הודעה כללית + traceId / correlationId', next: '500.input', facts: ['התגובה כוללת מזהה מעקב'], checks: ['correlation-logs'] },
        { id: 'stack', label: 'פרטים טכניים (stack trace, שם מחלקה, SQL)', next: '500.input', facts: ['התגובה חושפת פרטים טכניים פנימיים'], hypotheses: { 'unhandled-exception': 2 }, assumptions: ['הפרטים בתגובה מתארים את הכשל הראשוני ולא תסמין משני'] },
        { id: 'html', label: 'דף HTML / גוף ריק', next: '500.input', facts: ['התגובה אינה בפורמט ה-API'], assumptions: ['ה-500 נוצר בשירות היעד'], hypotheses: { 'config-missing': 1 }, checks: ['check-gateway-logs'] },
      ],
    },
    {
      id: '500.input',
      phase: 'request',
      question: 'האם ה-500 תלוי בקלט? (אותה בקשה עם ערכים אחרים)',
      help: 'נסו את אותו endpoint עם ערכים "פשוטים" ומוכרים לעומת הערכים שגרמו לכשל.',
      options: [
        { id: 'input-specific', label: 'רק קלט מסוים מכשיל', description: 'למשל תאריך בפורמט אחר, תו מיוחד, ערך ריק', next: '500.contract', facts: ['הכשל מתרחש רק עם קלט מסוים'], hypotheses: { 'bad-input-unhandled': 3, 'test-data': 1, 'config-missing': -1 } },
        { id: 'all-input', label: 'כל קלט מכשיל', next: '500.logs', facts: ['הכשל מתרחש עם כל קלט'], hypotheses: { 'config-missing': 2, 'dependency-failure': 2, 'db-error': 1, 'recent-deploy': 1, 'bad-input-unhandled': -2 } },
        { id: 'unknown', label: 'לא בדקתי', next: '500.logs', assumptions: ['הכשל אינו תלוי בקלט'] },
      ],
    },
    {
      id: '500.contract',
      phase: 'contract',
      question: 'האם הקלט שמכשיל תקין לפי החוזה?',
      options: [
        { id: 'valid', label: 'כן – קלט תקין שגורם ל-500', next: '500.logs', facts: ['קלט תקין לפי החוזה גורם ל-500'], hypotheses: { 'unhandled-exception': 2, 'db-error': 1 } },
        { id: 'invalid', label: 'לא – קלט לא תקין, אבל היה צריך לקבל 4xx', next: '500.logs', facts: ['קלט לא תקין מקבל 500 במקום שגיאת לקוח'], hypotheses: { 'bad-input-unhandled': 3 } },
        { id: 'unclear', label: 'לא ברור', next: '500.logs', assumptions: ['תקינות הקלט ידועה'] },
      ],
    },
    {
      id: '500.logs',
      phase: 'followup',
      question: 'מה נמצא בלוגים עבור ה-correlation ID?',
      help: 'אם אין לכם גישה – בחרו "אין גישה", והעבירו את ה-ID והשעה לצוות הרלוונטי.',
      options: [
        { id: 'exception', label: 'חריגה בקוד השירות (למשל NullReference)', next: null, confirmed: ['בלוג השירות נרשמה חריגה עבור הבקשה'], hypotheses: { 'unhandled-exception': 3 } },
        { id: 'db', label: 'שגיאת מסד נתונים (אילוץ, timeout, חיבור)', next: null, confirmed: ['בלוג השירות נרשמה שגיאת מסד נתונים עבור הבקשה'], hypotheses: { 'db-error': 4 }, checks: ['check-db-query'] },
        { id: 'dependency', label: 'קריאה לשירות אחר נכשלה', next: null, confirmed: ['בלוג השירות נרשם כשל בקריאה לתלות'], hypotheses: { 'dependency-failure': 4 }, checks: ['check-dependency-status'] },
        { id: 'config', label: 'קונפיגורציה / סוד חסר', next: null, confirmed: ['בלוג השירות נרשמה שגיאת קונפיגורציה'], hypotheses: { 'config-missing': 4 }, checks: ['check-env-config'] },
        { id: 'no-access', label: 'אין לי גישה ללוגים', next: null, assumptions: ['הצוות שיקבל את ה-ID יוכל לאתר את הבקשה בלוגים'], checks: ['check-recent-deploys'] },
      ],
    },
  ],
};

export const HTTP_502: DiagnosticScenario = {
  id: 'http-502',
  code: 502,
  title: 'HTTP 502 Bad Gateway',
  shortTitle: '502',
  category: 'server',
  tagline: 'רכיב ביניים קיבל תגובה לא תקינה (או לא קיבל) מהשירות שמאחוריו.',
  meaning:
    '502 נוצר בדרך כלל ב-Gateway, Load Balancer או Proxy: הוא העביר את הבקשה הלאה אבל לא קיבל תגובה תקינה – החיבור נדחה, נסגר באמצע, או שהתשובה לא הייתה HTTP תקין. השירות עצמו אולי בכלל לא ראה את הבקשה.',
  notProof: ['502 לא מצביע על באג בלוגיקה של ה-endpoint.', 'אם השירות כן ראה את הבקשה – לא ידוע אם הפעולה בוצעה (חשוב לפעולות כתיבה!).'],
  demo: {
    request: `POST /v1/checkout HTTP/1.1
Host: api.example.com`,
    response: `HTTP/1.1 502 Bad Gateway
Server: demo-gateway
Content-Type: text/html

<html><body>502 Bad Gateway</body></html>`,
    note: 'דף HTML של ה-Gateway במקום JSON של השירות הוא רמז שהתגובה לא הגיעה מהשירות.',
  },
  startNode: '502.who',
  hypotheses: { 'upstream-down': 2, 'upstream-invalid-response': 2, 'gateway-misconfig': 1, 'dependency-failure': 1, 'tls-issue': 1, 'recent-deploy': 1 },
  checks: ['check-gateway-logs', 'check-service-health'],
  evidence: ['כותרות Server / Via ומבנה התגובה (HTML של Gateway?)', 'לוג ה-Gateway: upstream status וזמן', 'מצב השירות בזמן התקלה (הפעלות מחדש)', 'האם endpoints אחרים באותו שירות עובדים', 'האם פעולת כתיבה בוצעה למרות השגיאה'],
  nodes: [
    {
      id: '502.who',
      phase: 'response',
      question: 'מי נראה כמי שייצר את תגובת ה-502?',
      options: [
        { id: 'gateway', label: 'Gateway / LB – דף HTML או כותרת Server של רכיב ביניים', next: '502.scope', facts: ['תגובת ה-502 נוצרה ברכיב ביניים'] },
        { id: 'service-json', label: 'JSON בפורמט של השירות', next: '502.scope', facts: ['תגובת ה-502 בפורמט של השירות'], hypotheses: { 'dependency-failure': 3, 'upstream-down': -1 }, checks: ['check-dependency-status'] },
        { id: 'unclear', label: 'לא ברור', next: '502.scope', assumptions: ['ה-502 נוצר ברכיב ביניים'] },
      ],
    },
    {
      id: '502.scope',
      phase: 'request',
      question: 'האם endpoints אחרים באותו שירות עונים כרגיל?',
      options: [
        { id: 'all-fail', label: 'לא – כל השירות מחזיר 502', next: '502.change', facts: ['כל ה-endpoints של השירות מחזירים 502'], hypotheses: { 'upstream-down': 3, 'gateway-misconfig': 2 } },
        { id: 'one-fails', label: 'רק endpoint מסוים', next: '502.change', facts: ['רק endpoint מסוים מחזיר 502'], hypotheses: { 'upstream-invalid-response': 3, 'dependency-failure': 2, 'upstream-down': -2 } },
        { id: 'unknown', label: 'לא בדקתי', next: '502.change', assumptions: ['היקף התקלה ידוע'] },
      ],
    },
    {
      id: '502.change',
      phase: 'followup',
      question: 'מה ידוע על מצב השירות והשינויים סביב זמן התקלה?',
      options: [
        { id: 'restarts', label: 'השירות הופעל מחדש / נפל', next: null, confirmed: ['ניטור מראה הפעלות מחדש של השירות בזמן התקלה'], hypotheses: { 'upstream-down': 4, capacity: 1 } },
        { id: 'deploy', label: 'בוצעה פריסה / שינוי ניתוב', next: null, facts: ['בוצעה פריסה או שינוי ניתוב סמוך לתקלה'], hypotheses: { 'recent-deploy': 2, 'gateway-misconfig': 2 }, checks: ['check-recent-deploys'] },
        { id: 'cert', label: 'שינוי תעודות / TLS', next: null, facts: ['בוצע שינוי בתעודות או TLS'], hypotheses: { 'tls-issue': 4 } },
        { id: 'nothing', label: 'לא ידוע על שינוי', next: null, assumptions: ['לא היו שינויים רלוונטיים'], checks: ['check-recent-deploys'] },
      ],
    },
  ],
};

export const HTTP_503: DiagnosticScenario = {
  id: 'http-503',
  code: 503,
  title: 'HTTP 503 Service Unavailable',
  shortTitle: '503',
  category: 'server',
  tagline: 'השירות זמנית אינו יכול לטפל בבקשה.',
  meaning:
    '503 מציין חוסר זמינות זמני: תחזוקה, עומס, אין מופעים בריאים מאחורי ה-LB, או מנגנון הגנה (circuit breaker). לעיתים מצורף Retry-After. ייתכן שנוצר בשירות וייתכן ברכיב ביניים.',
  notProof: ['503 לא אומר שהשירות "נפל" – ייתכן שהוא מגן על עצמו במכוון.', '503 חולף לא מוכיח שהבעיה נפתרה.'],
  demo: {
    request: `GET /v1/recommendations HTTP/1.1
Host: api.example.com`,
    response: `HTTP/1.1 503 Service Unavailable
Retry-After: 120
Content-Type: application/problem+json

{ "title": "Service temporarily unavailable", "status": 503, "detail": "Scheduled maintenance (simulated)" }`,
  },
  startNode: '503.retry',
  hypotheses: { maintenance: 2, capacity: 2, 'upstream-down': 2, 'dependency-failure': 1 },
  checks: ['check-service-health', 'check-gateway-logs'],
  evidence: ['כותרת Retry-After וגוף התגובה', 'מצב השירות והמופעים בניטור', 'הודעות תחזוקה / פריסה', 'דפוס בזמן (שעות, עומס)'],
  nodes: [
    {
      id: '503.retry',
      phase: 'response',
      question: 'מה התגובה מציינת?',
      options: [
        { id: 'maintenance', label: 'תחזוקה / Retry-After', next: '503.pattern', facts: ['התגובה מציינת תחזוקה או זמן המתנה'], hypotheses: { maintenance: 3 } },
        { id: 'overload', label: 'עומס / circuit open', next: '503.pattern', facts: ['התגובה מציינת עומס או הגנה'], hypotheses: { capacity: 3, 'dependency-failure': 1 } },
        { id: 'generic', label: 'הודעה כללית / HTML', next: '503.pattern', facts: ['התגובה כללית'], hypotheses: { 'upstream-down': 2 } },
      ],
    },
    {
      id: '503.pattern',
      phase: 'followup',
      question: 'מה דפוס התקלה לאורך זמן?',
      options: [
        { id: 'window', label: 'בחלון זמן מסוים ואז חולף', next: null, facts: ['התקלה מופיעה בחלון זמן מוגדר'], hypotheses: { maintenance: 2, 'recent-deploy': 1 }, checks: ['check-recent-deploys'] },
        { id: 'peaks', label: 'בשעות עומס / בזמן בדיקות עומס', next: null, facts: ['התקלה מתואמת לעומס'], hypotheses: { capacity: 3, 'rate-limit-client': 1 } },
        { id: 'constant', label: 'קבוע – לא חולף', next: null, facts: ['התקלה קבועה'], hypotheses: { 'upstream-down': 3, 'config-missing': 1 }, checks: ['check-env-config'] },
      ],
    },
  ],
};

export const HTTP_504: DiagnosticScenario = {
  id: 'http-504',
  code: 504,
  title: 'HTTP 504 Gateway Timeout',
  shortTitle: '504',
  category: 'server',
  tagline: 'רכיב ביניים לא קיבל תגובה מהשירות שמאחוריו בזמן שהוקצב.',
  meaning:
    '504 נוצר ברכיב ביניים (Gateway / LB / Proxy) שה-timeout שלו הסתיים לפני שהשירות ענה. הוא מזהה מי ויתר – לא מי איטי. השירות אולי עדיין מעבד את הבקשה, ואולי אפילו השלים אותה.',
  notProof: [
    '504 לא מזהה את הרכיב האיטי – רק את הרכיב שה-timeout שלו פג.',
    'לא ידוע אם הפעולה בוצעה בשרת – לפני ניסיון חוזר של פעולת כתיבה יש לבדוק.',
    '504 אינו מוכיח בעיית מסד נתונים.',
  ],
  demo: {
    request: `GET /v1/search?q=*&limit=100000 HTTP/1.1
Host: api.example.com`,
    response: `HTTP/1.1 504 Gateway Timeout
Server: demo-gateway

<html><body>504 Gateway Time-out</body></html>`,
  },
  startNode: '504.duration',
  hypotheses: { 'slow-query': 1, 'slow-dependency': 2, 'large-payload': 1, 'timeout-mismatch': 1, capacity: 1 },
  checks: ['measure-timing', 'check-timeouts-config', 'check-gateway-logs'],
  evidence: ['משך הזמן עד השגיאה (שניות)', 'פירוק Timing ב-DevTools', 'ערכי timeout בכל שכבה', 'זמני עיבוד בלוג השירות', 'האם הפעולה בוצעה למרות ה-504'],
  nodes: [
    {
      id: '504.duration',
      phase: 'response',
      question: 'אחרי כמה זמן התקבלה השגיאה?',
      help: 'זמן עגול וקבוע (30s, 60s) מרמז על ערך timeout מוגדר.',
      options: [
        { id: 'fixed', label: 'זמן קבוע ועגול בכל פעם', next: '504.request', facts: ['השגיאה מתקבלת אחרי זמן קבוע'], hypotheses: { 'timeout-mismatch': 2 }, checks: ['check-timeouts-config'] },
        { id: 'variable', label: 'זמן משתנה', next: '504.request', facts: ['זמן השגיאה משתנה'], hypotheses: { capacity: 2, 'slow-dependency': 1 } },
        { id: 'unknown', label: 'לא מדדתי', next: '504.request', assumptions: ['זמן ה-timeout ידוע'], checks: ['measure-timing'] },
      ],
    },
    {
      id: '504.request',
      phase: 'request',
      question: 'האם הבקשה "כבדה" במיוחד?',
      options: [
        { id: 'heavy', label: 'כן – טווח רחב, ללא עימוד, הרבה נתונים', next: '504.contract', facts: ['הבקשה מבקשת כמות נתונים גדולה'], hypotheses: { 'large-payload': 3, 'slow-query': 2 } },
        { id: 'light', label: 'לא – בקשה רגילה שבדרך כלל מהירה', next: '504.logs', facts: ['בקשה שבדרך כלל מהירה מקבלת 504'], hypotheses: { 'large-payload': -2, 'slow-dependency': 2, capacity: 1 } },
      ],
    },
    {
      id: '504.contract',
      phase: 'contract',
      question: 'האם החוזה מגביל את גודל הבקשה (limit מקסימלי, טווח תאריכים)?',
      options: [
        { id: 'exceeds', label: 'כן – והבקשה חורגת ממנו', next: null, confirmed: ['הבקשה חורגת מהמגבלה המתועדת'], hypotheses: { 'large-payload': 3, 'bad-input-unhandled': 2 } },
        { id: 'within', label: 'הבקשה בגבולות המותר', next: '504.logs', facts: ['הבקשה בגבולות החוזה'], hypotheses: { 'slow-query': 2 } },
        { id: 'no-limit', label: 'אין מגבלה מתועדת', next: '504.logs', facts: ['אין מגבלת גודל מתועדת'], hypotheses: { 'contract-drift': 1, 'large-payload': 1 } },
      ],
    },
    {
      id: '504.logs',
      phase: 'followup',
      question: 'מה מראים הלוגים / ה-trace על חלוקת הזמן?',
      options: [
        { id: 'db', label: 'רוב הזמן בשאילתת מסד נתונים', next: null, confirmed: ['לפי ה-trace רוב הזמן מתבזבז בשאילתה'], hypotheses: { 'slow-query': 4 }, checks: ['check-db-query'] },
        { id: 'dep', label: 'רוב הזמן בקריאה לשירות אחר', next: null, confirmed: ['לפי ה-trace רוב הזמן מתבזבז בתלות'], hypotheses: { 'slow-dependency': 4 }, checks: ['check-dependency-status'] },
        { id: 'completed', label: 'השירות השלים – אחרי שה-Gateway ויתר', next: null, confirmed: ['השירות השלים את העיבוד לאחר שה-Gateway החזיר 504'], hypotheses: { 'timeout-mismatch': 4 } },
        { id: 'no-access', label: 'אין גישה ללוגים', next: null, assumptions: ['ניתן יהיה לקבל פירוק זמנים מהצוות'] },
      ],
    },
  ],
};
