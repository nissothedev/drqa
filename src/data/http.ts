export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export interface StatusInfo {
  code: number;
  reason: string;
  he: string;
}

export const STATUS_INFO: Record<number, StatusInfo> = {
  200: { code: 200, reason: 'OK', he: 'הבקשה הצליחה' },
  201: { code: 201, reason: 'Created', he: 'משאב נוצר' },
  202: { code: 202, reason: 'Accepted', he: 'התקבל לעיבוד אסינכרוני' },
  204: { code: 204, reason: 'No Content', he: 'הצלחה ללא גוף תגובה' },
  301: { code: 301, reason: 'Moved Permanently', he: 'הועבר לצמיתות' },
  302: { code: 302, reason: 'Found', he: 'הפניה זמנית' },
  304: { code: 304, reason: 'Not Modified', he: 'לא השתנה (מטמון)' },
  400: { code: 400, reason: 'Bad Request', he: 'השרת לא עיבד את הבקשה כפי שנשלחה' },
  401: { code: 401, reason: 'Unauthorized', he: 'נדרש אימות זהות תקף' },
  403: { code: 403, reason: 'Forbidden', he: 'הזהות מוכרת אך אין הרשאה' },
  404: { code: 404, reason: 'Not Found', he: 'המשאב או הנתיב לא נמצאו' },
  405: { code: 405, reason: 'Method Not Allowed', he: 'השיטה אינה נתמכת בנתיב' },
  406: { code: 406, reason: 'Not Acceptable', he: 'פורמט התגובה המבוקש לא נתמך' },
  408: { code: 408, reason: 'Request Timeout', he: 'השרת לא קיבל בקשה מלאה בזמן' },
  409: { code: 409, reason: 'Conflict', he: 'התנגשות עם מצב המשאב' },
  410: { code: 410, reason: 'Gone', he: 'המשאב הוסר לצמיתות' },
  413: { code: 413, reason: 'Content Too Large', he: 'גוף הבקשה גדול מדי' },
  415: { code: 415, reason: 'Unsupported Media Type', he: 'סוג התוכן אינו נתמך' },
  422: { code: 422, reason: 'Unprocessable Content', he: 'התחביר תקין אך התוכן לא עבר אימות' },
  429: { code: 429, reason: 'Too Many Requests', he: 'חריגה ממגבלת קצב' },
  500: { code: 500, reason: 'Internal Server Error', he: 'כשל בצד השרת בעת טיפול בבקשה' },
  501: { code: 501, reason: 'Not Implemented', he: 'היכולת לא מומשה בשרת' },
  502: { code: 502, reason: 'Bad Gateway', he: 'רכיב ביניים קיבל תגובה לא תקינה מהשרת שמאחוריו' },
  503: { code: 503, reason: 'Service Unavailable', he: 'השירות זמנית לא זמין' },
  504: { code: 504, reason: 'Gateway Timeout', he: 'רכיב ביניים לא קיבל תגובה בזמן' },
};

export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export function statusTone(code: number): StatusTone {
  if (code >= 200 && code < 300) return 'success';
  if (code >= 300 && code < 400) return 'info';
  if (code >= 400 && code < 500) return 'warning';
  if (code >= 500) return 'danger';
  return 'neutral';
}

export function statusReason(code: number): string {
  return STATUS_INFO[code]?.reason ?? '';
}
