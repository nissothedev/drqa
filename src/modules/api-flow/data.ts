import type { LucideIcon } from 'lucide-react';
import { MousePointerClick, MonitorSmartphone, Send, Network, Server, Database, Reply, LayoutTemplate } from 'lucide-react';

export type NodeId = 'action' | 'ui' | 'request' | 'gateway' | 'service' | 'data' | 'response' | 'result';

export interface FlowNode {
  id: NodeId;
  title: string;
  en: string;
  icon: LucideIcon;
  role: string;
  failures: string[];
  evidence: string[];
  checks: string[];
  canConclude: string;
  cannotConclude: string;
}

export const FLOW: FlowNode[] = [
  {
    id: 'action',
    title: 'פעולת משתמש',
    en: 'User Action',
    icon: MousePointerClick,
    role: 'המשתמש מבצע פעולה: לחיצה על "ביצוע הזמנה", חיפוש מוצר, התחברות.',
    failures: ['צעדים שונים ממה שתועד', 'נתוני קלט חריגים', 'לחיצה כפולה'],
    evidence: ['צעדים מדויקים לשחזור', 'נתוני הקלט (בדויים)', 'זמן ומשתמש בדיקה'],
    checks: ['שחזרו עם צעדים מתועדים', 'בדקו אם הבעיה תלויה בנתון מסוים'],
    canConclude: 'מה בדיוק בוצע ובאיזה סדר.',
    cannotConclude: 'איזה רכיב נכשל – הפעולה רק מפעילה את השרשרת.',
  },
  {
    id: 'ui',
    title: 'ממשק משתמש',
    en: 'UI / Client',
    icon: MonitorSmartphone,
    role: 'אוסף את הקלט, מוודא בסיסית, בונה את הבקשה ומציג את התוצאה.',
    failures: ['שדה טופס שלא ממופה לבקשה', 'ולידציה בצד לקוח שונה מהשרת', 'שגיאת JavaScript שמונעת שליחה'],
    evidence: ['Console errors', 'Payload בלשונית Network', 'מצב הטופס לפני השליחה'],
    checks: ['השוו את הטופס ל-Payload שנשלח', 'בדקו שגיאות ב-Console'],
    canConclude: 'אם הבקשה שנבנתה תואמת לקלט המשתמש.',
    cannotConclude: 'אם השרת יקבל אותה – זה נקבע בחוזה ובשרת.',
  },
  {
    id: 'request',
    title: 'בקשת API',
    en: 'API Request',
    icon: Send,
    role: 'הודעת HTTP: שיטה, URL, כותרות וגוף – בדיוק כפי שנשלחה ברשת.',
    failures: ['URL / גרסה שגויים', 'כותרת Authorization חסרה', 'Content-Type שגוי', 'גוף שאינו תואם לחוזה'],
    evidence: ['הבקשה מ-DevTools (Copy as cURL)', 'השוואה לחוזה'],
    checks: ['אמתו את הבקשה מול הסכמה', 'שלחו בקשה מינימלית תקינה'],
    canConclude: 'אם הבקשה עומדת בחוזה המתועד.',
    cannotConclude: 'אם הנתונים נכונים עסקית, או מה יקרה בשרת.',
  },
  {
    id: 'gateway',
    title: 'Gateway / ניתוב',
    en: 'API Gateway / Routing',
    icon: Network,
    role: 'נקודת כניסה: ניתוב לשירות, ולעיתים אימות, הגבלת קצב, CORS ו-timeouts.',
    failures: ['404 על נתיב שלא מוגדר בניתוב', '401/403 ברמת Gateway', '429 מגבלת קצב', '502/503/504 מול השירות'],
    evidence: ['כותרות Server / Via', 'לוגים של ה-Gateway: upstream status וזמן', 'פורמט התגובה (HTML של Gateway?)'],
    checks: ['זהו מי ייצר את התגובה', 'השוו upstream status לסטטוס שהלקוח קיבל'],
    canConclude: 'אם הבקשה הגיעה לשירות ומה ה-Gateway קיבל ממנו.',
    cannotConclude: 'מה קרה בתוך השירות.',
  },
  {
    id: 'service',
    title: 'שירות Backend',
    en: 'Backend Service',
    icon: Server,
    role: 'מאמת את הבקשה, מפעיל לוגיקה עסקית, קורא למסד נתונים ולתלויות ובונה תגובה.',
    failures: ['ולידציה דוחה קלט (400/422)', 'חריגה לא מטופלת (500)', 'קונפיגורציה חסרה', 'מיפוי תגובה שגוי'],
    evidence: ['לוגים לפי Correlation ID', 'Stack trace', 'מדדי ביצועים'],
    checks: ['חפשו את ה-Correlation ID בלוגים', 'בדקו פריסות אחרונות'],
    canConclude: 'איזו שגיאה השירות רשם ואיפה בקוד.',
    cannotConclude: 'בהכרח את שורש הבעיה – ייתכן שנתון שגוי הגיע ממקום אחר.',
  },
  {
    id: 'data',
    title: 'מסד נתונים / תלות',
    en: 'Database / External Dependency',
    icon: Database,
    role: 'שמירה ושליפה של נתונים, או קריאה לשירות חיצוני (מלאי, תשלום, חיפוש).',
    failures: ['שאילתה איטית / נעילה', 'הפרת אילוץ', 'תלות לא זמינה או איטית', 'נתונים חסרים או כפולים'],
    evidence: ['זמני שאילתה ב-trace', 'שאילתת קריאה בלבד לאימות', 'סטטוס התלות'],
    checks: ['אמתו את הנתון במקור האמת', 'בדקו את זמני התלות'],
    canConclude: 'מה מצב הנתונים כעת ומה זמן התגובה של התלות.',
    cannotConclude: 'מה היה המצב ברגע התקלה, או איזה תהליך כתב נתון שגוי.',
  },
  {
    id: 'response',
    title: 'תגובת API',
    en: 'API Response',
    icon: Reply,
    role: 'קוד סטטוס, כותרות וגוף שחוזרים ללקוח – ייתכן שעברו שינוי ב-Gateway.',
    failures: ['מבנה שונה מהחוזה', 'שגיאה כללית ללא פירוט', 'null במקום מערך'],
    evidence: ['Response ב-Network', 'אימות מול סכמת התגובה'],
    checks: ['אמתו את התגובה ב-Contract Validator', 'השוו לסביבה תקינה ב-JSON Studio'],
    canConclude: 'אם התגובה עומדת בחוזה.',
    cannotConclude: 'אם הערכים עצמם נכונים עסקית.',
  },
  {
    id: 'result',
    title: 'תוצאה ב-UI',
    en: 'UI Result',
    icon: LayoutTemplate,
    role: 'הלקוח מפרש את התגובה ומציג אותה – או מציג הודעת שגיאה.',
    failures: ['מיפוי שדה שגוי', 'אי-טיפול ב-null / רשימה ריקה', 'הודעת שגיאה כללית שמסתירה את הסטטוס'],
    evidence: ['השוואת התגובה לתצוגה', 'Console errors'],
    checks: ['השוו שדה-שדה בין Response למסך'],
    canConclude: 'אם התצוגה משקפת את התגובה.',
    cannotConclude: 'לבדה – שום דבר על השרת או על מסד הנתונים.',
  },
];

