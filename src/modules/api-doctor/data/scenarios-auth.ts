import type { DiagnosticScenario } from '../../../types/diagnostics';

export const HTTP_401: DiagnosticScenario = {
  id: 'http-401',
  code: 401,
  title: 'HTTP 401 Unauthorized',
  shortTitle: '401',
  category: 'auth',
  tagline: 'הבקשה לא נשאה אימות זהות תקף (Authentication).',
  meaning:
    'למרות השם "Unauthorized", קוד 401 עוסק באימות זהות: השרת לא קיבל הוכחת זהות תקפה – טוקן חסר, פג, פגום או לא מוכר. לפי התקן התגובה כוללת כותרת WWW-Authenticate. אם הזהות ידועה אך אין הרשאה – הקוד המתאים הוא 403.',
  notProof: [
    '401 לא אומר שלמשתמש אין הרשאה לפעולה – הוא אומר שהזהות לא אומתה.',
    'שחזור ב-Postman עם טוקן אחר לא מוכיח בעיית שרת – הטוקנים שונים.',
    'ייתכן שה-401 מגיע מה-Gateway לפני שהבקשה הגיעה לשירות.',
  ],
  demo: {
    request: `GET /v1/orders HTTP/1.1
Host: api.example.com
Authorization: Bearer demo-expired-token`,
    response: `HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token", error_description="The access token expired"
Content-Type: application/problem+json

{ "title": "Unauthorized", "status": 401 }`,
    note: 'הטוקנים כאן בדויים לחלוטין. לעולם אל תדביקו טוקן אמיתי בכלים חיצוניים או בדיווח.',
  },
  startNode: '401.header',
  hypotheses: { 'token-missing': 1, 'token-expired': 2, 'token-wrong-env': 1, 'token-malformed': 1, 'session-cookie': 1 },
  checks: ['check-auth-header-format', 'decode-token'],
  evidence: ['האם נשלחה כותרת Authorization (בלי להעתיק את ערך הטוקן)', 'כותרת WWW-Authenticate בתגובה', 'מועד תפוגה ו-audience של הטוקן', 'הסביבה שאליה נשלחה הבקשה והסביבה שבה הונפק הטוקן', 'האם האימות מבוסס Cookie או Header'],
  nodes: [
    {
      id: '401.header',
      phase: 'request',
      question: 'האם הבקשה נשאה כותרת Authorization (או Cookie של סשן)?',
      help: 'בדקו ב-Request Headers. אל תעתיקו את ערך הטוקן לשום מקום.',
      options: [
        { id: 'none', label: 'לא נשלח שום אמצעי אימות', next: '401.why-none', confirmed: ['הבקשה נשלחה ללא אמצעי אימות'], hypotheses: { 'token-missing': 4, 'token-expired': -2 } },
        { id: 'bearer', label: 'נשלחה כותרת Authorization: Bearer …', next: '401.www', facts: ['נשלחה כותרת Authorization'], hypotheses: { 'token-missing': -3 } },
        { id: 'cookie', label: 'רק Cookie של סשן', next: '401.www', facts: ['האימות נשען על Cookie של סשן'], hypotheses: { 'session-cookie': 2, 'token-missing': -1 } },
        { id: 'malformed', label: 'נשלחה כותרת אבל בפורמט חשוד (חסר Bearer, מירכאות)', next: '401.www', confirmed: ['פורמט כותרת האימות אינו תקני'], hypotheses: { 'token-malformed': 4 } },
      ],
    },
    {
      id: '401.why-none',
      phase: 'followup',
      question: 'מאיזה כלי נשלחה הבקשה ללא אימות?',
      options: [
        { id: 'app', label: 'מהאפליקציה – בעוד שבקשות אחרות כן נושאות טוקן', next: null, facts: ['באפליקציה, רק חלק מהבקשות נושאות טוקן'], hypotheses: { 'ui-serialization': 2, 'token-missing': 1 } },
        { id: 'postman', label: 'מ-Postman – לא הוגדר Auth', next: null, facts: ['ב-Postman לא הוגדר אימות'], hypotheses: { 'client-test-tool': 3 } },
        { id: 'curl-copy', label: 'מ-cURL שהועתק מהדפדפן', next: null, facts: ['הבקשה הועתקה מהדפדפן'], hypotheses: { 'session-cookie': 3, 'client-test-tool': 2 }, checks: ['compare-tools'] },
      ],
    },
    {
      id: '401.www',
      phase: 'response',
      question: 'מה מציינת כותרת WWW-Authenticate או גוף השגיאה?',
      options: [
        { id: 'expired', label: 'error="invalid_token" / "expired"', next: '401.env', facts: ['השרת מציין טוקן לא תקף או פג'], hypotheses: { 'token-expired': 3 } },
        { id: 'audience', label: 'audience / issuer לא תואמים', next: '401.env', facts: ['השרת מציין אי-התאמת audience או issuer'], hypotheses: { 'token-wrong-env': 4 } },
        { id: 'generic', label: 'אין פירוט', next: '401.env', facts: ['התגובה לא מפרטת את סיבת הדחייה'], assumptions: ['ה-401 נוצר בשירות ולא ב-Gateway'], checks: ['check-gateway-logs'] },
      ],
    },
    {
      id: '401.env',
      phase: 'environment',
      question: 'האם הטוקן הונפק לאותה סביבה שאליה נשלחה הבקשה, ומה מצב התוקף שלו?',
      options: [
        { id: 'expired', label: 'exp בעבר – הטוקן פג', next: null, confirmed: ['מועד התפוגה של הטוקן עבר'], hypotheses: { 'token-expired': 4, 'token-wrong-env': -1 } },
        { id: 'other-env', label: 'הונפק לסביבה אחרת', next: null, confirmed: ['הטוקן הונפק לסביבה שונה מזו שאליה נשלח'], hypotheses: { 'token-wrong-env': 4 } },
        { id: 'valid', label: 'בתוקף ולסביבה הנכונה', next: '401.contract', facts: ['הטוקן בתוקף והונפק לסביבה הנכונה'], hypotheses: { 'token-expired': -3, 'token-wrong-env': -3, 'policy-config': 1, 'env-config-diff': 2 }, checks: ['correlation-logs'] },
        { id: 'unknown', label: 'לא בדקתי', next: null, assumptions: ['הטוקן בתוקף ומתאים לסביבה'], checks: ['decode-token'] },
      ],
    },
    {
      id: '401.contract',
      phase: 'contract',
      question: 'האם השיטה (Bearer / Cookie / API key) תואמת למה שה-endpoint מצפה לו?',
      options: [
        { id: 'mismatch', label: 'לא – ה-endpoint מצפה לסוג אימות אחר', next: null, confirmed: ['סוג האימות שנשלח שונה מהנדרש ב-endpoint'], hypotheses: { 'token-malformed': 2, 'contract-drift': 1 } },
        { id: 'match', label: 'כן – תואם', next: null, facts: ['סוג האימות תואם לנדרש'], hypotheses: { 'env-config-diff': 1, 'policy-config': 1 }, checks: ['check-gateway-logs'] },
      ],
    },
  ],
};

