import type { DiagnosticScenario } from '../../../types/diagnostics';

export const CONNECTION_REFUSED: DiagnosticScenario = {
  id: 'connection-refused',
  title: 'Connection Refused',
  shortTitle: 'ECONNREFUSED',
  category: 'network',
  tagline: 'החיבור נדחה מיד – אין קוד סטטוס HTTP כי לא התקבלה תגובה.',
  meaning:
    'Connection refused פירושו שהמארח הגיב לניסיון החיבור בדחייה – בדרך כלל אין תהליך שמאזין בפורט, או שרכיב רשת דוחה באופן אקטיבי. אין כאן תגובת HTTP ולכן אין קוד סטטוס; בדפדפן זה מופיע לרוב כ-(failed) net::ERR_CONNECTION_REFUSED.',
  notProof: ['זה לא מוכיח שהשירות למטה לכולם – ייתכן שרק מהעמדה שלכם אין גישה.', 'זה לא קשור לתוכן הבקשה – החיבור נכשל לפני שהבקשה נשלחה.'],
  demo: {
    request: `GET /v1/products HTTP/1.1
Host: localhost:8081`,
    response: `(no HTTP response)
curl: (7) Failed to connect to localhost port 8081: Connection refused
Browser: net::ERR_CONNECTION_REFUSED`,
  },
  startNode: 'cr.target',
  hypotheses: { 'service-not-running': 2, 'wrong-port-host': 2, firewall: 1, 'vpn-proxy': 1 },
  checks: ['check-port', 'check-network-path'],
  evidence: ['host ופורט מדויקים', 'תוצאת Test-NetConnection', 'האם עמית/עמדה אחרת מצליחים', 'האם השירות רץ ובאיזה פורט'],
  nodes: [
    {
      id: 'cr.target',
      phase: 'request',
      question: 'האם ה-host והפורט תואמים לכתובת המתועדת של הסביבה?',
      options: [
        { id: 'mismatch', label: 'לא – נמצאה כתובת או פורט שגויים', next: null, confirmed: ['הבקשה נשלחה לכתובת או פורט שאינם של השירות'], hypotheses: { 'wrong-port-host': 4 } },
        { id: 'match', label: 'כן – תואמים', next: 'cr.others', facts: ['הכתובת והפורט תואמים לתיעוד'], hypotheses: { 'wrong-port-host': -3 } },
        { id: 'local', label: 'זה שירות מקומי (localhost)', next: 'cr.local', facts: ['היעד הוא שירות מקומי'], hypotheses: { 'service-not-running': 2 } },
      ],
    },
    {
      id: 'cr.local',
      phase: 'followup',
      question: 'האם השירות המקומי רץ ומאזין לפורט הזה?',
      options: [
        { id: 'not-running', label: 'לא – לא רץ / נפל בעלייה', next: null, confirmed: ['השירות המקומי אינו רץ'], hypotheses: { 'service-not-running': 4 } },
        { id: 'other-port', label: 'רץ על פורט אחר', next: null, confirmed: ['השירות מאזין לפורט שונה מזה שאליו נשלחה הבקשה'], hypotheses: { 'wrong-port-host': 4 } },
        { id: 'running', label: 'רץ על הפורט הנכון', next: null, facts: ['השירות רץ על הפורט הנכון'], hypotheses: { firewall: 2, 'service-not-running': -2 } },
      ],
    },
    {
      id: 'cr.others',
      phase: 'environment',
      question: 'האם מעמדה / רשת אחרת החיבור מצליח?',
      options: [
        { id: 'others-ok', label: 'כן – אצל אחרים זה עובד', next: null, facts: ['החיבור מצליח מעמדה אחרת'], hypotheses: { 'vpn-proxy': 3, firewall: 2, 'service-not-running': -3 } },
        { id: 'all-fail', label: 'לא – נכשל לכולם', next: null, facts: ['החיבור נכשל מכל העמדות שנבדקו'], hypotheses: { 'service-not-running': 3, 'gateway-misconfig': 1 }, checks: ['check-service-health', 'check-recent-deploys'] },
        { id: 'unknown', label: 'לא בדקתי', next: null, assumptions: ['הבעיה אינה ייחודית לעמדה שלי'] },
      ],
    },
  ],
};

