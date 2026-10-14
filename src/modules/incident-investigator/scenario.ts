import type { DiagnosticScenario } from '../../types/diagnostics';

/**
 * General incident tree for when the failing layer is unknown.
 * Uses the same engine and libraries as API Doctor (shared source/repro/environment prefix).
 */
export const INCIDENT: DiagnosticScenario = {
  id: 'incident',
  title: 'Incident Investigation',
  shortTitle: 'Incident',
  category: 'contract',
  tagline: 'משהו לא עובד, ולא ברור באיזו שכבה.',
  meaning: 'חקירה כללית שמטרתה לבודד את השכבה: UI, API, נתונים, אימות, אינטגרציה או ביצועים – לפני שמנחשים.',
  notProof: ['השכבה שבה התקלה נראית איננה בהכרח השכבה שבה היא נוצרה.', 'צמידות בזמן לשינוי אינה סיבתיות.'],
  demo: { request: '', response: '' },
  startNode: 'inc.where',
  hypotheses: {},
  checks: ['capture-exact-request', 'check-console'],
  evidence: ['תיאור מדויק של הסימפטום וזמן התרחשות', 'צעדים לשחזור', 'בקשות רלוונטיות מלשונית Network', 'שגיאות Console', 'Correlation IDs', 'סביבה, גרסה ומשתמש בדיקה (בדוי)'],
  nodes: [
    {
      id: 'inc.where',
      phase: 'symptom',
      question: 'מה בדיוק הסימפטום?',
      options: [
        { id: 'error-msg', label: 'הודעת שגיאה במסך', next: 'inc.network', facts: ['מוצגת הודעת שגיאה במסך'] },
        { id: 'wrong-data', label: 'נתונים שגויים / חסרים במסך או בדוח', next: 'inc.network', facts: ['מוצגים נתונים שגויים או חסרים'], hypotheses: { 'response-mapping': 1, 'api-query-bug': 1, 'data-write-bug': 1 } },
        { id: 'nothing', label: 'כלום לא קורה בלחיצה', next: 'inc.network', facts: ['פעולה במסך לא מייצרת תגובה נראית'], hypotheses: { 'js-error': 2 } },
        { id: 'slow', label: 'איטיות', next: 'inc.perf', facts: ['המערכת איטית'] },
        { id: 'login', label: 'בעיית התחברות / הרשאה', next: 'inc.auth', facts: ['תקלה בהתחברות או בהרשאות'] },
        { id: 'integration', label: 'מערכת אחרת לא קיבלה / לא עדכנה', next: 'inc.integration', facts: ['תקלה בין מערכות'] },
      ],
    },
    {
      id: 'inc.network',
      phase: 'request',
      question: 'בלשונית Network, בזמן התקלה – מה רואים?',
      help: 'סננו Fetch/XHR, סמנו Preserve log ושחזרו.',
      options: [
        { id: 'failed', label: 'בקשת API עם 4xx / 5xx / failed', next: 'inc.api-status', facts: ['נצפתה בקשת API כושלת בזמן התקלה'], hypotheses: { 'js-error': -2, 'response-mapping': -1 } },
        { id: 'all-ok', label: 'כל הבקשות הצליחו (2xx)', next: 'inc.response', facts: ['כל בקשות ה-API הצליחו'], hypotheses: { 'response-mapping': 2, 'api-query-bug': 1, 'data-write-bug': 1 } },
        { id: 'no-request', label: 'לא נשלחה בקשה בכלל', next: 'inc.console', facts: ['לא נשלחה בקשת API בעקבות הפעולה'], hypotheses: { 'js-error': 3, 'ui-serialization': 1 }, checks: ['check-console'] },
        { id: 'unchecked', label: 'לא בדקתי', next: 'inc.response', assumptions: ['בקשות ה-API הצליחו'], checks: ['capture-exact-request'] },
      ],
    },
    {
      id: 'inc.api-status',
      phase: 'response',
      question: 'מה הסטטוס של הבקשה הכושלת?',
      options: [
        { id: 'c4xx', label: '4xx – השרת דחה את הבקשה', next: null, facts: ['הבקשה נדחתה ב-4xx'], hypotheses: { 'payload-shape': 2, 'ui-serialization': 2, 'token-expired': 1 }, checks: ['read-error-body', 'compare-contract'] },
        { id: 'c5xx', label: '5xx – כשל בצד השרת', next: null, facts: ['הבקשה נכשלה ב-5xx'], hypotheses: { 'unhandled-exception': 2, 'dependency-failure': 2, 'db-error': 1 }, checks: ['correlation-logs'] },
        { id: 'none', label: 'failed / pending – אין סטטוס', next: null, facts: ['לא התקבל קוד סטטוס'], hypotheses: { 'vpn-proxy': 1, 'cors-masking-error': 2, 'slow-dependency': 1 }, checks: ['check-console', 'measure-timing'] },
      ],
    },
    {
      id: 'inc.console',
      phase: 'followup',
      question: 'מה מופיע ב-Console?',
      options: [
        { id: 'js', label: 'שגיאת JavaScript (TypeError, undefined…)', next: null, confirmed: ['ב-Console נרשמה שגיאת JavaScript בזמן הפעולה'], hypotheses: { 'js-error': 3 } },
        { id: 'cors', label: 'שגיאת CORS / רשת', next: null, facts: ['ב-Console מופיעה שגיאת CORS או רשת'], hypotheses: { 'cors-missing-origin': 2, 'cors-masking-error': 2 } },
        { id: 'clean', label: 'נקי', next: null, facts: ['ה-Console נקי'], hypotheses: { 'js-error': -2, 'ui-serialization': 2 }, assumptions: ['הכפתור מחובר לפעולה הנכונה'] },
      ],
    },
    {
      id: 'inc.response',
      phase: 'response',
      question: 'האם תגובת ה-API מכילה את הנתונים הנכונים?',
      options: [
        { id: 'correct', label: 'כן – התגובה נכונה, המסך שגוי', next: null, confirmed: ['תגובת ה-API מכילה את הנתון הנכון'], hypotheses: { 'response-mapping': 4, 'api-query-bug': -3, 'data-write-bug': -3 }, checks: ['check-ui-mapping'] },
        { id: 'wrong', label: 'לא – כבר בתגובה הנתון שגוי', next: 'inc.source', facts: ['הנתון שגוי כבר בתגובת ה-API'], hypotheses: { 'response-mapping': -3, 'api-query-bug': 2, 'data-write-bug': 2 } },
        { id: 'unknown', label: 'לא בדקתי', next: 'inc.source', assumptions: ['תגובת ה-API נבדקה מול המסך'], checks: ['check-ui-mapping'] },
      ],
    },
    {
      id: 'inc.source',
      phase: 'contract',
      question: 'האם הנתון נכון במקור האמת (מסד נתונים / מערכת המקור)?',
      help: 'השתמשו בשאילתת קריאה בלבד או במסך הניהול של מערכת המקור.',
      options: [
        { id: 'correct', label: 'כן – נכון במקור, שגוי ב-API', next: null, confirmed: ['הנתון נכון במקור האמת ושגוי בתגובת ה-API'], hypotheses: { 'api-query-bug': 4, 'cache-stale': 2, 'data-write-bug': -3 }, checks: ['correlation-logs'] },
        { id: 'wrong', label: 'לא – שגוי כבר במקור', next: 'inc.write', confirmed: ['הנתון שגוי במקור האמת'], hypotheses: { 'data-write-bug': 4, 'api-query-bug': -3 }, checks: ['check-db-query'] },
        { id: 'not-verified', label: 'לא אומת', next: null, assumptions: ['מקור האמת מכיל את הערך הנכון'], checks: ['check-data-source', 'check-db-query'] },
      ],
    },
    {
      id: 'inc.write',
      phase: 'followup',
      question: 'מה ידוע על התהליך שכתב את הנתון?',
      options: [
        { id: 'ui-flow', label: 'נכתב דרך האפליקציה (טופס / API)', next: null, facts: ['הנתון נכתב דרך האפליקציה'], hypotheses: { 'ui-serialization': 2, 'data-write-bug': 1 } },
        { id: 'batch', label: 'נכתב בתהליך רקע / ייבוא / מיגרציה', next: null, facts: ['הנתון נכתב בתהליך רקע או ייבוא'], hypotheses: { 'data-write-bug': 2, 'integration-sender': 1 }, checks: ['check-recent-deploys'] },
        { id: 'test-setup', label: 'נוצר בהכנת נתוני בדיקה', next: null, facts: ['הנתון נוצר בהכנת נתוני בדיקה'], hypotheses: { 'test-data': 4 } },
      ],
    },
    {
      id: 'inc.perf',
      phase: 'response',
      question: 'לפי DevTools, איפה הולך הזמן?',
      options: [
        { id: 'api-slow', label: 'בקשת API מסוימת איטית (TTFB גבוה)', next: 'inc.perf-api', facts: ['בקשת API מסוימת איטית'], hypotheses: { 'slow-query': 1, 'slow-dependency': 1, 'large-payload': 1 }, checks: ['measure-timing'] },
        { id: 'many', label: 'הרבה בקשות / בקשות חוזרות', next: null, facts: ['נשלחות בקשות רבות או חוזרות'], hypotheses: { 'rate-limit-client': 3, 'frontend-render': 1 }, checks: ['check-retry-loop'] },
        { id: 'client', label: 'הבקשות מהירות – המסך איטי', next: null, facts: ['הבקשות מהירות ועדיין המסך איטי'], hypotheses: { 'frontend-render': 4 } },
      ],
    },
    {
      id: 'inc.perf-api',
      phase: 'contract',
      question: 'האם הבקשה מבקשת נתונים רבים (ללא עימוד / טווח רחב)?',
      options: [
        { id: 'heavy', label: 'כן', next: null, facts: ['הבקשה מבקשת נתונים רבים'], hypotheses: { 'large-payload': 3 } },
        { id: 'light', label: 'לא – בקשה רגילה', next: null, facts: ['בקשה רגילה איטית'], hypotheses: { 'slow-dependency': 2, 'slow-query': 2, capacity: 1 }, checks: ['correlation-logs', 'check-dependency-status'] },
      ],
    },
    {
      id: 'inc.auth',
      phase: 'response',
      question: 'מה קורה בהתחברות / בפעולה המוגנת?',
      options: [
        { id: '401', label: 'מתקבל 401', next: null, facts: ['מתקבל 401'], hypotheses: { 'token-expired': 2, 'token-wrong-env': 2, 'session-cookie': 1 }, checks: ['decode-token'] },
        { id: '403', label: 'מתקבל 403', next: null, facts: ['מתקבל 403'], hypotheses: { 'role-missing': 3, 'policy-config': 1 }, checks: ['check-user-roles'] },
        { id: 'loop', label: 'לולאת הפניות / חוזר למסך הכניסה', next: null, facts: ['המשתמש מוחזר שוב ושוב למסך הכניסה'], hypotheses: { 'session-cookie': 3, 'env-config-diff': 1 }, checks: ['compare-tools'] },
      ],
    },
    {
      id: 'inc.integration',
      phase: 'request',
      question: 'האם יש ראיה שהמערכת שלנו שלחה את הקריאה / ההודעה?',
      options: [
        { id: 'sent-ok', label: 'כן – נשלחה והתקבל אישור (2xx)', next: null, confirmed: ['הקריאה נשלחה והתקבל אישור'], hypotheses: { 'integration-receiver': 4, 'integration-sender': -2 }, checks: ['check-dependency-status'] },
        { id: 'sent-error', label: 'נשלחה וקיבלה שגיאה', next: null, facts: ['הקריאה נשלחה וקיבלה שגיאה'], hypotheses: { 'integration-receiver': 2, 'payload-shape': 2, 'contract-drift': 1 }, checks: ['read-error-body', 'compare-contract'] },
        { id: 'not-sent', label: 'אין ראיה לשליחה', next: null, facts: ['אין ראיה שהקריאה נשלחה'], hypotheses: { 'integration-sender': 4 }, checks: ['correlation-logs'] },
        { id: 'unknown', label: 'אין גישה לבדוק', next: null, assumptions: ['הקריאה נשלחה'], hypotheses: { 'integration-sender': 1, 'integration-receiver': 1 } },
      ],
    },
  ],
};

/** When the investigation identifies an API failure, offer the matching API Doctor entry. */
export const API_DOCTOR_HANDOFF: Record<string, { entry?: string; label: string }> = {
  c4xx: { label: 'אבחון 4xx ב-API Doctor (בחירת קוד)' },
  c5xx: { entry: 'http-500', label: 'אבחון 5xx ב-API Doctor' },
  none: { entry: 'timeout', label: 'אבחון בקשה ללא תגובה' },
  cors: { entry: 'cors', label: 'אבחון CORS ב-API Doctor' },
  '401': { entry: 'http-401', label: 'אבחון 401 ב-API Doctor' },
  '403': { entry: 'http-403', label: 'אבחון 403 ב-API Doctor' },
  'sent-error': { entry: 'contract-mismatch', label: 'בדיקת חוזה ב-API Doctor' },
};
