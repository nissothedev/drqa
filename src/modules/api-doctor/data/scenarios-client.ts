import type { DiagnosticScenario } from '../../../types/diagnostics';

export const HTTP_400: DiagnosticScenario = {
  id: 'http-400',
  code: 400,
  title: 'HTTP 400 Bad Request',
  shortTitle: '400',
  category: 'client',
  tagline: 'השרת (או רכיב בדרך) לא עיבד את הבקשה כפי שנשלחה.',
  meaning:
    '400 אומר שהרכיב שענה החליט שהבקשה אינה תקינה מבחינתו: תחביר, מבנה, פרמטר או כותרת. זה קוד גנרי – שירותים שונים משתמשים בו גם לשגיאות ולידציה. הקוד מתאר את התגובה, לא את הצד האשם.',
  notProof: [
    '400 אינו מוכיח באג ב-Backend – ייתכן שהבקשה באמת שגויה.',
    '400 גם אינו מוכיח שהלקוח טעה – ייתכן שכלל הוולידציה בשרת שגוי או שהחוזה השתנה.',
    'הודעת השגיאה עלולה להיווצר ב-Gateway ולא בשירות עצמו.',
  ],
  demo: {
    request: `POST /v1/orders HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer demo-customer-token

{
  "customerId": "CUS-1001",
  "items": [{ "sku": "SKU-DS-1001", "quantity": "2" }],
}`,
    response: `HTTP/1.1 400 Bad Request
Content-Type: application/problem+json
X-Correlation-Id: demo-4f1c-0400

{
  "type": "https://api.example.com/problems/malformed-body",
  "title": "Malformed request body",
  "status": 400,
  "detail": "Unexpected token } at line 4",
  "traceId": "demo-4f1c-0400"
}`,
    note: 'פסיק מיותר לפני הסוגר } ו-quantity כמחרוזת – שתי בעיות שונות בבקשה אחת.',
  },
  startNode: '400.response',
  hypotheses: { 'payload-shape': 2, 'payload-syntax': 1, 'data-type': 1, 'headers-missing': 1, 'test-data': 1, 'server-validation-bug': 1, 'contract-drift': 1 },
  checks: ['read-error-body', 'capture-exact-request', 'compare-contract'],
  evidence: [
    'קוד הסטטוס וגוף השגיאה המלא (כולל traceId / correlationId)',
    'הבקשה המלאה: URL, שיטה, כותרות וגוף (ללא סודות אמיתיים)',
    'החוזה/התיעוד של ה-endpoint בגרסה הפרוסה',
    'סביבה, שעה ומשתמש הבדיקה (בדוי)',
    'תוצאת בקשה מינימלית תקינה לפי החוזה',
  ],
  nodes: [
    {
      id: '400.response',
      phase: 'response',
      question: 'מה מופיע בגוף התגובה של ה-400?',
      help: 'קראו את לשונית Response ולא רק את ההודעה ב-UI.',
      options: [
        { id: 'parse', label: 'שגיאת פענוח – Malformed / Unexpected token', next: '400.syntax', facts: ['גוף השגיאה מצביע על כשל בפענוח גוף הבקשה'], hypotheses: { 'payload-syntax': 3, 'content-type': 1 }, checks: ['validate-json-syntax'] },
        { id: 'field', label: 'שגיאת ולידציה שמציינת שדה ספציפי', description: 'למשל "items[0].quantity must be integer"', next: '400.contract', facts: ['גוף השגיאה מציין שדה ספציפי שנכשל'], hypotheses: { 'payload-shape': 2, 'data-type': 2, 'server-validation-bug': 1 } },
        { id: 'header', label: 'אזכור של כותרת או פרמטר query', next: '400.contract', facts: ['גוף השגיאה מתייחס לכותרת או לפרמטר'], hypotheses: { 'headers-missing': 3 }, checks: ['check-content-type'] },
        { id: 'generic', label: 'הודעה כללית / גוף ריק / HTML', next: '400.request', facts: ['השגיאה אינה מפרטת סיבה'], assumptions: ['ה-400 נוצר בשירות היעד ולא ברכיב ביניים'], hypotheses: { 'gateway-route': 1, 'headers-missing': 1 }, checks: ['correlation-logs', 'check-gateway-logs'] },
      ],
    },
    {
      id: '400.syntax',
      phase: 'request',
      question: 'האם גוף הבקשה שנשלח הוא JSON תקין?',
      help: 'העתיקו את ה-Payload (view source) ובדקו ב-JSON Studio.',
      options: [
        { id: 'invalid', label: 'לא – נמצאה שגיאת תחביר', next: '400.who-builds', confirmed: ['גוף הבקשה שנשלח אינו JSON תקין (אומת בבדיקת תחביר)'], hypotheses: { 'payload-syntax': 4 } },
        { id: 'valid', label: 'כן – ה-JSON תקין', next: '400.contract', facts: ['גוף הבקשה תקין תחבירית'], hypotheses: { 'payload-syntax': -4, 'content-type': 2 }, checks: ['check-content-type'] },
        { id: 'unchecked', label: 'עדיין לא בדקתי', next: '400.contract', assumptions: ['גוף הבקשה תקין תחבירית'], checks: ['validate-json-syntax'] },
      ],
    },
    {
      id: '400.who-builds',
      phase: 'followup',
      question: 'מי בנה את גוף הבקשה השגוי?',
      options: [
        { id: 'ui', label: 'קוד האפליקציה (UI)', next: null, facts: ['הבקשה השגויה נוצרה על ידי האפליקציה'], hypotheses: { 'ui-serialization': 3 } },
        { id: 'manual', label: 'אני – ידנית ב-Postman / cURL', next: null, facts: ['הבקשה נבנתה ידנית'], hypotheses: { 'test-data': 2, 'ui-serialization': -2 } },
        { id: 'automation', label: 'סקריפט אוטומציה / תבנית נתונים', next: null, facts: ['הבקשה נבנתה על ידי סקריפט בדיקה'], hypotheses: { 'test-data': 3, 'ui-serialization': -2 } },
      ],
    },
    {
      id: '400.request',
      phase: 'request',
      question: 'האם יש בידיכם הבקשה המלאה שנשלחה בפועל?',
      options: [
        { id: 'yes', label: 'כן – URL, כותרות וגוף', next: '400.contract', facts: ['הבקשה המלאה נלכדה'] },
        { id: 'partial', label: 'רק חלק (למשל URL והודעת שגיאה)', next: '400.contract', assumptions: ['החלקים שלא נלכדו בבקשה תקינים'], checks: ['capture-exact-request'] },
        { id: 'no', label: 'לא – רק תיאור מהמשתמש', next: '400.contract', assumptions: ['תיאור הפעולה מספיק כדי לשחזר את הבקשה'], checks: ['capture-exact-request'] },
      ],
    },
    {
      id: '400.contract',
      phase: 'contract',
      question: 'השוואת הבקשה לחוזה (OpenAPI / תיעוד) – מה נמצא?',
      help: 'בדקו שמות שדות, שדות חובה, טיפוסים ופורמטים. אפשר להיעזר ב-Contract Validator.',
      options: [
        { id: 'mismatch', label: 'הבקשה חורגת מהחוזה', description: 'שדה חסר, שם שגוי, טיפוס שגוי, ערך לא מותר', next: '400.mismatch-source', confirmed: ['נמצאה אי-התאמה בין הבקשה לחוזה המתועד'], hypotheses: { 'payload-shape': 3, 'data-type': 1, 'server-validation-bug': -2 } },
        { id: 'matches', label: 'הבקשה תואמת לחוזה במלואה', next: '400.minimal', facts: ['הבקשה תואמת לחוזה לפי השוואה ידנית'], hypotheses: { 'payload-shape': -3, 'server-validation-bug': 3, 'contract-drift': 2 }, checks: ['minimal-request', 'correlation-logs'] },
        { id: 'no-contract', label: 'אין חוזה / תיעוד זמין', next: '400.minimal', assumptions: ['ההתנהגות הצפויה ידועה למרות שאין מקור מתועד'], hypotheses: { 'contract-drift': 2 }, checks: ['minimal-request'] },
      ],
    },
    {
      id: '400.mismatch-source',
      phase: 'followup',
      question: 'מאיפה הגיעה הבקשה החורגת?',
      options: [
        { id: 'ui', label: 'מהאפליקציה – כך ה-UI שולח', next: null, facts: ['האפליקציה שולחת בקשה שאינה תואמת לחוזה'], hypotheses: { 'ui-serialization': 3 } },
        { id: 'test', label: 'מבדיקה ידנית או אוטומטית', next: null, facts: ['הבקשה החורגת נבנתה בתהליך הבדיקה'], hypotheses: { 'test-data': 3 } },
        { id: 'contract-changed', label: 'החוזה עודכן לאחרונה והלקוח לא', next: null, facts: ['החוזה עודכן לאחרונה'], hypotheses: { 'contract-drift': 3, 'recent-deploy': 1 }, checks: ['check-recent-deploys'] },
      ],
    },
    {
      id: '400.minimal',
      phase: 'followup',
      question: 'ניסוי מבוקר: שליחת בקשה מינימלית תקינה (רק שדות חובה) – מה התוצאה?',
      options: [
        { id: 'success', label: 'הבקשה המינימלית הצליחה', next: null, confirmed: ['בקשה מינימלית לפי החוזה מתקבלת – השגיאה תלויה בתוכן הבקשה המקורית'], hypotheses: { 'payload-shape': 2, 'data-type': 2, 'server-validation-bug': 1 } },
        { id: 'fails', label: 'גם הבקשה המינימלית נדחתה ב-400', next: null, facts: ['גם בקשה מינימלית לפי החוזה נדחית'], hypotheses: { 'headers-missing': 2, 'server-validation-bug': 2, 'gateway-route': 1, 'contract-drift': 1 }, checks: ['check-gateway-logs'] },
        { id: 'not-tried', label: 'לא ניסיתי עדיין', next: null, assumptions: ['השגיאה תלויה בתוכן הבקשה ולא בסביבה'], checks: ['minimal-request'] },
      ],
    },
  ],
};