export const DNS_FAILURE: DiagnosticScenario = {
  id: 'dns-failure',
  title: 'DNS Resolution Failure',
  shortTitle: 'DNS',
  category: 'network',
  tagline: 'שם המארח לא נפתר לכתובת IP – הבקשה לא יצאה.',
  meaning: 'כשל DNS (למשל ERR_NAME_NOT_RESOLVED / ENOTFOUND / NXDOMAIN) מתרחש לפני כל חיבור: המחשב לא הצליח לתרגם את שם המארח לכתובת. השרת לא ראה את הבקשה בכלל.',
  notProof: ['כשל DNS לא מעיד על מצב השירות.', 'הצלחה אצל עמית לא מוכיחה שהשם תקין לכולם – ייתכן DNS פנימי שונה.'],
  demo: {
    request: `GET /v1/products HTTP/1.1
Host: api.exmaple.com`,
    response: `(no HTTP response)
Browser: net::ERR_NAME_NOT_RESOLVED
PowerShell> Resolve-DnsName api.exmaple.com
Resolve-DnsName : api.exmaple.com : DNS name does not exist`,
    note: 'שימו לב לשגיאת הכתיב exmaple בדוגמה.',
  },
  startNode: 'dns.spelling',
  hypotheses: { 'dns-typo': 2, 'dns-record': 1, 'dns-internal': 2, 'dns-cache': 1, 'vpn-proxy': 1 },
  checks: ['nslookup', 'check-network-path'],
  evidence: ['שם המארח המדויק', 'תוצאת Resolve-DnsName / nslookup', 'מצב VPN', 'תוצאה מעמדה אחרת'],
  nodes: [
    {
      id: 'dns.spelling',
      phase: 'request',
      question: 'האם שם המארח זהה תו-בתו לכתובת המתועדת?',
      options: [
        { id: 'typo', label: 'לא – נמצאה שגיאת כתיב', next: null, confirmed: ['שם המארח שנשלח שגוי'], hypotheses: { 'dns-typo': 5 } },
        { id: 'same', label: 'כן – זהה', next: 'dns.vpn', facts: ['שם המארח תואם לתיעוד'], hypotheses: { 'dns-typo': -3 } },
      ],
    },
    {
      id: 'dns.vpn',
      phase: 'environment',
      question: 'האם הסביבה דורשת VPN / רשת ארגונית, והאם אתם מחוברים?',
      options: [
        { id: 'disconnected', label: 'נדרש VPN ואני לא מחובר', next: null, confirmed: ['הסביבה דורשת VPN והעמדה לא מחוברת'], hypotheses: { 'dns-internal': 4, 'vpn-proxy': 2 } },
        { id: 'connected', label: 'מחובר / לא נדרש', next: 'dns.result', facts: ['העמדה מחוברת לרשת הנדרשת'], hypotheses: { 'dns-internal': -1 } },
      ],
    },
    {
      id: 'dns.result',
      phase: 'followup',
      question: 'מה תוצאת Resolve-DnsName / nslookup?',
      options: [
        { id: 'nxdomain', label: 'השם לא קיים (NXDOMAIN)', next: null, facts: ['שרת ה-DNS מחזיר שהשם אינו קיים'], hypotheses: { 'dns-record': 3, 'dns-internal': 1 } },
        { id: 'resolves', label: 'נפתר לכתובת – אבל הדפדפן עדיין נכשל', next: null, facts: ['השם נפתר בכלי שורת הפקודה'], hypotheses: { 'dns-cache': 3, 'vpn-proxy': 2 } },
        { id: 'old-ip', label: 'נפתר לכתובת ישנה / שונה מעמית', next: null, facts: ['השם נפתר לכתובת שונה מזו של עמית'], hypotheses: { 'dns-cache': 3, 'dns-record': 1 } },
      ],
    },
  ],
};