export type NodeState = 'ok' | 'fail' | 'suspect' | 'unknown';

export interface FlowScenario {
  id: string;
  title: string;
  symptom: string;
  steps: Array<{ node: NodeId; state: NodeState; observation: string }>;
  conclusion: string;
  trap: string;
  doctorEntry?: string;
}

export const FLOW_SCENARIOS: FlowScenario[] = [
  {
    id: 'ui-payload',
    title: 'Payload שגוי מה-UI',
    symptom: 'הזמנה נכשלת עם "אירעה שגיאה". ב-Postman עם בקשה מהתיעוד – עובד.',
    steps: [
      { node: 'action', state: 'ok', observation: 'הצעדים משתחזרים בעקביות.' },
      { node: 'ui', state: 'suspect', observation: 'שדה המיקוד בטופס מולא – אבל לא מופיע ב-Payload.' },
      { node: 'request', state: 'fail', observation: 'shippingAddress.zip חסר בבקשה שנשלחה. אימות מול הסכמה נכשל.' },
      { node: 'gateway', state: 'ok', observation: 'הבקשה נותבה כרגיל.' },
      { node: 'service', state: 'ok', observation: 'השירות החזיר 422 עם פירוט השדה – בהתאם לחוזה.' },
      { node: 'response', state: 'ok', observation: 'התגובה תואמת לחוזה השגיאה.' },
      { node: 'result', state: 'suspect', observation: 'ה-UI מציג הודעה כללית במקום פירוט השדה.' },
    ],
    conclusion: 'הראיות מצביעות על בניית הבקשה בצד הלקוח: הטופס מכיל ערך שאינו מגיע ל-Payload. נדרש לאשר בקוד ה-UI.',
    trap: 'המסקנה "השרת דוחה הזמנות תקינות" הייתה שגויה – השרת דחה בקשה שבאמת חסרה שדה.',
    doctorEntry: 'missing-fields',
  },
  {
    id: 'validation',
    title: 'דחיית ולידציה בשרת',
    symptom: 'הזמנה עם 10 פריטים נדחית, למרות שהדרישה מאפשרת עד 10.',
    steps: [
      { node: 'request', state: 'ok', observation: 'quantity=10 – תקין לפי החוזה (maximum: 10).' },
      { node: 'gateway', state: 'ok', observation: 'ניתוב תקין.' },
      { node: 'service', state: 'fail', observation: '422: "quantity must be < 10". הכלל בשרת שונה מהחוזה.' },
      { node: 'response', state: 'ok', observation: 'מבנה השגיאה תקין.' },
    ],
    conclusion: 'אי-התאמה בין כלל הוולידציה בשרת לחוזה (גבול כולל מול לא כולל). זו השערה חזקה – יש לאשר מול הדרישה המקורית.',
    trap: 'ייתכן שהחוזה הוא השגוי. ההחלטה מי צודק שייכת לדרישה, לא ל-QA.',
    doctorEntry: 'http-422',
  },
  {
    id: 'db',
    title: 'כשל שאילתת מסד נתונים',
    symptom: 'דוח מכירות מחזיר 500 רק לטווחי תאריכים ארוכים.',
    steps: [
      { node: 'request', state: 'ok', observation: 'פרמטרים תקינים לפי החוזה.' },
      { node: 'gateway', state: 'ok', observation: 'ה-upstream החזיר 500 אחרי 4.2 שניות.' },
      { node: 'service', state: 'suspect', observation: 'בלוג (לפי Correlation ID): חריגת timeout בשאילתה.' },
      { node: 'data', state: 'fail', observation: 'ב-trace: השאילתה רצה 4 שניות ונקטעה.' },
      { node: 'response', state: 'ok', observation: '500 גנרי עם traceId.' },
    ],
    conclusion: 'הראיות (trace + לוג) מצביעות על שאילתה איטית שנקטעת. נדרש ניתוח של צוות הנתונים.',
    trap: '500 לבדו לא היה מצביע על מסד הנתונים – רק ה-trace והלוג תמכו בכך.',
    doctorEntry: 'http-500',
  },
  {
    id: 'dependency',
    title: 'Timeout של תלות',
    symptom: 'ביצוע תשלום מחזיר 504 לסירוגין.',
    steps: [
      { node: 'request', state: 'ok', observation: 'הבקשה תקינה.' },
      { node: 'gateway', state: 'fail', observation: '504 אחרי בדיוק 30 שניות – ה-timeout של ה-Gateway.' },
      { node: 'service', state: 'suspect', observation: 'השירות עדיין ממתין לתשובה מספק התשלומים המדומה.' },
      { node: 'data', state: 'fail', observation: 'זמני התלות קפצו ל-35 שניות בשעות עומס.' },
    ],
    conclusion: 'ה-Gateway ויתר ראשון, אבל האיטיות נמצאת בתלות. חשוב: לא ידוע אם התשלום בוצע!',
    trap: 'הרכיב שהחזיר 504 אינו הרכיב האיטי. ניסיון חוזר עלול לחייב פעמיים.',
    doctorEntry: 'http-504',
  },
  {
    id: 'mapping',
    title: 'מיפוי תגובה שגוי',
    symptom: 'המחיר במסך מציג "NaN ₪".',
    steps: [
      { node: 'request', state: 'ok', observation: 'GET /v1/products/1001 תקין.' },
      { node: 'service', state: 'ok', observation: '200 OK.' },
      { node: 'response', state: 'suspect', observation: 'price הגיע כמחרוזת "49.90" ולא כמספר – חריגה מהחוזה.' },
      { node: 'result', state: 'fail', observation: 'ה-UI מבצע חישוב מספרי על מחרוזת ומציג NaN.' },
    ],
    conclusion: 'שתי בעיות נפרדות: התגובה חורגת מהחוזה (טיפוס), וה-UI לא מטפל בקלט לא צפוי. כדאי לדווח על שתיהן בנפרד.',
    trap: '200 OK לא אומר שהתגובה נכונה. גם "באג ב-UI" הוא רק חצי מהתמונה.',
    doctorEntry: 'contract-mismatch',
  },
];