export const HTTP_403: DiagnosticScenario = {
  id: 'http-403',
  code: 403,
  title: 'HTTP 403 Forbidden',
  shortTitle: '403',
  category: 'auth',
  tagline: 'השרת הבין את הבקשה אך מסרב לבצע אותה (Authorization).',
  meaning:
    '403 אומר בדרך כלל שהזהות מוכרת (או שאימות לא ישנה את התוצאה), אך אין הרשאה לפעולה או למשאב: role חסר, scope חסר, בדיקת בעלות, או חסימה ברמת Gateway/WAF. אימות מחדש עם אותו משתמש לרוב לא יעזור.',
  notProof: [
    '403 לא תמיד מגיע מהשירות – WAF או Gateway עשויים לחסום לפי IP או חוק.',
    '403 אינו בהכרח באג – ייתכן שזו בדיוק מדיניות ההרשאות הרצויה.',
    'הצלחה עם משתמש admin לא מוכיחה שהמדיניות שגויה.',
  ],
  demo: {
    request: `DELETE /v1/products/1001 HTTP/1.1
Host: api.example.com
Authorization: Bearer demo-customer-token`,
    response: `HTTP/1.1 403 Forbidden
Content-Type: application/problem+json

{
  "title": "Forbidden",
  "status": 403,
  "detail": "Role 'customer' cannot perform 'products:delete'"
}`,
  },
  startNode: '403.source',
  hypotheses: { 'role-missing': 3, 'resource-ownership': 1, 'policy-config': 1, 'waf-block': 1, 'test-data': 1 },
  checks: ['read-error-body', 'check-user-roles'],
  evidence: ['גוף התגובה ומי ייצר אותה (שירות / Gateway / WAF)', 'ה-roles וה-scopes של משתמש הבדיקה', 'ההרשאה הנדרשת לפעולה לפי הדרישות', 'בעלות על המשאב', 'תוצאה עם משתמש בדיקה בעל הרשאה'],
  nodes: [
    {
      id: '403.source',
      phase: 'response',
      question: 'מי נראה כמי שייצר את ה-403?',
      help: 'תגובת JSON בפורמט של השירות שונה מדף חסימה של WAF/Gateway (HTML, מזהה אירוע).',
      options: [
        { id: 'service', label: 'השירות – JSON עם פירוט הרשאה', next: '403.who', facts: ['ה-403 הגיע מהשירות עם פירוט הרשאה'], hypotheses: { 'waf-block': -2, 'role-missing': 1 } },
        { id: 'gateway', label: 'דף חסימה / מזהה אירוע / HTML', next: '403.network', facts: ['ה-403 נראה כמו חסימה ברמת Gateway או WAF'], hypotheses: { 'waf-block': 4, 'role-missing': -2 }, checks: ['check-gateway-logs'] },
        { id: 'unclear', label: 'לא ברור', next: '403.who', assumptions: ['ה-403 הגיע מהשירות'] },
      ],
    },
    {
      id: '403.network',
      phase: 'environment',
      question: 'האם החסימה תלויה ברשת או בתוכן הבקשה?',
      options: [
        { id: 'network', label: 'מעמדה/רשת אחרת זה עובד', next: null, facts: ['התוצאה משתנה לפי הרשת שממנה נשלחת הבקשה'], hypotheses: { 'waf-block': 3, 'vpn-proxy': 2 }, checks: ['check-network-path'] },
        { id: 'payload', label: 'רק בקשות עם תוכן מסוים נחסמות', next: null, facts: ['החסימה תלויה בתוכן הבקשה'], hypotheses: { 'waf-block': 3 } },
        { id: 'all', label: 'כל הבקשות נחסמות', next: null, facts: ['כל הבקשות נחסמות'], hypotheses: { 'policy-config': 2, 'env-config-diff': 2 } },
      ],
    },
    {
      id: '403.who',
      phase: 'request',
      question: 'האם משתמש בדיקה בעל ההרשאה הנדרשת מצליח באותה פעולה?',
      options: [
        { id: 'privileged-ok', label: 'כן – משתמש עם הרשאה מתאימה מצליח', next: '403.contract', confirmed: ['הפעולה מצליחה עם משתמש בעל הרשאה מתאימה – ה-403 תלוי בהרשאות המשתמש'], hypotheses: { 'role-missing': 3, 'policy-config': -1 } },
        { id: 'all-fail', label: 'לא – גם משתמש מורשה נחסם', next: '403.contract', facts: ['גם משתמש מורשה נחסם'], hypotheses: { 'role-missing': -2, 'policy-config': 3, 'env-config-diff': 2 }, checks: ['check-env-config'] },
        { id: 'own-resource', label: 'רק משאבים של משתמשים אחרים נחסמים', next: '403.contract', facts: ['רק גישה למשאבים של משתמש אחר נחסמת'], hypotheses: { 'resource-ownership': 4, 'role-missing': -2 }, checks: ['check-resource-ownership'] },
        { id: 'not-tried', label: 'לא ניסיתי', next: '403.contract', assumptions: ['למשתמש הבדיקה יש את ההרשאה הנדרשת'], checks: ['check-user-roles'] },
      ],
    },
    {
      id: '403.contract',
      phase: 'contract',
      question: 'לפי דרישות ההרשאות, האם המשתמש הזה אמור להצליח בפעולה?',
      options: [
        { id: 'should-deny', label: 'לא – החסימה צפויה', next: null, facts: ['לפי הדרישות המשתמש אינו אמור להצליח'], hypotheses: { 'test-data': 2, 'policy-config': -2 } },
        { id: 'should-allow', label: 'כן – הוא אמור להצליח', next: null, facts: ['לפי הדרישות המשתמש אמור להצליח'], hypotheses: { 'policy-config': 3, 'role-missing': 1 }, checks: ['correlation-logs', 'check-env-config'] },
        { id: 'unclear', label: 'הדרישות לא מגדירות', next: null, assumptions: ['מדיניות ההרשאות המצופה ידועה'] },
      ],
    },
  ],
};

