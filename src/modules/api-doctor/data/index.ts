import type { DiagnosticScenario, EntryPoint } from '../../../types/diagnostics';
import type { EngineContext } from '../engine';
import { CHECKS } from './checks';
import { COMMON_NODES, COMMON_START } from './common';
import { HYPOTHESES } from './hypotheses';
import { HTTP_400, HTTP_404, HTTP_405, HTTP_409, HTTP_415, HTTP_422 } from './scenarios-client';
import { HTTP_401, HTTP_403, HTTP_429 } from './scenarios-auth';
import { HTTP_500, HTTP_502, HTTP_503, HTTP_504 } from './scenarios-server';
import { CLIENT_TIMEOUT, CONNECTION_REFUSED, CONTRACT_MISMATCH, CORS_ERROR, DNS_FAILURE, ENV_MISMATCH } from './scenarios-network';

export const SCENARIOS: DiagnosticScenario[] = [
  HTTP_400,
  HTTP_401,
  HTTP_403,
  HTTP_404,
  HTTP_405,
  HTTP_409,
  HTTP_415,
  HTTP_422,
  HTTP_429,
  HTTP_500,
  HTTP_502,
  HTTP_503,
  HTTP_504,
  CONNECTION_REFUSED,
  DNS_FAILURE,
  CLIENT_TIMEOUT,
  CORS_ERROR,
  ENV_MISMATCH,
  CONTRACT_MISMATCH,
];

export const SCENARIO_BY_ID: Record<string, DiagnosticScenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

const statusEntries: EntryPoint[] = SCENARIOS.filter((s) => s.code).map((s) => ({
  id: s.id,
  label: s.title,
  hint: s.tagline,
  scenarioId: s.id,
  group: 'status',
}));

const symptomEntries: EntryPoint[] = [
  { id: 'connection-refused', label: 'Connection refused', hint: 'החיבור נדחה מיד, אין קוד סטטוס', scenarioId: 'connection-refused', group: 'symptom' },
  { id: 'dns-failure', label: 'כשל DNS', hint: 'ERR_NAME_NOT_RESOLVED / ENOTFOUND', scenarioId: 'dns-failure', group: 'symptom' },
  { id: 'timeout', label: 'Timeout בצד הלקוח', hint: 'אין תגובה – הלקוח הפסיק לחכות', scenarioId: 'timeout', group: 'symptom' },
  { id: 'cors', label: 'שגיאת CORS', hint: 'blocked by CORS policy ב-Console', scenarioId: 'cors', group: 'symptom' },
  { id: 'malformed-json', label: 'Malformed JSON', hint: 'השרת לא מצליח לפענח את גוף הבקשה', scenarioId: 'http-400', preset: { '400.response': 'parse' }, group: 'symptom' },
  { id: 'missing-fields', label: 'שדות חובה חסרים', hint: 'שגיאת ולידציה על שדה חובה (422 או 400 – לפי החוזה)', scenarioId: 'http-422', preset: { '422.errors': 'required' }, group: 'symptom' },
  { id: 'wrong-types', label: 'טיפוסי נתונים שגויים', hint: 'למשל מחרוזת במקום מספר', scenarioId: 'http-400', preset: { '400.response': 'field' }, group: 'symptom' },
  { id: 'wrong-method', label: 'שיטת HTTP שגויה', hint: 'POST במקום PUT, DELETE ל-collection', scenarioId: 'http-405', group: 'symptom' },
  { id: 'wrong-url', label: 'URL או base path שגויים', hint: 'גרסה, יחיד/רבים, סביבה', scenarioId: 'http-404', preset: { '404.kind': 'route' }, group: 'symptom' },
  { id: 'missing-headers', label: 'כותרות חסרות או שגויות', hint: 'Accept, Content-Type, כותרות מותאמות', scenarioId: 'http-400', preset: { '400.response': 'header' }, group: 'symptom' },
  { id: 'authentication', label: 'בעיית אימות (Authentication)', hint: 'טוקן חסר, פג או לסביבה אחרת', scenarioId: 'http-401', group: 'symptom' },
  { id: 'authorization', label: 'בעיית הרשאה (Authorization)', hint: 'זהות מוכרת, אך אין הרשאה', scenarioId: 'http-403', group: 'symptom' },
  { id: 'env-mismatch', label: 'התנהגות שונה בין סביבות', hint: 'עובד ב-QA, לא עובד ב-UAT', scenarioId: 'env-mismatch', group: 'symptom' },
  { id: 'contract-mismatch', label: 'אי-התאמה לחוזה ה-API', hint: '200 OK אבל המבנה שונה מהמתועד', scenarioId: 'contract-mismatch', group: 'symptom' },
  { id: 'upstream-failure', label: 'כשל שירות upstream', hint: 'Gateway מדווח על תגובה לא תקינה מהשירות', scenarioId: 'http-502', group: 'symptom' },
];

export const ENTRY_POINTS: EntryPoint[] = [...statusEntries, ...symptomEntries];

export function entryById(id: string): EntryPoint | undefined {
  return ENTRY_POINTS.find((e) => e.id === id);
}

export function contextFor(scenario: DiagnosticScenario): EngineContext {
  return { scenario, commonNodes: COMMON_NODES, commonStart: COMMON_START, hypothesisLibrary: HYPOTHESES, checkLibrary: CHECKS };
}

export { CHECKS, HYPOTHESES, COMMON_NODES, COMMON_START };