export const CLIENT_TIMEOUT: DiagnosticScenario = {
  id: 'timeout',
  title: 'Request Timeout',
  shortTitle: 'Timeout',
  category: 'network',
  tagline: 'הלקוח הפסיק לחכות לתגובה – אין קוד סטטוס מהשרת.',
  meaning:
    'Timeout בצד הלקוח (דפדפן, Postman, אוטומציה) אומר שהזמן שהלקוח הקצה הסתיים לפני שהתקבלה תגובה. זה שונה מ-504, שבו רכיב ביניים מחזיר תגובה. Timeout כשלעצמו אינו מזהה את הרכיב האיטי.',
  notProof: ['Timeout לא מזהה את הרכיב הכושל – הוא יכול להיות ברשת, ב-Gateway, בשירות, במסד או בתלות.', 'Timeout לא אומר שהבקשה לא בוצעה בשרת.'],
  demo: {
    request: `POST /v1/orders/ORD-50017/invoice HTTP/1.1
Host: api.example.com`,
    response: `(no HTTP response after 30s)
Postman: Error: ESOCKETTIMEDOUT
Browser: (pending) → (canceled)`,
  },
  startNode: 'to.phase',
  hypotheses: { 'slow-dependency': 1, 'slow-query': 1, capacity: 1, 'large-payload': 1, 'vpn-proxy': 1, 'timeout-mismatch': 1 },
  checks: ['measure-timing', 'check-timeouts-config'],
  evidence: ['זמן עד הכשל ומה ה-timeout המוגדר בלקוח', 'פירוק Timing (Stalled / Connect / Waiting)', 'האם הפעולה בוצעה בשרת', 'האם בקשות אחרות לאותו שרת מהירות'],
  nodes: [
    {
      id: 'to.phase',
      phase: 'response',
      question: 'לפי Timing ב-DevTools (או verbose בכלי), איפה נתקע הזמן?',
      options: [
        { id: 'connect', label: 'בחיבור (Stalled / Initial connection)', next: 'to.others', facts: ['הזמן מתבזבז בשלב יצירת החיבור'], hypotheses: { 'vpn-proxy': 3, firewall: 2, capacity: -1, 'slow-query': -2 } },
        { id: 'waiting', label: 'בהמתנה לתגובה (Waiting / TTFB)', next: 'to.request', facts: ['החיבור נוצר והזמן מתבזבז בהמתנה לתגובה'], hypotheses: { 'slow-dependency': 2, 'slow-query': 2, capacity: 1, 'vpn-proxy': -2 } },
        { id: 'unknown', label: 'לא זמין לי', next: 'to.request', assumptions: ['החיבור עצמו נוצר בהצלחה'], checks: ['measure-timing'] },
      ],
    },
    {
      id: 'to.others',
      phase: 'environment',
      question: 'האם בקשות אחרות לאותו מארח מצליחות מהעמדה שלכם?',
      options: [
        { id: 'all-slow', label: 'לא – כל הבקשות למארח נתקעות', next: null, facts: ['כל הבקשות לאותו מארח נתקעות'], hypotheses: { 'vpn-proxy': 2, firewall: 2, 'upstream-down': 1 }, checks: ['check-network-path', 'check-port'] },
        { id: 'only-this', label: 'רק הבקשה הזו', next: 'to.request', facts: ['רק הבקשה הספציפית נתקעת'], hypotheses: { 'vpn-proxy': -2 } },
      ],
    },
    {
      id: 'to.request',
      phase: 'request',
      question: 'האם הבקשה מבקשת עיבוד או נתונים רבים?',
      options: [
        { id: 'heavy', label: 'כן – דוח, ייצוא, טווח רחב', next: 'to.contract', facts: ['הבקשה דורשת עיבוד כבד'], hypotheses: { 'large-payload': 3, 'slow-query': 1 } },
        { id: 'normal', label: 'לא – פעולה רגילה', next: 'to.contract', facts: ['הבקשה היא פעולה רגילה'], hypotheses: { 'large-payload': -2, 'slow-dependency': 1, capacity: 1 } },
      ],
    },
    {
      id: 'to.contract',
      phase: 'contract',
      question: 'האם זמן התגובה המצופה מוגדר (SLA / תיעוד), והאם ה-timeout של הלקוח סביר ביחס אליו?',
      options: [
        { id: 'client-short', label: 'ה-timeout של הלקוח קצר מהמצופה', next: null, confirmed: ['ה-timeout בלקוח קצר מזמן התגובה המתועד'], hypotheses: { 'timeout-mismatch': 4 } },
        { id: 'server-slow', label: 'השרת חורג מהזמן המצופה', next: null, facts: ['זמן התגובה חורג מהמצופה'], hypotheses: { 'slow-dependency': 1, 'slow-query': 1, capacity: 1 }, checks: ['correlation-logs', 'check-dependency-status'] },
        { id: 'undefined', label: 'אין הגדרה', next: null, assumptions: ['זמן התגובה המצופה ידוע'] },
      ],
    },
  ],
};

