import type { Hypothesis, Layer } from '../../../types/diagnostics';

export const LAYER_LABEL: Record<Layer, string> = {
  client: 'לקוח / בקשה',
  network: 'רשת',
  gateway: 'Gateway / Proxy',
  auth: 'אימות והרשאות',
  service: 'שירות Backend',
  data: 'נתונים',
  dependency: 'תלות חיצונית',
  config: 'קונפיגורציה',
  infra: 'תשתית',
  test: 'בדיקה / נתוני בדיקה',
};

const list: Hypothesis[] = [
  // ---------- Request construction ----------
  { id: 'payload-shape', layer: 'client', title: 'גוף הבקשה אינו תואם לחוזה', description: 'שדה חובה חסר, שם שדה שגוי (למשל productId במקום product_id) או מבנה מקונן שונה מהמצופה.' },
  { id: 'payload-syntax', layer: 'client', title: 'גוף הבקשה אינו JSON תקין', description: 'פסיק מיותר, גרשיים בודדים, מירכאה חסרה או תוכן שנחתך – השרת לא מצליח לפענח את הגוף.' },
  { id: 'data-type', layer: 'client', title: 'טיפוס נתונים שגוי בשדה', description: 'למשל quantity נשלח כמחרוזת "2" במקום מספר 2, או null בשדה שאינו מאפשר null.' },
  { id: 'ui-serialization', layer: 'client', title: 'ה-UI בונה או מסדר את הבקשה באופן שגוי', description: 'מיפוי שגוי בין טופס המסך לבין גוף הבקשה, המרת טיפוסים, או שדה שלא נאסף מהטופס.' },
  { id: 'headers-missing', layer: 'client', title: 'כותרת או פרמטר נדרשים חסרים / שגויים', description: 'כותרת כמו Accept, X-Request-Id או פרמטר query שהשירות מצפה לו לא נשלחו או נשלחו בפורמט שגוי.' },
  { id: 'content-type', layer: 'client', title: 'Content-Type חסר או לא תואם לגוף', description: 'הגוף הוא JSON אך הכותרת חסרה, או שנשלח text/plain / multipart במקום application/json.' },
  { id: 'url-path', layer: 'client', title: 'URL, base path או גרסת API שגויים', description: 'למשל /v2 במקום /v1, /product במקום /products, סלאש מיותר או base URL של סביבה אחרת.' },
  { id: 'method-wrong', layer: 'client', title: 'שיטת HTTP שגויה לנתיב', description: 'שליחת POST לנתיב שמקבל רק GET, או PUT במקום PATCH.' },
  { id: 'large-payload', layer: 'client', title: 'בקשה כבדה מדי', description: 'שליפה ללא עימוד (pagination), סינון רחב מדי או גוף גדול שגורמים לעיבוד ארוך.' },
  { id: 'duplicate-request', layer: 'client', title: 'בקשה כפולה / חוסר Idempotency', description: 'לחיצה כפולה, retry אוטומטי או שליחה חוזרת של אותה פעולה שיוצרת התנגשות.' },
  { id: 'rate-limit-client', layer: 'client', title: 'הלקוח שולח יותר מדי בקשות', description: 'לולאת רינדור, polling תכוף, retry אגרסיבי ללא backoff או בדיקת עומס שרצה במקביל.' },
  { id: 'response-mapping', layer: 'client', title: 'ה-UI ממפה את התגובה באופן שגוי', description: 'התגובה תקינה אך המסך קורא שדה בשם אחר, מניח טיפוס אחר או לא מטפל ב-null / מערך ריק.' },
  { id: 'wrong-port-host', layer: 'client', title: 'כתובת מארח או פורט שגויים', description: 'הבקשה מופנית ל-host או port שאינם של השירות (למשל localhost:8080 במקום 8081).' },
  { id: 'dns-typo', layer: 'client', title: 'שגיאת כתיב בשם המארח', description: 'שם host עם אות חסרה/מיותרת או סביבה שגויה בתת-הדומיין.' },

  // ---------- Auth ----------
  { id: 'token-missing', layer: 'auth', title: 'כותרת Authorization לא נשלחה', description: 'הטוקן לא צורף לבקשה – למשל interceptor שלא רץ, או Postman ללא הגדרת Auth.' },
  { id: 'token-expired', layer: 'auth', title: 'הטוקן פג תוקף', description: 'טוקן שהיה תקין בעבר אך ה-exp שלו עבר; נפוץ כשמעתיקים טוקן ל-Postman ומשתמשים בו מאוחר יותר.' },
  { id: 'token-wrong-env', layer: 'auth', title: 'הטוקן הונפק לסביבה או Audience אחרים', description: 'טוקן מסביבת QA שנשלח ל-UAT, או aud / iss שאינם תואמים למה שהשירות מצפה.' },
  { id: 'token-malformed', layer: 'auth', title: 'פורמט כותרת האימות שגוי', description: 'חסרה המילה Bearer, יש רווח/מירכאות מיותרים, או נשלח טוקן חלקי.' },
  { id: 'session-cookie', layer: 'auth', title: 'תלות ב-Cookie או Session שלא הועבר', description: 'בדפדפן האימות מבוסס Cookie; בכלי אחר ה-Cookie לא נשלח ולכן הבקשה נראית לא מאומתת.' },
  { id: 'role-missing', layer: 'auth', title: 'למשתמש חסרים Role או Scope נדרשים', description: 'הזהות תקינה, אך אין לה הרשאה לפעולה – למשל משתמש customer שמנסה פעולת admin.' },
  { id: 'resource-ownership', layer: 'auth', title: 'המשאב שייך למשתמש אחר', description: 'בדיקת בעלות (object-level authorization) דוחה גישה להזמנה של משתמש אחר.' },
  { id: 'policy-config', layer: 'config', title: 'מדיניות הרשאות שונה בסביבה', description: 'מיפוי Roles או Scopes מוגדר אחרת בסביבה הנוכחית.' },
  { id: 'waf-block', layer: 'gateway', title: 'חסימה ברמת Gateway / WAF / IP', description: 'כלל אבטחה בשכבת הכניסה חוסם את הבקשה לפני שהיא מגיעה לשירות.' },

  // ---------- Routing ----------
  { id: 'route-not-deployed', layer: 'config', title: 'הנתיב לא נפרס או לא רשום בסביבה', description: 'הקוד קיים בענף אחר או בגרסה שעדיין לא נפרסה לסביבה הנבדקת.' },
  { id: 'resource-missing', layer: 'data', title: 'המשאב המבוקש לא קיים בסביבה זו', description: 'הנתיב תקין, אך ה-ID (למשל מוצר 9999) לא קיים בנתוני הסביבה.' },
  { id: 'gateway-route', layer: 'gateway', title: 'חוק ניתוב ב-Gateway / Proxy לא תואם', description: 'prefix, rewrite או mapping שגויים גורמים לבקשה להגיע לנתיב אחר או לא להגיע כלל.' },
  { id: 'gateway-misconfig', layer: 'gateway', title: 'יעד upstream שגוי ב-Gateway', description: 'ה-Gateway מפנה לכתובת/פורט/שירות שגוי או לא קיים.' },

  // ---------- State ----------
  { id: 'state-conflict', layer: 'data', title: 'מצב המשאב מתנגש עם הפעולה', description: 'למשל ניסיון לבטל הזמנה שכבר נשלחה, או עדכון עם גרסה (ETag/version) ישנה.' },
  { id: 'concurrency', layer: 'service', title: 'עדכונים מקבילים (race condition)', description: 'שתי פעולות על אותו משאב באותו זמן; אחת מהן נדחית או דורסת את השנייה.' },
  { id: 'cache-stale', layer: 'service', title: 'מטמון מחזיר תוכן ישן', description: 'CDN, Gateway או מטמון בשירות מחזירים נתונים שאינם מעודכנים.' },

  // ---------- Server ----------
  { id: 'server-validation-bug', layer: 'service', title: 'כלל ולידציה בשרת דוחה קלט שתקין לפי החוזה', description: 'השירות אוכף כלל שאינו מתועד או שגוי – רק השערה עד להשוואה מבוקרת מול החוזה.' },
  { id: 'contract-drift', layer: 'service', title: 'החוזה או התיעוד אינם מסונכרנים בין הצדדים', description: 'השירות עודכן והתיעוד/הלקוח לא – או להפך.' },
  { id: 'serialization-server', layer: 'service', title: 'השרת מחזיר מבנה שונה מהחוזה', description: 'שם שדה שונה, טיפוס שונה, null במקום מערך ריק או שדה חובה שחסר בתגובה.' },
  { id: 'unhandled-exception', layer: 'service', title: 'חריגה לא מטופלת בקוד השירות', description: 'מצב בקוד שלא טופל (למשל null reference) שמסתיים בתגובת 500 גנרית.' },
  { id: 'bad-input-unhandled', layer: 'service', title: 'קלט חריג שלא נדחה בוולידציה גורם לכשל', description: 'קלט שהיה אמור לקבל 4xx עובר הלאה וגורם לחריגה עמוק יותר בקוד.' },
  { id: 'db-error', layer: 'data', title: 'כשל בשאילתה או בחיבור למסד הנתונים', description: 'הפרת אילוץ, שאילתה שגויה, חיבור שנדחה או מאגר חיבורים מלא.' },
  { id: 'slow-query', layer: 'data', title: 'שאילתה איטית או נעילות במסד', description: 'חוסר באינדקס, סריקה מלאה או נעילה שמעכבים את התגובה.' },
  { id: 'dependency-failure', layer: 'dependency', title: 'שירות תלוי (downstream) נכשל', description: 'השירות קורא לשירות אחר (למשל מלאי או תשלום) שמחזיר שגיאה.' },
  { id: 'slow-dependency', layer: 'dependency', title: 'שירות תלוי איטי', description: 'תלות downstream מגיבה לאט, והזמן מצטבר עד חריגה מ-timeout.' },
  { id: 'config-missing', layer: 'config', title: 'קונפיגורציה או סוד חסרים בסביבה', description: 'משתנה סביבה, connection string או מפתח שלא הוגדרו בסביבה הנבדקת.' },
  { id: 'recent-deploy', layer: 'service', title: 'שינוי שנפרס לאחרונה (רגרסיה)', description: 'התקלה התחילה בסמוך לפריסה, שינוי קונפיגורציה או מיגרציה.' },
  { id: 'upstream-down', layer: 'service', title: 'השירות שמאחורי ה-Gateway אינו פעיל או אינו בריא', description: 'המופע קרס, נמצא בהפעלה מחדש או נכשל בבדיקות בריאות.' },
  { id: 'upstream-invalid-response', layer: 'service', title: 'השירות מחזיר תגובה לא תקינה או סוגר את החיבור', description: 'החיבור נסגר באמצע, כותרות לא תקינות, או תגובה שה-Gateway לא מצליח לפרש.' },
  { id: 'tls-issue', layer: 'network', title: 'בעיית TLS / תעודה בין רכיבים', description: 'תעודה פגה או לא מהימנה בין ה-Gateway לשירות, או אי-התאמת פרוטוקול.' },
  { id: 'timeout-mismatch', layer: 'config', title: 'ערכי timeout לא מתואמים בין שכבות', description: 'ה-Gateway מוותר אחרי 30 שניות בעוד השירות ממשיך לעבד – התגובה מגיעה מאוחר מדי.' },

  // ---------- Infra / capacity ----------
  { id: 'capacity', layer: 'infra', title: 'עומס או מיצוי משאבים', description: 'CPU, זיכרון, threads או connection pool מוצו – בדרך כלל מתבטא בכשלים לסירוגין.' },
  { id: 'maintenance', layer: 'infra', title: 'השירות במצב תחזוקה או פריסה', description: 'חלון תחזוקה, פריסה מתגלגלת או scale-down זמני.' },
  { id: 'intermittent-instance', layer: 'infra', title: 'מופע אחד מתוך כמה תקול', description: 'Load balancer מפזר בקשות; רק מופע אחד פגום ולכן התקלה מופיעה לסירוגין.' },
  { id: 'service-not-running', layer: 'infra', title: 'השירות אינו מאזין בכתובת/פורט', description: 'התהליך לא רץ, נפל בעלייה או מאזין לממשק אחר.' },
  { id: 'rate-limit-shared', layer: 'config', title: 'מכסה משותפת מנוצלת על ידי אחרים', description: 'אותו API key, משתמש או כתובת IP משמשים כמה בודקים/סקריפטים במקביל.' },
  { id: 'rate-limit-config', layer: 'config', title: 'מגבלת הקצב מוגדרת נמוך בסביבה', description: 'בסביבות בדיקה המגבלה לעיתים נמוכה יותר מאשר ב-Production.' },

  // ---------- Network ----------
  { id: 'firewall', layer: 'network', title: 'Firewall או כלל רשת חוסמים', description: 'הפורט חסום מהרשת שלכם, או שהגישה מותרת רק מטווחי כתובות מסוימים.' },
  { id: 'vpn-proxy', layer: 'network', title: 'נדרש VPN או Proxy', description: 'הסביבה נגישה רק מתוך רשת מסוימת, או שה-Proxy של הדפדפן שונה מזה של הכלי.' },
  { id: 'dns-record', layer: 'network', title: 'רשומת DNS חסרה או שגויה', description: 'השם לא מוגדר, הוסר, או מצביע לכתובת ישנה.' },
  { id: 'dns-internal', layer: 'network', title: 'שם פנימי שנפתר רק ברשת מסוימת', description: 'השם מוגדר ב-DNS פנימי ולכן לא נפתר מחוץ לרשת / ללא VPN.' },
  { id: 'dns-cache', layer: 'network', title: 'מטמון DNS ישן', description: 'השם עודכן לאחרונה אך המחשב או הדפדפן עדיין משתמשים בתשובה ישנה.' },

  // ---------- CORS ----------
  { id: 'cors-missing-origin', layer: 'service', title: 'השרת לא מאשר את ה-Origin', description: 'התגובה חסרה Access-Control-Allow-Origin תואם ל-Origin של האפליקציה.' },
  { id: 'cors-preflight', layer: 'gateway', title: 'בקשת Preflight (OPTIONS) נכשלת', description: 'ה-OPTIONS מחזיר 401/404/405, או חסרות בו Allow-Methods / Allow-Headers.' },
  { id: 'cors-credentials', layer: 'config', title: 'credentials בשילוב Allow-Origin: *', description: 'כאשר נשלחים Cookies, הדפדפן דורש Origin מפורש ו-Allow-Credentials: true – wildcard אינו מספיק.' },
  { id: 'cors-masking-error', layer: 'service', title: 'שגיאת CORS מסתירה שגיאה אמיתית', description: 'השרת החזיר 500/401 ללא כותרות CORS; הדפדפן מציג "CORS error" במקום הסטטוס האמיתי.' },

  // ---------- Environment / test ----------
  { id: 'env-config-diff', layer: 'config', title: 'הבדל קונפיגורציה בין סביבות', description: 'feature flags, URLs של תלויות, timeouts או מפתחות שונים בין הסביבות.' },
  { id: 'env-data-diff', layer: 'data', title: 'הבדלי נתונים בין סביבות', description: 'רשומות, קטלוג או משתמשי בדיקה קיימים בסביבה אחת ולא באחרת.' },
  { id: 'env-version-diff', layer: 'config', title: 'גרסאות שונות פרוסות בסביבות', description: 'הסביבות מריצות build או גרסת חוזה שונים.' },
  { id: 'client-test-tool', layer: 'test', title: 'הבדל בין הכלים ששולחים את הבקשה', description: 'דפדפן, Postman וסקריפט אוטומציה שולחים כותרות, Cookies או גוף שונים.' },
  { id: 'test-data', layer: 'test', title: 'נתוני הבדיקה אינם תקינים או במצב לא צפוי', description: 'משתמש בדיקה נעול, מוצר שאזל מהמלאי, ID שנמחק – הבדיקה עצמה ולא המערכת.' },

  // ---------- Incident Investigator (cross-layer) ----------
  { id: 'js-error', layer: 'client', title: 'שגיאת JavaScript בצד הלקוח', description: 'חריגה בקוד הדפדפן מונעת שליחת בקשה או עיבוד תגובה – בלי שום שגיאת API.' },
  { id: 'api-query-bug', layer: 'service', title: 'השאילתה או המיפוי ב-API מחזירים נתון שגוי', description: 'הנתון תקין במקור, אבל השירות מסנן, מצרף או ממפה אותו לא נכון.' },
  { id: 'data-write-bug', layer: 'data', title: 'תהליך כתיבה שמר נתון שגוי', description: 'הנתון שגוי כבר במקור – תהליך, ממשק או מיגרציה כתבו אותו כך.' },
  { id: 'integration-sender', layer: 'dependency', title: 'המערכת השולחת לא שלחה (או שלחה שגוי)', description: 'ההודעה/הקריאה לא יצאה, יצאה בפורמט שגוי או לכתובת שגויה.' },
  { id: 'integration-receiver', layer: 'dependency', title: 'המערכת המקבלת לא עיבדה', description: 'הקריאה הגיעה, אך הצד המקבל דחה או לא עיבד אותה.' },
  { id: 'frontend-render', layer: 'client', title: 'איטיות בצד הלקוח (רינדור / עיבוד)', description: 'הבקשות מהירות, אך הדפדפן מבזבז זמן על עיבוד או רינדור.' },
];

export const HYPOTHESES: Record<string, Hypothesis> = Object.fromEntries(list.map((h) => [h.id, h]));