export const HTTP_404: DiagnosticScenario = {
  id: 'http-404',
  code: 404,
  title: 'HTTP 404 Not Found',
  shortTitle: '404',
  category: 'client',
  tagline: 'הרכיב שענה לא מצא נתיב או משאב מתאים לבקשה.',
  meaning:
    '404 יכול לנבוע משני מצבים שונים מאוד: הנתיב עצמו לא קיים (URL, גרסה, base path, ניתוב) – או שהנתיב קיים אבל המשאב הספציפי (ID) לא נמצא. לעיתים שירותים מחזירים 404 גם כדי לא לחשוף קיום משאב שאין לכם הרשאה אליו.',
  notProof: [
    '404 לא מוכיח שהמשאב לא קיים במסד הנתונים – ייתכן סינון, הרשאות או מטמון.',
    '404 לא מוכיח שה-endpoint לא מומש – ייתכן שלא נפרס לסביבה.',
    'ייתכן שה-404 הגיע מה-Gateway ולא מהשירות.',
  ],
  demo: {
    request: `GET /v1/products/9999 HTTP/1.1
Host: api.example.com
Accept: application/json`,
    response: `HTTP/1.1 404 Not Found
Content-Type: application/problem+json
X-Correlation-Id: demo-9a2e-0404

{
  "title": "Product not found",
  "status": 404,
  "detail": "No product with id 9999",
  "traceId": "demo-9a2e-0404"
}`,
  },
  startNode: '404.kind',
  hypotheses: { 'url-path': 2, 'resource-missing': 2, 'route-not-deployed': 1, 'gateway-route': 1, 'test-data': 1 },
  checks: ['read-error-body', 'verify-route-docs'],
  evidence: ['ה-URL המלא שנשלח (כולל base path וגרסה)', 'גוף התגובה וכותרות המזהות את הרכיב שענה (Server, Via)', 'ה-ID המבוקש והאם הוא קיים בסביבה', 'תיעוד הנתיב לגרסה הפרוסה', 'תוצאת endpoint אחר באותו שירות'],
  nodes: [
    {
      id: '404.kind',
      phase: 'response',
      question: 'איך נראית תגובת ה-404?',
      help: 'תגובה בפורמט JSON של השירות שונה מאוד מדף HTML כללי של שרת/Gateway.',
      options: [
        { id: 'resource', label: 'JSON של השירות: "המשאב לא נמצא" עם ID', next: '404.id', facts: ['השירות עצמו החזיר 404 ברמת משאב'], hypotheses: { 'resource-missing': 3, 'url-path': -1, 'gateway-route': -2 }, checks: ['verify-resource-exists'] },
        { id: 'route', label: 'הודעה כללית / HTML / "Cannot GET"', next: '404.url', facts: ['ה-404 נראה כמו תשובת ניתוב כללית ולא כמו שגיאת משאב'], hypotheses: { 'url-path': 2, 'gateway-route': 2, 'route-not-deployed': 2, 'resource-missing': -2 }, checks: ['check-gateway-logs'] },
        { id: 'empty', label: 'גוף ריק', next: '404.url', facts: ['תגובת 404 ללא גוף'], assumptions: ['ה-404 הגיע מהשירות'], hypotheses: { 'url-path': 1, 'gateway-route': 1 } },
      ],
    },
    {
      id: '404.id',
      phase: 'request',
      question: 'האם ה-ID המבוקש קיים בסביבה זו?',
      options: [
        { id: 'missing', label: 'לא – הוא לא קיים (בדקתי ברשימה/בשאילתה)', next: '404.data-origin', confirmed: ['המשאב המבוקש אינו קיים בנתוני הסביבה'], hypotheses: { 'resource-missing': 4, 'test-data': 2 } },
        { id: 'exists', label: 'כן – הוא קיים, ובכל זאת 404', next: '404.contract', facts: ['המשאב קיים בנתוני הסביבה'], hypotheses: { 'resource-missing': -3, 'resource-ownership': 2, 'cache-stale': 1, 'env-data-diff': 1 }, checks: ['check-resource-ownership', 'correlation-logs'] },
        { id: 'unknown', label: 'לא בדקתי', next: '404.contract', assumptions: ['ה-ID קיים בסביבה'], checks: ['verify-resource-exists'] },
      ],
    },
    {
      id: '404.data-origin',
      phase: 'followup',
      question: 'מאיפה הגיע ה-ID החסר?',
      options: [
        { id: 'ui-link', label: 'מקישור / מסך באפליקציה', next: null, facts: ['האפליקציה הציגה הפניה למשאב שאינו קיים'], hypotheses: { 'response-mapping': 2, 'cache-stale': 1, 'env-data-diff': 1 }, checks: ['check-ui-mapping'] },
        { id: 'test-data', label: 'מנתוני בדיקה / סקריפט', next: null, facts: ['ה-ID הגיע מנתוני הבדיקה'], hypotheses: { 'test-data': 3 } },
        { id: 'other-env', label: 'הועתק מסביבה אחרת', next: null, facts: ['ה-ID הועתק מסביבה אחרת'], hypotheses: { 'env-data-diff': 3, 'test-data': 2 } },
      ],
    },
    {
      id: '404.url',
      phase: 'request',
      question: 'השוואת ה-URL לתיעוד – מה נמצא?',
      help: 'בדקו base path, גרסה (/v1), יחיד/רבים, סלאשים ורישיות.',
      options: [
        { id: 'typo', label: 'נמצאה טעות ב-URL', next: null, confirmed: ['ה-URL שנשלח שונה מהנתיב המתועד'], hypotheses: { 'url-path': 4, 'route-not-deployed': -2 } },
        { id: 'matches', label: 'ה-URL זהה לתיעוד', next: '404.other-endpoint', facts: ['ה-URL שנשלח תואם לתיעוד'], hypotheses: { 'url-path': -3, 'route-not-deployed': 2, 'gateway-route': 2 } },
        { id: 'no-docs', label: 'אין תיעוד להשוואה', next: '404.other-endpoint', assumptions: ['ה-URL הנכון ידוע'] },
      ],
    },
    {
      id: '404.other-endpoint',
      phase: 'followup',
      question: 'האם endpoint אחר באותו שירות (למשל GET /v1/products) עונה?',
      options: [
        { id: 'works', label: 'כן – שירות עונה, רק הנתיב הזה לא', next: null, facts: ['השירות נגיש; רק הנתיב הספציפי מחזיר 404'], hypotheses: { 'route-not-deployed': 3, 'env-version-diff': 1 }, checks: ['check-recent-deploys'] },
        { id: 'all-404', label: 'לא – כל הנתיבים מחזירים 404', next: null, facts: ['כל הנתיבים בשירות מחזירים 404'], hypotheses: { 'gateway-route': 3, 'url-path': 2 }, checks: ['check-gateway-logs'] },
        { id: 'not-tried', label: 'לא בדקתי', next: null, assumptions: ['השירות עצמו נגיש'] },
      ],
    },
    {
      id: '404.contract',
      phase: 'contract',
      question: 'לפי הדרישות, מה אמור לקרות כשמבקשים את המשאב הזה?',
      options: [
        { id: 'should-return', label: 'המשאב אמור להיות מוחזר למשתמש הזה', next: null, facts: ['לפי הדרישות המשאב אמור להיות נגיש'], hypotheses: { 'resource-ownership': -1, 'cache-stale': 1, 'env-data-diff': 1 }, checks: ['correlation-logs'] },
        { id: 'hidden', label: 'ייתכן שהוא מוסתר (הרשאה / סטטוס / מחיקה רכה)', next: null, facts: ['ייתכן שהמשאב מוסתר בכוונה'], hypotheses: { 'resource-ownership': 2, 'test-data': 1 } },
        { id: 'unclear', label: 'לא ברור מהדרישות', next: null, assumptions: ['ההתנהגות הצפויה ידועה'] },
      ],
    },
  ],
};