export const CORS_ERROR: DiagnosticScenario = {
  id: 'cors',
  title: 'CORS Error',
  shortTitle: 'CORS',
  category: 'network',
  tagline: 'הדפדפן חסם גישה לתגובה ממקור (Origin) אחר.',
  meaning:
    'CORS נאכף על ידי הדפדפן בלבד. כשאתר מ-Origin אחד קורא ל-API ב-Origin אחר, הדפדפן דורש כותרות Access-Control-* מתאימות בתגובה (ולעיתים בקשת Preflight מסוג OPTIONS). בלעדיהן, הקוד באתר לא יכול לקרוא את התגובה – גם אם השרת ענה.',
  notProof: [
    'עבודה תקינה ב-Postman לא מוכיחה ש-CORS תקין – Postman אינו אוכף CORS.',
    'שגיאת CORS עלולה להסתיר תגובת 401/500 אמיתית שאין בה כותרות CORS.',
    'CORS אינו מנגנון הגנה על השרת – הוא מגן על המשתמש בדפדפן.',
  ],
  demo: {
    request: `OPTIONS /v1/cart HTTP/1.1
Host: api.example.com
Origin: https://shop.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization`,
    response: `HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://admin.example.com
Access-Control-Allow-Methods: GET

Console: Access to fetch at 'https://api.example.com/v1/cart' from origin
'https://shop.example.com' has been blocked by CORS policy`,
  },
  startNode: 'cors.status',
  hypotheses: { 'cors-missing-origin': 2, 'cors-preflight': 2, 'cors-credentials': 1, 'cors-masking-error': 2 },
  checks: ['check-cors-headers', 'check-console'],
  evidence: ['הודעת ה-Console המלאה', 'בקשת OPTIONS (אם קיימת) והסטטוס שלה', 'כותרות Access-Control-* בתגובות', 'ה-Origin של האפליקציה', 'הסטטוס האמיתי של הבקשה הראשית'],
  nodes: [
    {
      id: 'cors.status',
      phase: 'response',
      question: 'מה הסטטוס האמיתי של הבקשה ב-Network (גם אם התגובה חסומה לקריאה)?',
      options: [
        { id: 'error', label: '401 / 403 / 500 וכדומה', next: 'cors.contract', facts: ['הבקשה הראשית קיבלה סטטוס שגיאה'], hypotheses: { 'cors-masking-error': 4 }, checks: ['correlation-logs'] },
        { id: 'ok', label: '2xx – אבל הדפדפן חוסם', next: 'cors.headers', facts: ['הבקשה הראשית קיבלה סטטוס הצלחה אך נחסמה לקריאה'], hypotheses: { 'cors-masking-error': -3, 'cors-missing-origin': 2 } },
        { id: 'preflight', label: 'נכשלה דווקא בקשת OPTIONS', next: 'cors.headers', facts: ['בקשת ה-Preflight נכשלה'], hypotheses: { 'cors-preflight': 4, 'cors-masking-error': -2 } },
        { id: 'none', label: 'לא רואה סטטוס (failed / CORS error)', next: 'cors.headers', facts: ['DevTools לא מציג סטטוס לבקשה'] },
      ],
    },
    {
      id: 'cors.headers',
      phase: 'request',
      question: 'מה אומרות כותרות Access-Control-* בתגובה?',
      options: [
        { id: 'missing', label: 'אין כותרת Access-Control-Allow-Origin', next: 'cors.contract', confirmed: ['התגובה אינה כוללת Access-Control-Allow-Origin'], hypotheses: { 'cors-missing-origin': 3 } },
        { id: 'other-origin', label: 'יש – אבל ל-Origin אחר', next: 'cors.contract', confirmed: ['Access-Control-Allow-Origin אינו תואם ל-Origin של האפליקציה'], hypotheses: { 'cors-missing-origin': 3, 'env-config-diff': 2 } },
        { id: 'wildcard-creds', label: 'Allow-Origin: * יחד עם Cookies / credentials', next: 'cors.contract', confirmed: ['נעשה שימוש ב-wildcard יחד עם credentials'], hypotheses: { 'cors-credentials': 4 } },
        { id: 'methods', label: 'השיטה / כותרת לא מופיעות ב-Allow-Methods / Allow-Headers', next: 'cors.contract', confirmed: ['השיטה או הכותרת המבוקשות אינן מאושרות ב-Preflight'], hypotheses: { 'cors-preflight': 3 } },
      ],
    },
    {
      id: 'cors.contract',
      phase: 'contract',
      question: 'האם ה-Origin של האפליקציה אמור להיות מאושר בסביבה הזו?',
      options: [
        { id: 'yes', label: 'כן – הוא ברשימת המקורות המאושרים', next: null, facts: ['ה-Origin אמור להיות מאושר'], hypotheses: { 'env-config-diff': 2 }, checks: ['check-env-config'] },
        { id: 'new', label: 'זה Origin חדש (פורט מקומי / סביבה חדשה)', next: null, facts: ['ה-Origin חדש ואולי אינו מוגדר'], hypotheses: { 'cors-missing-origin': 2, 'env-config-diff': 1 } },
        { id: 'unknown', label: 'לא ידוע', next: null, assumptions: ['רשימת ה-Origins המאושרים ידועה'] },
      ],
    },
  ],
};

