export type GlossaryCategory = 'http' | 'api' | 'data' | 'tools' | 'process' | 'quality' | 'security';

export const GLOSSARY_CATEGORIES: Record<GlossaryCategory, string> = {
  http: 'HTTP ורשת',
  api: 'API וחוזים',
  data: 'נתונים ו-SQL',
  tools: 'כלים',
  process: 'תהליכי בדיקה',
  quality: 'ניהול איכות',
  security: 'אימות ואבטחה',
};

export interface GlossaryTerm {
  id: string;
  term: string;
  he: string;
  category: GlossaryCategory;
  definition: string;
  example?: string;
  pitfall?: string;
  related?: string[];
}

export const GLOSSARY: GlossaryTerm[] = [
  { id: 'http', term: 'HTTP', he: 'פרוטוקול העברת היפר-טקסט', category: 'http', definition: 'פרוטוקול בקשה-תגובה שבו לקוח שולח בקשה (שיטה, נתיב, כותרות, גוף) ושרת מחזיר תגובה (קוד סטטוס, כותרות, גוף). HTTP עצמו חסר מצב (stateless) – כל בקשה עומדת בפני עצמה.', example: 'GET /v1/products HTTP/1.1', related: ['http-method', 'status-code', 'header'] },
  { id: 'https', term: 'HTTPS / TLS', he: 'HTTP מוצפן', category: 'http', definition: 'HTTP מעל שכבת TLS שמצפינה את התעבורה ומאמתת את זהות השרת באמצעות תעודה דיגיטלית.', pitfall: 'תעודה שפג תוקפה או שאינה מהימנה גורמת לכשל חיבור עוד לפני שנשלחת בקשת HTTP.', related: ['http'] },
  { id: 'http-method', term: 'HTTP Method', he: 'שיטת HTTP', category: 'http', definition: 'הפעולה המבוקשת על המשאב: GET (קריאה), POST (יצירה/פעולה), PUT (החלפה), PATCH (עדכון חלקי), DELETE (מחיקה). GET, PUT ו-DELETE מוגדרות כ-idempotent.', example: 'PATCH /v1/orders/ORD-50017', related: ['idempotency', 'status-405'] },
  { id: 'status-code', term: 'Status Code', he: 'קוד סטטוס', category: 'http', definition: 'מספר תלת-ספרתי בתגובה: 2xx הצלחה, 3xx הפניה, 4xx בעיה שהשרת מייחס לבקשה, 5xx כשל בצד השרת. הקוד מתאר את התגובה – לא את שורש הבעיה.', pitfall: '4xx אינו מוכיח שהלקוח טעה, ו-5xx אינו מזהה את הרכיב הכושל.', related: ['status-400', 'status-500'] },
  { id: 'status-400', term: '400 Bad Request', he: 'בקשה שגויה', category: 'http', definition: 'הרכיב שענה לא עיבד את הבקשה כפי שנשלחה: תחביר, מבנה, פרמטר או כותרת. קוד גנרי שמשמש גם לשגיאות ולידציה.', related: ['status-422', 'payload'] },
  { id: 'status-401', term: '401 Unauthorized', he: 'לא מאומת', category: 'security', definition: 'למרות השם – עוסק באימות זהות (Authentication): לא התקבלה הוכחת זהות תקפה. התגובה כוללת לרוב WWW-Authenticate.', pitfall: 'לא לבלבל עם 403: ב-401 הזהות לא אומתה; ב-403 הזהות ידועה אך אין הרשאה.', related: ['status-403', 'authentication', 'jwt'] },
  { id: 'status-403', term: '403 Forbidden', he: 'אסור', category: 'security', definition: 'השרת הבין את הבקשה אך מסרב לבצע אותה – בדרך כלל חוסר הרשאה (Authorization), בדיקת בעלות או חסימת WAF.', related: ['status-401', 'authorization'] },
  { id: 'status-404', term: '404 Not Found', he: 'לא נמצא', category: 'http', definition: 'לא נמצא נתיב או משאב מתאים. יש להבחין בין נתיב שאינו קיים לבין משאב (ID) שאינו קיים.', related: ['endpoint'] },
  { id: 'status-405', term: '405 Method Not Allowed', he: 'שיטה לא מותרת', category: 'http', definition: 'הנתיב מזוהה אך השיטה אינה נתמכת. התגובה אמורה לכלול כותרת Allow.', related: ['http-method'] },
  { id: 'status-409', term: '409 Conflict', he: 'התנגשות', category: 'http', definition: 'הבקשה מתנגשת עם מצב המשאב – כפילות, גרסה ישנה או מעבר סטטוס אסור.', related: ['idempotency'] },
  { id: 'status-415', term: '415 Unsupported Media Type', he: 'סוג תוכן לא נתמך', category: 'http', definition: 'פורמט הגוף או כותרת Content-Type אינם נתמכים על ידי ה-endpoint.', related: ['content-type'] },
  { id: 'status-422', term: '422 Unprocessable Content', he: 'תוכן שלא ניתן לעבד', category: 'http', definition: 'התחביר תקין אך התוכן לא עבר כללי ולידציה. חלק מה-APIs משתמשים ב-400 לאותו מצב – החוזה קובע.', related: ['status-400', 'json-schema'] },
  { id: 'status-429', term: '429 Too Many Requests', he: 'יותר מדי בקשות', category: 'http', definition: 'חריגה ממגבלת קצב. לעיתים מצורפת כותרת Retry-After.', related: ['rate-limit'] },
  { id: 'status-500', term: '500 Internal Server Error', he: 'שגיאת שרת פנימית', category: 'http', definition: 'כשל בעיבוד הבקשה בצד השרת שלא תורגם לשגיאה ספציפית. מציין איפה נוצרה התגובה – לא את שורש הבעיה.', related: ['rca', 'correlation-id'] },
  { id: 'status-502', term: '502 Bad Gateway', he: 'שער שגוי', category: 'http', definition: 'רכיב ביניים (Gateway / LB / Proxy) קיבל תגובה לא תקינה, או לא קיבל, מהשירות שמאחוריו.', related: ['api-gateway', 'upstream'] },
  { id: 'status-503', term: '503 Service Unavailable', he: 'שירות לא זמין', category: 'http', definition: 'השירות זמנית אינו יכול לטפל בבקשות – תחזוקה, עומס או היעדר מופעים בריאים.', related: ['status-502'] },
  { id: 'status-504', term: '504 Gateway Timeout', he: 'פסק זמן בשער', category: 'http', definition: 'רכיב ביניים לא קיבל תגובה מה-upstream בזמן. מזהה מי ויתר – לא מי איטי.', related: ['timeout', 'api-gateway'] },
  { id: 'header', term: 'Header', he: 'כותרת', category: 'http', definition: 'צמד שם-ערך שמלווה בקשה או תגובה ונושא מטא-מידע: סוג תוכן, אימות, מטמון, מזהי מעקב.', example: 'Content-Type: application/json', related: ['content-type', 'authorization-header'] },
  { id: 'content-type', term: 'Content-Type', he: 'סוג תוכן', category: 'http', definition: 'כותרת שמציינת את פורמט הגוף שנשלח. עבור JSON: application/json.', pitfall: 'גוף JSON עם Content-Type: text/plain עלול לקבל 415 או 400.', related: ['status-415', 'accept'] },
  { id: 'accept', term: 'Accept', he: 'פורמט מבוקש', category: 'http', definition: 'כותרת בבקשה שמציינת אילו פורמטים הלקוח מוכן לקבל בתגובה.', related: ['content-type'] },
  { id: 'query-param', term: 'Query Parameter', he: 'פרמטר שאילתה', category: 'api', definition: 'צמד מפתח-ערך ב-URL אחרי ?, בדרך כלל לסינון, מיון ועימוד.', example: '/v1/products?category=lamps&limit=20', related: ['endpoint', 'pagination'] },
  { id: 'cors', term: 'CORS', he: 'שיתוף משאבים בין מקורות', category: 'security', definition: 'מנגנון שהדפדפן אוכף: קריאה מ-Origin אחד ל-API ב-Origin אחר מותרת רק אם התגובה כוללת כותרות Access-Control-* מתאימות.', pitfall: 'Postman אינו אוכף CORS – הצלחה בו לא מוכיחה ש-CORS תקין.', related: ['preflight', 'origin'] },
  { id: 'preflight', term: 'Preflight Request', he: 'בקשה מקדימה', category: 'security', definition: 'בקשת OPTIONS שהדפדפן שולח לפני בקשות "לא פשוטות" כדי לברר אם השרת מאשר את השיטה והכותרות.', related: ['cors'] },
  { id: 'origin', term: 'Origin', he: 'מקור', category: 'security', definition: 'השילוב של פרוטוקול, מארח ופורט. https://shop.example.com ו-https://api.example.com הם Origins שונים.', related: ['cors'] },
  { id: 'timeout', term: 'Timeout', he: 'פסק זמן', category: 'http', definition: 'פרק הזמן המקסימלי שרכיב ממתין לתגובה לפני שהוא מוותר. לכל שכבה (לקוח, Gateway, שירות, תלות) יש timeout משלה.', pitfall: 'Timeout אינו מזהה את הרכיב האיטי.', related: ['status-504'] },
  { id: 'dns', term: 'DNS', he: 'מערכת שמות מתחם', category: 'http', definition: 'המערכת שמתרגמת שם מארח (api.example.com) לכתובת IP. כשל DNS מתרחש לפני שהבקשה יוצאת.', related: ['timeout'] },
  { id: 'rest', term: 'REST', he: 'סגנון ארכיטקטורה REST', category: 'api', definition: 'סגנון לתכנון APIs סביב משאבים (resources) עם נתיבים, שיטות HTTP וקודי סטטוס סטנדרטיים.', example: 'GET /v1/orders/ORD-50017', related: ['endpoint', 'http-method'] },
  { id: 'api', term: 'API', he: 'ממשק תכנות יישומים', category: 'api', definition: 'ממשק מוגדר שדרכו רכיבי תוכנה מתקשרים. ב-QA בדרך כלל מתייחסים ל-Web API מעל HTTP.', related: ['rest', 'endpoint'] },
  { id: 'endpoint', term: 'Endpoint', he: 'נקודת קצה', category: 'api', definition: 'שילוב של שיטה ונתיב שמבצע פעולה מוגדרת ב-API.', example: 'POST /v1/orders', related: ['api', 'http-method'] },
  { id: 'payload', term: 'Payload / Body', he: 'גוף הבקשה / תגובה', category: 'api', definition: 'התוכן הנשלח בגוף בקשה או תגובה – לרוב JSON.', related: ['json', 'json-schema'] },
  { id: 'json', term: 'JSON', he: 'פורמט JSON', category: 'api', definition: 'פורמט טקסט לנתונים מובנים: אובייקטים, מערכים, מחרוזות, מספרים, true/false ו-null. מחרוזות ושמות שדות במירכאות כפולות בלבד.', pitfall: 'הערות, פסיק מסיים וגרשיים בודדים אינם חוקיים ב-JSON.', related: ['payload', 'json-schema'] },
  { id: 'json-schema', term: 'JSON Schema', he: 'סכמת JSON', category: 'api', definition: 'שפה לתיאור מבנה JSON: טיפוסים, שדות חובה, ערכים מותרים, טווחים ופורמטים. משמשת לאימות אוטומטי של payloads.', pitfall: 'עמידה בסכמה אינה מוכיחה נכונות עסקית.', related: ['contract', 'openapi'] },
  { id: 'contract', term: 'API Contract', he: 'חוזה API', category: 'api', definition: 'ההגדרה המוסכמת של ה-API: נתיבים, שיטות, בקשות, תגובות, קודי שגיאה ואימות. משמש קנה מידה לקביעה מי חורג.', related: ['openapi', 'json-schema'] },
  { id: 'openapi', term: 'OpenAPI (Swagger)', he: 'מפרט OpenAPI', category: 'api', definition: 'תקן לתיאור מכונה-קריא של REST APIs, הכולל סכמות JSON לבקשות ולתגובות.', related: ['contract'] },
  { id: 'idempotency', term: 'Idempotency', he: 'אידמפוטנטיות', category: 'api', definition: 'תכונה של פעולה שביצועה כמה פעמים זהה בתוצאתו לביצוע יחיד. מפתח Idempotency-Key מאפשר retry בטוח לפעולות יצירה.', related: ['status-409', 'http-method'] },
  { id: 'pagination', term: 'Pagination', he: 'עימוד', category: 'api', definition: 'החזרת תוצאות בחלקים (page/limit או cursor) כדי למנוע תגובות ענקיות ואיטיות.', related: ['query-param'] },
  { id: 'rate-limit', term: 'Rate Limiting', he: 'הגבלת קצב', category: 'api', definition: 'הגבלת מספר הבקשות בחלון זמן לפי משתמש, מפתח או IP.', related: ['status-429'] },
  { id: 'api-gateway', term: 'API Gateway', he: 'שער API', category: 'api', definition: 'רכיב כניסה שמנתב בקשות לשירותים, ולעיתים אוכף אימות, הגבלת קצב ו-CORS. מקור נפוץ של 502/503/504.', related: ['status-502', 'upstream'] },
  { id: 'upstream', term: 'Upstream / Downstream', he: 'שירות במעלה / במורד הזרם', category: 'api', definition: 'מנקודת מבט של Gateway – upstream הוא השירות שאליו מועברת הבקשה. מנקודת מבט של שירות – downstream הוא תלות שהוא קורא לה. המונחים משמשים בצורה לא אחידה; הקפידו להגדיר הקשר.', related: ['api-gateway'] },
  { id: 'authentication', term: 'Authentication', he: 'אימות זהות', category: 'security', definition: 'בירור מי אתה – סיסמה, טוקן, Cookie של סשן.', related: ['authorization', 'status-401'] },
  { id: 'authorization', term: 'Authorization', he: 'הרשאה', category: 'security', definition: 'בירור מה מותר לך לעשות – roles, scopes, בעלות על משאבים.', related: ['authentication', 'status-403'] },
  { id: 'authorization-header', term: 'Authorization Header', he: 'כותרת אימות', category: 'security', definition: 'כותרת שבה הלקוח שולח פרטי אימות, לרוב בצורה Bearer <token>. למרות שמה – משמשת לאימות זהות.', pitfall: 'לעולם אל תשתפו ערך טוקן אמיתי בדיווח באג או בכלי חיצוני.', related: ['jwt'] },
  { id: 'jwt', term: 'JWT', he: 'טוקן JSON Web Token', category: 'security', definition: 'טוקן חתום בפורמט header.payload.signature הנושא claims כמו sub, exp, aud, iss, scope. ה-payload מקודד – לא מוצפן.', pitfall: 'אל תדביקו JWT אמיתי באתרי פענוח חיצוניים.', related: ['authorization-header', 'status-401'] },
  { id: 'cookie', term: 'Cookie / Session', he: 'עוגייה / סשן', category: 'security', definition: 'נתון שהדפדפן שומר ושולח אוטומטית לאותו דומיין; משמש לעיתים לאימות סשן. כלים כמו Postman לא שולחים אותו אוטומטית.', related: ['authentication', 'cors'] },
  { id: 'correlation-id', term: 'Correlation ID', he: 'מזהה קורלציה', category: 'process', definition: 'מזהה ייחודי שמלווה בקשה לאורך כל הרכיבים (X-Correlation-Id, X-Request-Id, traceparent) ומאפשר למצוא אותה בלוגים.', example: 'X-Correlation-Id: demo-77b0-0500', related: ['rca', 'logs'] },
  { id: 'logs', term: 'Logs', he: 'לוגים / יומני רישום', category: 'process', definition: 'רשומות שרכיבים כותבים בזמן ריצה. ראיה חשובה – אך שורת לוג מתארת סימפטום ברכיב, לא בהכרח את הסיבה הראשונית.', related: ['correlation-id'] },
  { id: 'devtools', term: 'DevTools', he: 'כלי מפתחים בדפדפן', category: 'tools', definition: 'כלי הדפדפן (F12) הכולל לשוניות Network, Console, Application ועוד. Network מציג כל בקשה, כותרות, גוף, סטטוס ותזמון.', related: ['postman', 'curl'] },
  { id: 'postman', term: 'Postman', he: 'כלי Postman', category: 'tools', definition: 'כלי לבניית ושליחת בקשות API, ניהול סביבות ומשתנים וכתיבת בדיקות.', pitfall: 'בקשה ב-Postman אינה זהה אוטומטית לבקשה מהדפדפן (Cookies, Origin, כותרות).', related: ['curl', 'devtools'] },
  { id: 'curl', term: 'cURL', he: 'כלי שורת פקודה cURL', category: 'tools', definition: 'כלי שורת פקודה לשליחת בקשות HTTP. Copy as cURL ב-DevTools מייצא בקשה מלאה לשחזור.', pitfall: 'cURL שהועתק מהדפדפן עלול לכלול Cookies וטוקנים אמיתיים – נקו לפני שיתוף.', related: ['postman'] },
  { id: 'sql', term: 'SQL', he: 'שפת שאילתות מובנית', category: 'data', definition: 'שפה לשאילתות ועדכון של מסדי נתונים יחסיים. ב-QA משמשת בעיקר לאימות נתונים (SELECT) – בהרשאת קריאה בלבד.', related: ['join', 'null'] },
  { id: 'join', term: 'JOIN', he: 'צירוף טבלאות', category: 'data', definition: 'שילוב שורות משתי טבלאות לפי עמודה משותפת. INNER JOIN מחזיר רק התאמות; LEFT JOIN שומר את כל שורות הטבלה השמאלית.', related: ['sql'] },
  { id: 'null', term: 'NULL', he: 'ערך חסר', category: 'data', definition: 'סימון להיעדר ערך – שונה ממחרוזת ריקה או 0. בודקים עם IS NULL ולא עם = NULL.', related: ['sql'] },
  { id: 'source-of-truth', term: 'Source of Truth', he: 'מקור האמת', category: 'data', definition: 'המערכת או הטבלה הסמכותית לנתון מסוים. אימות נתונים מתחיל שם – לא ב-UI.', related: ['sql'] },
  { id: 'smoke', term: 'Smoke Testing', he: 'בדיקות עשן', category: 'process', definition: 'סט קצר של בדיקות קריטיות שמוודא שהמערכת "עומדת" אחרי פריסה, לפני בדיקות מעמיקות.', related: ['regression', 'sanity'] },
  { id: 'sanity', term: 'Sanity Testing', he: 'בדיקות שפיות', category: 'process', definition: 'בדיקה ממוקדת שתיקון או שינוי מסוים עובד, בלי כיסוי רחב.', related: ['smoke'] },
  { id: 'regression', term: 'Regression Testing', he: 'בדיקות רגרסיה', category: 'process', definition: 'בדיקה שיכולות קיימות לא נפגעו משינוי. היקף הרגרסיה נגזר מניתוח השפעת השינוי.', related: ['smoke', 'impact-analysis'] },
  { id: 'impact-analysis', term: 'Impact Analysis', he: 'ניתוח השפעה', category: 'process', definition: 'הערכת האזורים שעשויים להיות מושפעים משינוי – לצורך תכנון בדיקות. תמיד הערכה, לא ודאות.', related: ['regression'] },
  { id: 'boundary', term: 'Boundary Value Analysis', he: 'ניתוח ערכי גבול', category: 'process', definition: 'טכניקה שבודקת ערכים בגבולות הטווח ומעבר להם (min-1, min, max, max+1), שם מתרכזות שגיאות.', related: ['equivalence'] },
  { id: 'equivalence', term: 'Equivalence Partitioning', he: 'חלוקה למחלקות שקילות', category: 'process', definition: 'חלוקת הקלט לקבוצות שהמערכת אמורה לטפל בהן באופן זהה, ובדיקת נציג מכל קבוצה.', related: ['boundary'] },
  { id: 'severity', term: 'Severity', he: 'חומרה', category: 'quality', definition: 'מידת ההשפעה הטכנית/עסקית של הבאג על המערכת – נקבעת בעיקר על ידי QA לפי ההשפעה.', pitfall: 'Severity אינה Priority: באג קוסמטי בדף הבית יכול להיות בחומרה נמוכה ובעדיפות גבוהה.', related: ['priority'] },
  { id: 'priority', term: 'Priority', he: 'עדיפות', category: 'quality', definition: 'מידת הדחיפות לתקן – החלטה עסקית/מוצרית שמביאה בחשבון לוחות זמנים, לקוחות וסיכון.', related: ['severity'] },
  { id: 'rca', term: 'RCA – Root Cause Analysis', he: 'ניתוח שורש הבעיה', category: 'quality', definition: 'תהליך לזיהוי הסיבה הבסיסית לתקלה (ולא רק הסימפטום), כדי למנוע הישנות. דורש ראיות – לא רק צמידות בזמן.', related: ['correlation-id', 'five-whys'] },
  { id: 'five-whys', term: '5 Whys', he: 'חמשת הלמה', category: 'quality', definition: 'טכניקת RCA שבה שואלים "למה?" שוב ושוב עד שמגיעים לסיבה שניתן לפעול עליה.', related: ['rca'] },
  { id: 'flaky', term: 'Flaky Test', he: 'בדיקה לא יציבה', category: 'quality', definition: 'בדיקה שעוברת ונכשלת לסירוגין ללא שינוי בקוד – לרוב בגלל המתנות, תלות בנתונים או סדר ריצה.', related: ['explicit-wait'] },
  { id: 'explicit-wait', term: 'Explicit Wait', he: 'המתנה מפורשת', category: 'tools', definition: 'המתנה בבדיקה אוטומטית עד שתנאי מתקיים (אלמנט נראה, לחיץ) – במקום sleep קבוע.', related: ['flaky', 'pom'] },
  { id: 'pom', term: 'Page Object Model', he: 'מודל אובייקט עמוד', category: 'tools', definition: 'תבנית באוטומציה שבה כל עמוד מיוצג במחלקה שמרכזת לוקייטורים ופעולות, ומפרידה אותם מהבדיקות עצמן.', related: ['explicit-wait'] },
  { id: 'test-case', term: 'Test Case', he: 'מקרה בדיקה', category: 'process', definition: 'תיאור מובנה: מזהה, כותרת, תנאים מקדימים, נתוני בדיקה, צעדים ותוצאה צפויה.', related: ['boundary'] },
  { id: 'environment', term: 'Environment', he: 'סביבה', category: 'process', definition: 'מופע של המערכת לצורך מסוים: Dev, QA, UAT, Production. נבדלות בגרסה, קונפיגורציה, נתונים והרשאות.', related: ['feature-flag'] },
  { id: 'feature-flag', term: 'Feature Flag', he: 'דגל תכונה', category: 'process', definition: 'מתג קונפיגורציה שמפעיל או מכבה יכולת בלי פריסה. הבדל בדגלים בין סביבות מסביר הבדלי התנהגות רבים.', related: ['environment'] },
];

export function termById(id: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.id === id);
}