export const HTTP_405: DiagnosticScenario = {
  id: 'http-405',
  code: 405,
  title: 'HTTP 405 Method Not Allowed',
  shortTitle: '405',
  category: 'client',
  tagline: 'הנתיב מזוהה, אך שיטת ה-HTTP אינה נתמכת בו.',
  meaning: '405 אומר שהשרת מכיר את הנתיב אבל לא את השיטה שנשלחה עבורו. לפי התקן השרת צריך לצרף כותרת Allow עם השיטות המותרות. בפועל לא כל השרתים עושים זאת.',
  notProof: ['405 לא מוכיח שהקוד שגוי – לרוב הלקוח שולח שיטה או נתיב לא נכונים.', 'ייתכן ש-Gateway מחזיר 405 כי חוק הניתוב מגדיר רק חלק מהשיטות.'],
  demo: {
    request: `DELETE /v1/products HTTP/1.1
Host: api.example.com`,
    response: `HTTP/1.1 405 Method Not Allowed
Allow: GET, POST
Content-Type: application/problem+json

{ "title": "Method not allowed", "status": 405 }`,
  },
  startNode: '405.allow',
  hypotheses: { 'method-wrong': 3, 'url-path': 2, 'gateway-route': 1, 'contract-drift': 1 },
  checks: ['check-allow-header', 'verify-route-docs'],
  evidence: ['השיטה וה-URL שנשלחו', 'כותרת Allow בתגובה (אם קיימת)', 'תיעוד השיטות המותרות לנתיב', 'האם הנתיב הוא collection או פריט'],
  nodes: [
    {
      id: '405.allow',
      phase: 'response',
      question: 'מה כותרת Allow בתגובה?',
      options: [
        { id: 'listed-other', label: 'מופיעות שיטות אחרות (למשל GET, POST)', next: '405.target', facts: ['השרת מצהיר על שיטות מותרות שאינן כוללות את השיטה שנשלחה'], hypotheses: { 'method-wrong': 2 } },
        { id: 'missing', label: 'אין כותרת Allow', next: '405.target', facts: ['תגובת 405 ללא כותרת Allow'], hypotheses: { 'gateway-route': 1 } },
        { id: 'includes', label: 'השיטה שנשלחה דווקא מופיעה ב-Allow', next: '405.target', facts: ['השיטה שנשלחה מופיעה ב-Allow ובכל זאת התקבל 405'], hypotheses: { 'gateway-route': 3, 'method-wrong': -2, 'env-config-diff': 1 }, checks: ['check-gateway-logs'] },
      ],
    },
    {
      id: '405.target',
      phase: 'request',
      question: 'האם ה-URL מצביע על collection או על פריט – ותואם את הפעולה?',
      help: 'דוגמה: עדכון מוצר הוא PUT /v1/products/1001 ולא PUT /v1/products.',
      options: [
        { id: 'wrong-level', label: 'נשלח ל-collection במקום לפריט (או להפך)', next: null, confirmed: ['הבקשה נשלחה לרמת משאב שאינה מתאימה לפעולה'], hypotheses: { 'url-path': 3, 'method-wrong': 1 } },
        { id: 'docs-match', label: 'השיטה והנתיב תואמים לתיעוד', next: '405.contract', facts: ['השיטה והנתיב תואמים לתיעוד'], hypotheses: { 'method-wrong': -3, 'contract-drift': 2, 'route-not-deployed': 2, 'gateway-route': 1 } },
        { id: 'wrong-method', label: 'השיטה עצמה שגויה (למשל POST במקום PUT)', next: null, confirmed: ['השיטה שנשלחה שונה מהשיטה המתועדת'], hypotheses: { 'method-wrong': 4 } },
      ],
    },
    {
      id: '405.contract',
      phase: 'contract',
      question: 'האם הגרסה המתועדת פרוסה בסביבה?',
      options: [
        { id: 'yes', label: 'כן – זו הגרסה הפרוסה', next: null, facts: ['גרסת התיעוד תואמת לגרסה הפרוסה'], hypotheses: { 'gateway-route': 2, 'server-validation-bug': 0 }, checks: ['check-gateway-logs', 'correlation-logs'] },
        { id: 'no', label: 'לא / לא בטוח', next: null, assumptions: ['הגרסה הפרוסה כוללת את השיטה'], hypotheses: { 'route-not-deployed': 2, 'env-version-diff': 2 }, checks: ['check-recent-deploys'] },
      ],
    },
  ],
};