export const ENV_MISMATCH: DiagnosticScenario = {
  id: 'env-mismatch',
  title: 'Environment Mismatch',
  shortTitle: 'ENV',
  category: 'contract',
  tagline: 'אותה פעולה מתנהגת אחרת בין סביבות.',
  meaning: 'כשהתנהגות שונה בין Dev / QA / UAT / Production, ההבדל בין הסביבות הוא הראיה. המטרה: למפות את ההבדלים (גרסה, קונפיגורציה, נתונים, תלויות, הרשאות) ולבודד אחד-אחד.',
  notProof: ['הבדל בין סביבות לא מוכיח באג – ייתכן שהקונפיגורציה שונה בכוונה.', 'מה שעובד ב-Production לא מוכיח שהסביבה האחרת "שבורה".'],
  demo: {
    request: `GET /v1/products/1001 HTTP/1.1
Host: qa-api.example.com   vs   uat-api.example.com`,
    response: `QA:  200 OK   { "price": 49.9, "currency": "ILS" }
UAT: 200 OK   { "price": 49.9, "currency": "USD" }`,
    note: 'אותה בקשה, אותו קוד סטטוס – ערך שונה. הבדל קונפיגורציה או נתונים?',
  },
  startNode: 'env.what',
  hypotheses: { 'env-config-diff': 2, 'env-data-diff': 2, 'env-version-diff': 2, 'token-wrong-env': 1 },
  checks: ['compare-envs', 'check-env-config'],
  evidence: ['אותה בקשה ותוצאתה בכל סביבה', 'גרסת build בכל סביבה', 'הבדלי קונפיגורציה רלוונטיים (ללא סודות)', 'הנתונים הרלוונטיים בכל סביבה'],
  nodes: [
    {
      id: 'env.what',
      phase: 'response',
      question: 'מה שונה בין הסביבות?',
      options: [
        { id: 'status', label: 'קוד סטטוס שונה', next: 'env.version', facts: ['קוד הסטטוס שונה בין הסביבות'], hypotheses: { 'env-version-diff': 1, 'env-config-diff': 1 } },
        { id: 'values', label: 'אותו מבנה, ערכים שונים', next: 'env.data', facts: ['מבנה התגובה זהה והערכים שונים'], hypotheses: { 'env-data-diff': 2, 'env-config-diff': 1 } },
        { id: 'shape', label: 'מבנה תגובה שונה (שדות נוספים/חסרים)', next: 'env.version', facts: ['מבנה התגובה שונה בין הסביבות'], hypotheses: { 'env-version-diff': 3, 'contract-drift': 2 }, checks: ['validate-response-schema'] },
      ],
    },
    {
      id: 'env.version',
      phase: 'environment',
      question: 'האם אותה גרסה פרוסה בשתי הסביבות?',
      options: [
        { id: 'different', label: 'לא – גרסאות שונות', next: null, confirmed: ['הסביבות מריצות גרסאות שונות'], hypotheses: { 'env-version-diff': 4 } },
        { id: 'same', label: 'כן – אותה גרסה', next: 'env.data', facts: ['אותה גרסה פרוסה בשתי הסביבות'], hypotheses: { 'env-version-diff': -3, 'env-config-diff': 2 } },
        { id: 'unknown', label: 'לא ידוע', next: 'env.data', assumptions: ['אותה גרסה פרוסה בשתי הסביבות'], checks: ['check-recent-deploys'] },
      ],
    },
    {
      id: 'env.data',
      phase: 'contract',
      question: 'האם הנתונים הרלוונטיים זהים בשתי הסביבות?',
      options: [
        { id: 'differ', label: 'לא – הנתונים שונים', next: null, confirmed: ['הנתונים הרלוונטיים שונים בין הסביבות'], hypotheses: { 'env-data-diff': 4 } },
        { id: 'same', label: 'כן – זהים', next: null, facts: ['הנתונים זהים בין הסביבות'], hypotheses: { 'env-data-diff': -3, 'env-config-diff': 3 }, checks: ['check-env-config'] },
        { id: 'unknown', label: 'לא בדקתי', next: null, assumptions: ['הנתונים זהים בין הסביבות'], checks: ['check-data-source'] },
      ],
    },
  ],
};