export const HTTP_429: DiagnosticScenario = {
  id: 'http-429',
  code: 429,
  title: 'HTTP 429 Too Many Requests',
  shortTitle: '429',
  category: 'auth',
  tagline: 'חריגה ממגבלת קצב (rate limit) שהוגדרה.',
  meaning: '429 אומר שהלקוח (לפי משתמש, מפתח, IP או אחר) שלח יותר בקשות ממה שמותר בחלון זמן. התגובה כוללת לעיתים Retry-After. זה מנגנון הגנה מכוון – השאלה היא אם החריגה מוצדקת.',
  notProof: ['429 לא אומר שהשירות עמוס – רק שמגבלה הופעלה.', '429 לא מראה מי עוד חולק את אותה מכסה.'],
  demo: {
    request: `GET /v1/products?search=lamp HTTP/1.1
Host: api.example.com`,
    response: `HTTP/1.1 429 Too Many Requests
Retry-After: 30
RateLimit-Limit: 60
RateLimit-Remaining: 0

{ "title": "Too many requests", "status": 429 }`,
  },
  startNode: '429.volume',
  hypotheses: { 'rate-limit-client': 2, 'rate-limit-shared': 1, 'rate-limit-config': 1 },
  checks: ['check-rate-headers', 'check-retry-loop'],
  evidence: ['כותרות Retry-After / RateLimit-*', 'מספר הבקשות בדקה האחרונה (Network)', 'האם מפתח/משתמש/IP משותפים', 'מגבלות מתועדות לסביבה'],
  nodes: [
    {
      id: '429.volume',
      phase: 'request',
      question: 'כמה בקשות לאותו endpoint נשלחו בדקה האחרונה (לפי Network)?',
      options: [
        { id: 'many', label: 'עשרות-מאות – כנראה לולאה / retry', next: '429.pattern', confirmed: ['הלקוח שלח כמות חריגה של בקשות בחלון זמן קצר'], hypotheses: { 'rate-limit-client': 4 } },
        { id: 'few', label: 'מעט בקשות', next: '429.shared', facts: ['הלקוח שלח מעט בקשות'], hypotheses: { 'rate-limit-client': -3, 'rate-limit-shared': 2, 'rate-limit-config': 2 } },
        { id: 'unknown', label: 'לא בדקתי', next: '429.shared', assumptions: ['הלקוח אינו שולח כמות חריגה של בקשות'], checks: ['check-retry-loop'] },
      ],
    },
    {
      id: '429.pattern',
      phase: 'followup',
      question: 'מה מייצר את ריבוי הבקשות?',
      options: [
        { id: 'ui-loop', label: 'האפליקציה (רינדור חוזר / polling)', next: null, facts: ['האפליקציה שולחת בקשות חוזרות'], hypotheses: { 'rate-limit-client': 2, 'ui-serialization': 1 } },
        { id: 'retry', label: 'retry ללא השהיה', next: null, facts: ['מנגנון retry שולח בקשות ללא backoff'], hypotheses: { 'rate-limit-client': 2 } },
        { id: 'test', label: 'בדיקות אוטומטיות / עומס', next: null, facts: ['בדיקות אוטומטיות שולחות בקשות רבות'], hypotheses: { 'rate-limit-client': 1, 'test-data': 1 } },
      ],
    },
    {
      id: '429.shared',
      phase: 'environment',
      question: 'האם המכסה משותפת לאחרים (אותו API key, משתמש בדיקה או IP)?',
      options: [
        { id: 'shared', label: 'כן – כמה בודקים/סקריפטים משתמשים באותם פרטים', next: '429.contract', facts: ['המכסה משותפת למספר משתמשים או תהליכים'], hypotheses: { 'rate-limit-shared': 3 } },
        { id: 'private', label: 'לא – רק אני', next: '429.contract', facts: ['המכסה אינה משותפת'], hypotheses: { 'rate-limit-shared': -2, 'rate-limit-config': 2 } },
        { id: 'unknown', label: 'לא ידוע', next: '429.contract', assumptions: ['המכסה אינה משותפת עם אחרים'] },
      ],
    },
    {
      id: '429.contract',
      phase: 'contract',
      question: 'מה המגבלה המתועדת לסביבה, ומה ראיתם בכותרות?',
      options: [
        { id: 'lower', label: 'המגבלה בפועל נמוכה מהמתועדת', next: null, facts: ['המגבלה בפועל נמוכה מהמתועד'], hypotheses: { 'rate-limit-config': 3, 'env-config-diff': 2 }, checks: ['check-env-config'] },
        { id: 'as-doc', label: 'תואמת לתיעוד – והחריגה אמיתית', next: null, facts: ['המגבלה תואמת לתיעוד'], hypotheses: { 'rate-limit-client': 1, 'rate-limit-shared': 1 } },
        { id: 'no-doc', label: 'אין תיעוד למגבלה', next: null, assumptions: ['המגבלה הנוכחית היא ההתנהגות המתוכננת'] },
      ],
    },
  ],
};