export const HTTP_409: DiagnosticScenario = {
  id: 'http-409',
  code: 409,
  title: 'HTTP 409 Conflict',
  shortTitle: '409',
  category: 'client',
  tagline: 'הבקשה מתנגשת עם המצב הנוכחי של המשאב.',
  meaning: '409 מציין שהבקשה תקינה כשלעצמה, אך אינה מתיישבת עם מצב המשאב: רשומה קיימת, גרסה ישנה, מעבר סטטוס אסור או בקשה כפולה. לעיתים זו בדיוק ההתנהגות הנכונה.',
  notProof: ['409 אינו באג כשלעצמו – ייתכן שהמערכת מגינה נכון מפני כפילות.', '409 לא מראה מי שינה את המשאב לפניכם.'],
  demo: {
    request: `POST /v1/orders HTTP/1.1
Host: api.example.com
Content-Type: application/json
Idempotency-Key: demo-dup-key

{ "customerId": "CUS-1001", "items": [{ "sku": "SKU-DS-1002", "quantity": 1 }] }`,
    response: `HTTP/1.1 409 Conflict
Content-Type: application/problem+json

{
  "title": "Duplicate request",
  "status": 409,
  "detail": "An order with this Idempotency-Key already exists",
  "existingOrderId": "ORD-50017"
}`,
  },
  startNode: '409.body',
  hypotheses: { 'state-conflict': 2, 'duplicate-request': 2, concurrency: 1, 'test-data': 1 },
  checks: ['read-error-body', 'check-resource-state'],
  evidence: ['גוף השגיאה (סוג ההתנגשות)', 'מצב וגרסת המשאב לפני ואחרי', 'מספר הבקשות שנשלחו ב-Network', 'נתוני הבדיקה וההיסטוריה שלהם'],
  nodes: [
    {
      id: '409.body',
      phase: 'response',
      question: 'מה סוג ההתנגשות לפי גוף השגיאה?',
      options: [
        { id: 'duplicate', label: 'כפילות – "כבר קיים"', next: '409.requests', facts: ['השגיאה מצביעה על כפילות'], hypotheses: { 'duplicate-request': 3, 'test-data': 1 }, checks: ['check-idempotency'] },
        { id: 'version', label: 'גרסה / ETag לא תואמים', next: '409.requests', facts: ['השגיאה מצביעה על אי-התאמת גרסה'], hypotheses: { concurrency: 3, 'state-conflict': 1 } },
        { id: 'status', label: 'מעבר סטטוס לא מותר (למשל ביטול הזמנה שנשלחה)', next: '409.contract', facts: ['השגיאה מצביעה על מעבר סטטוס לא מותר'], hypotheses: { 'state-conflict': 3 } },
        { id: 'stock', label: 'מלאי / משאב לא זמין', next: '409.contract', facts: ['השגיאה מצביעה על חוסר זמינות משאב (מלאי)'], hypotheses: { 'state-conflict': 2, 'test-data': 2 }, checks: ['check-data-source'] },
      ],
    },
    {
      id: '409.requests',
      phase: 'request',
      question: 'כמה בקשות נשלחו בפועל לפעולה הזו?',
      options: [
        { id: 'two', label: 'שתיים או יותר בהפרש קצר', next: null, confirmed: ['אותה פעולה נשלחה יותר מפעם אחת'], hypotheses: { 'duplicate-request': 3, concurrency: 1 } },
        { id: 'one', label: 'בקשה אחת בלבד', next: '409.contract', facts: ['נשלחה בקשה אחת בלבד'], hypotheses: { 'duplicate-request': -2, 'test-data': 2, concurrency: 1 } },
        { id: 'unknown', label: 'לא בדקתי', next: '409.contract', assumptions: ['נשלחה בקשה אחת בלבד'], checks: ['check-idempotency'] },
      ],
    },
    {
      id: '409.contract',
      phase: 'contract',
      question: 'לפי הדרישות, האם ההתנגשות צפויה במצב הזה?',
      options: [
        { id: 'expected', label: 'כן – זו התנהגות נכונה', next: null, facts: ['ה-409 תואם להתנהגות המתועדת'], hypotheses: { 'test-data': 2, 'state-conflict': 1 } },
        { id: 'unexpected', label: 'לא – הפעולה הייתה אמורה להצליח', next: null, facts: ['לפי הדרישות הפעולה הייתה אמורה להצליח'], hypotheses: { 'state-conflict': 1, concurrency: 1, 'cache-stale': 1 }, checks: ['correlation-logs', 'check-resource-state'] },
        { id: 'unclear', label: 'הדרישות לא מגדירות', next: null, assumptions: ['ההתנהגות הצפויה מוסכמת למרות שאינה מתועדת'] },
      ],
    },
  ],
};