export const CONTRACT_MISMATCH: DiagnosticScenario = {
  id: 'contract-mismatch',
  title: 'API Contract Mismatch',
  shortTitle: 'Contract',
  category: 'contract',
  tagline: 'התגובה (או הבקשה) אינה תואמת לחוזה המתועד – גם אם הסטטוס 200.',
  meaning: 'אי-התאמת חוזה מתבטאת לרוב דווקא בתגובות "מוצלחות": שדה ששמו שונה, טיפוס שהשתנה, null במקום מערך, שדה חובה שחסר. ה-UI או הצרכן נשבר בעוד שה-API מחזיר 200.',
  notProof: ['200 OK אינו מוכיח שהתגובה נכונה.', 'התאמה לסכמה אינה מוכיחה נכונות עסקית של הערכים.', 'ייתכן שהתיעוד הוא שאינו מעודכן, ולא השירות.'],
  demo: {
    request: `GET /v1/orders/ORD-50017 HTTP/1.1
Host: api.example.com`,
    response: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "orderId": "ORD-50017",
  "total": "149.70",
  "items": null
}`,
    note: 'לפי החוזה: total הוא number ו-items הוא מערך (אולי ריק) – לא null.',
  },
  startNode: 'cm.where',
  hypotheses: { 'serialization-server': 2, 'contract-drift': 2, 'response-mapping': 1, 'env-version-diff': 1 },
  checks: ['validate-response-schema', 'compare-contract'],
  evidence: ['גוף התגובה המלא', 'הסכמה/התיעוד בגרסה הרלוונטית', 'רשימת השדות החורגים עם נתיבים', 'גרסת השירות והתיעוד'],
  nodes: [
    {
      id: 'cm.where',
      phase: 'response',
      question: 'איפה נצפתה אי-ההתאמה?',
      options: [
        { id: 'response', label: 'בתגובה של ה-API', next: 'cm.validate', facts: ['אי-ההתאמה נצפתה בתגובת ה-API'] },
        { id: 'ui-only', label: 'רק ב-UI – התגובה נראית תקינה', next: 'cm.ui', facts: ['אי-ההתאמה נצפתה רק בתצוגה'], hypotheses: { 'response-mapping': 3, 'serialization-server': -2 }, checks: ['check-ui-mapping'] },
      ],
    },
    {
      id: 'cm.validate',
      phase: 'contract',
      question: 'מה תוצאת אימות התגובה מול הסכמה (Contract Validator)?',
      options: [
        { id: 'fails', label: 'יש שגיאות ולידציה', next: 'cm.docs', confirmed: ['התגובה אינה עומדת בסכמה המתועדת'], hypotheses: { 'serialization-server': 2, 'contract-drift': 1 } },
        { id: 'passes', label: 'התגובה עוברת את הסכמה', next: null, facts: ['התגובה עומדת בסכמה'], hypotheses: { 'serialization-server': -3, 'response-mapping': 2, 'test-data': 1 }, checks: ['check-data-source'] },
        { id: 'no-schema', label: 'אין סכמה זמינה', next: 'cm.docs', assumptions: ['המבנה הצפוי ידוע ללא סכמה'] },
      ],
    },
    {
      id: 'cm.docs',
      phase: 'followup',
      question: 'האם התיעוד/הסכמה עודכנו לאחרונה, או שהשירות עודכן?',
      options: [
        { id: 'service-changed', label: 'השירות עודכן לאחרונה', next: null, facts: ['השירות עודכן לאחרונה'], hypotheses: { 'serialization-server': 2, 'recent-deploy': 2 }, checks: ['check-recent-deploys'] },
        { id: 'docs-changed', label: 'התיעוד עודכן לאחרונה', next: null, facts: ['התיעוד עודכן לאחרונה'], hypotheses: { 'contract-drift': 3 } },
        { id: 'unknown', label: 'לא ידוע', next: null, assumptions: ['התיעוד משקף את ההתנהגות המוסכמת'] },
      ],
    },
    {
      id: 'cm.ui',
      phase: 'followup',
      question: 'מה ה-UI עושה עם השדה הבעייתי?',
      options: [
        { id: 'wrong-field', label: 'קורא שדה בשם אחר', next: null, confirmed: ['ה-UI קורא שדה ששמו שונה מהשדה בתגובה'], hypotheses: { 'response-mapping': 4 } },
        { id: 'null', label: 'לא מטפל ב-null / מערך ריק', next: null, facts: ['ה-UI לא מטפל בערך null או מערך ריק'], hypotheses: { 'response-mapping': 3 } },
        { id: 'format', label: 'מציג בפורמט שגוי (תאריך/מטבע)', next: null, facts: ['ה-UI מציג את הערך בפורמט שגוי'], hypotheses: { 'response-mapping': 3 } },
      ],
    },
  ],
};