export const HTTP_415: DiagnosticScenario = {
  id: 'http-415',
  code: 415,
  title: 'HTTP 415 Unsupported Media Type',
  shortTitle: '415',
  category: 'client',
  tagline: 'השרת אינו תומך בפורמט התוכן שנשלח (Content-Type).',
  meaning: '415 נובע כמעט תמיד מכותרת Content-Type חסרה או שגויה, או מגוף בפורמט שהשירות אינו מקבל (למשל form-data במקום JSON).',
  notProof: ['415 אינו מעיד על גוף שגוי – לרוב רק הכותרת שגויה.', 'תיקון ב-Postman לא מוכיח שהאפליקציה שולחת את הכותרת הנכונה.'],
  demo: {
    request: `POST /v1/orders HTTP/1.1
Host: api.example.com
Content-Type: text/plain

{ "customerId": "CUS-1001", "items": [] }`,
    response: `HTTP/1.1 415 Unsupported Media Type
Accept-Post: application/json

{ "title": "Unsupported media type", "status": 415, "detail": "Expected application/json" }`,
  },
  startNode: '415.header',
  hypotheses: { 'content-type': 4, 'ui-serialization': 1, 'client-test-tool': 1 },
  checks: ['check-content-type', 'capture-exact-request'],
  evidence: ['כותרת Content-Type שנשלחה', 'פורמט הגוף בפועל', 'הפורמט שהחוזה מגדיר', 'הכלי ששלח את הבקשה'],
  nodes: [
    {
      id: '415.header',
      phase: 'request',
      question: 'מה ערך Content-Type בבקשה שנשלחה?',
      options: [
        { id: 'missing', label: 'הכותרת חסרה', next: '415.tool', confirmed: ['כותרת Content-Type לא נשלחה'], hypotheses: { 'content-type': 3 } },
        { id: 'other', label: 'ערך אחר (text/plain, form-data וכו׳)', next: '415.tool', confirmed: ['Content-Type שנשלח שונה מ-application/json'], hypotheses: { 'content-type': 3 } },
        { id: 'json', label: 'application/json', next: '415.contract', facts: ['Content-Type הוא application/json'], hypotheses: { 'content-type': -3, 'contract-drift': 2, 'gateway-route': 1 } },
      ],
    },
    {
      id: '415.tool',
      phase: 'followup',
      question: 'מאיזה כלי נשלחה הבקשה?',
      options: [
        { id: 'postman', label: 'Postman', description: 'בדקו Body ← raw ← JSON', next: null, hypotheses: { 'client-test-tool': 2 }, facts: ['הבקשה נשלחה מ-Postman'] },
        { id: 'app', label: 'האפליקציה', next: null, hypotheses: { 'ui-serialization': 3 }, facts: ['הבקשה נשלחה מהאפליקציה'] },
        { id: 'script', label: 'סקריפט אוטומציה', next: null, hypotheses: { 'test-data': 2 }, facts: ['הבקשה נשלחה מסקריפט'] },
      ],
    },
    {
      id: '415.contract',
      phase: 'contract',
      question: 'איזה פורמט מגדיר החוזה עבור ה-endpoint?',
      options: [
        { id: 'json', label: 'application/json', next: null, facts: ['החוזה מגדיר application/json'], hypotheses: { 'gateway-route': 1, 'contract-drift': 1, 'headers-missing': 1 }, checks: ['correlation-logs'] },
        { id: 'other', label: 'פורמט אחר (למשל multipart לקבצים)', next: null, facts: ['החוזה מגדיר פורמט אחר מזה שנשלח'], hypotheses: { 'content-type': 3 } },
      ],
    },
  ],
};

export const HTTP_422: DiagnosticScenario = {
  id: 'http-422',
  code: 422,
  title: 'HTTP 422 Unprocessable Content',
  shortTitle: '422',
  category: 'client',
  tagline: 'התחביר תקין, אך התוכן לא עבר כללי ולידציה.',
  meaning: '422 משמש שירותים רבים לשגיאות ולידציה: JSON תקין שאינו עומד בכללים (שדה חובה חסר, טווח, enum, כלל עסקי). חלק מהשירותים משתמשים ב-400 לאותו מצב – החוזה קובע.',
  notProof: ['422 לא מוכיח שהכלל בשרת נכון – יש להשוות לדרישות.', 'ההבחנה בין 400 ל-422 היא החלטת עיצוב של ה-API, לא כלל אוניברסלי.'],
  demo: {
    request: `POST /v1/orders HTTP/1.1
Host: api.example.com
Content-Type: application/json

{ "customerId": "CUS-1001", "items": [{ "sku": "SKU-DS-1001", "quantity": 0 }] }`,
    response: `HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "title": "Validation failed",
  "status": 422,
  "errors": [
    { "field": "items[0].quantity", "message": "must be >= 1" },
    { "field": "shippingAddress", "message": "is required" }
  ]
}`,
  },
  startNode: '422.errors',
  hypotheses: { 'payload-shape': 2, 'data-type': 1, 'test-data': 2, 'server-validation-bug': 1, 'contract-drift': 1 },
  checks: ['read-error-body', 'compare-contract'],
  evidence: ['רשימת שגיאות הוולידציה עם נתיבי השדות', 'הבקשה המלאה', 'כללי הוולידציה המתועדים', 'הנתונים העסקיים הרלוונטיים (מלאי, סטטוס)'],
  nodes: [
    {
      id: '422.errors',
      phase: 'response',
      question: 'מה מציינות שגיאות הוולידציה?',
      options: [
        { id: 'required', label: 'שדה חובה חסר', next: '422.contract', facts: ['השגיאה מציינת שדה חובה חסר'], hypotheses: { 'payload-shape': 3 } },
        { id: 'range', label: 'ערך מחוץ לטווח / enum / פורמט', next: '422.contract', facts: ['השגיאה מציינת ערך לא מותר'], hypotheses: { 'test-data': 2, 'data-type': 1 } },
        { id: 'business', label: 'כלל עסקי (למשל "מוצר לא פעיל")', next: '422.business', facts: ['השגיאה מציינת כלל עסקי'], hypotheses: { 'test-data': 2, 'env-data-diff': 1 }, checks: ['check-data-source'] },
        { id: 'none', label: 'אין פירוט', next: '422.contract', facts: ['תגובת 422 ללא פירוט'], hypotheses: { 'server-validation-bug': 1 }, checks: ['correlation-logs'] },
      ],
    },
    {
      id: '422.contract',
      phase: 'contract',
      question: 'לפי החוזה – האם הערך שנשלח היה אמור להתקבל?',
      options: [
        { id: 'should-fail', label: 'לא – הוולידציה צודקת', next: '422.origin', confirmed: ['הערך שנשלח אינו עומד בחוזה – הדחייה תואמת לכלל המתועד'], hypotheses: { 'server-validation-bug': -3, 'payload-shape': 1 } },
        { id: 'should-pass', label: 'כן – הערך תקין לפי החוזה', next: null, facts: ['לפי החוזה הערך היה אמור להתקבל'], hypotheses: { 'server-validation-bug': 3, 'contract-drift': 2 }, checks: ['minimal-request', 'correlation-logs'] },
        { id: 'unclear', label: 'החוזה לא מגדיר', next: null, assumptions: ['הכלל המצופה ידוע למרות שאינו מתועד'], hypotheses: { 'contract-drift': 2 } },
      ],
    },
    {
      id: '422.origin',
      phase: 'followup',
      question: 'מי שלח את הערך הלא תקין?',
      options: [
        { id: 'ui', label: 'האפליקציה – למרות שהמשתמש מילא נכון', next: null, facts: ['האפליקציה שולחת ערך שאינו תואם לקלט המשתמש'], hypotheses: { 'ui-serialization': 3 } },
        { id: 'ui-allowed', label: 'האפליקציה אפשרה למשתמש להזין ערך לא תקין', next: null, facts: ['ה-UI לא מונע קלט שהשרת דוחה'], hypotheses: { 'ui-serialization': 1, 'contract-drift': 1 } },
        { id: 'test', label: 'בדיקה ידנית / אוטומטית', next: null, facts: ['הערך נשלח מתהליך הבדיקה'], hypotheses: { 'test-data': 3 } },
      ],
    },
    {
      id: '422.business',
      phase: 'followup',
      question: 'האם הנתון העסקי (למשל סטטוס המוצר) אכן במצב שהשגיאה מתארת?',
      options: [
        { id: 'yes', label: 'כן – למשל המוצר באמת לא פעיל', next: null, confirmed: ['מצב הנתונים תואם להודעת השגיאה'], hypotheses: { 'test-data': 3, 'server-validation-bug': -2 } },
        { id: 'no', label: 'לא – הנתון במצב תקין', next: null, facts: ['מצב הנתונים אינו תואם להודעת השגיאה'], hypotheses: { 'cache-stale': 2, 'server-validation-bug': 2, 'env-data-diff': 1 }, checks: ['correlation-logs'] },
      ],
    },
  ],
};
