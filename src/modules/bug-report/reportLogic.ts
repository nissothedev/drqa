import type { BugCategory, BugReport, DataIssue, Priority, QualityCheck, Reproducibility, Severity } from '../../types/bugReport';

export const CATEGORY_META: Record<BugCategory, { label: string; tag: string; hint: string }> = {
  api: { label: 'API', tag: 'API', hint: 'תגובה שגויה, קוד סטטוס לא צפוי, חריגה מחוזה' },
  ui: { label: 'ממשק משתמש', tag: 'UI', hint: 'תצוגה, אינטראקציה, טקסט, נגישות' },
  data: { label: 'נתונים / DB', tag: 'DATA', hint: 'ערכים שגויים, רשומות חסרות או כפולות' },
  integration: { label: 'אינטגרציה', tag: 'INTEGRATION', hint: 'בין מערכות, שירותים או ספקים' },
  business: { label: 'לוגיקה עסקית', tag: 'LOGIC', hint: 'חישוב, כלל או זרימה שאינם תואמים לדרישה' },
  performance: { label: 'ביצועים', tag: 'PERF', hint: 'איטיות, timeouts, צריכת משאבים' },
  other: { label: 'אחר', tag: 'OTHER', hint: 'כל מה שלא מתאים לקטגוריות האחרות' },
};

export const REPRO_LABEL: Record<Reproducibility, string> = {
  always: 'תמיד',
  intermittent: 'לסירוגין',
  once: 'פעם אחת (לא שוחזר)',
  unknown: 'לא נבדק',
};

export const DATA_ISSUE_LABEL: Record<DataIssue, string> = {
  incorrect: 'ערכים שגויים',
  missing: 'רשומות חסרות',
  'not-persisted': 'נתון לא נשמר',
  duplicate: 'רשומות כפולות',
  mismatch: 'אי-התאמה בין מקורות',
};

export const SEVERITY_GUIDE: Record<Severity, { desc: string; example: string }> = {
  Critical: { desc: 'פונקציונליות ליבה חסומה, אובדן/השחתת נתונים או חשיפת מידע – ללא מעקף.', example: 'אף הזמנה לא ניתנת לביצוע ב-Demo Shop; חיוב כפול.' },
  High: { desc: 'פונקציה מרכזית פגועה משמעותית, או שיש מעקף מסורבל בלבד.', example: 'הזמנה עם קופון נכשלת; אפשר להזמין בלי קופון.' },
  Medium: { desc: 'פגיעה חלקית בפונקציה; קיים מעקף סביר.', example: 'סינון לפי קטגוריה מחזיר תוצאות חלקיות.' },
  Low: { desc: 'פגיעה קוסמטית או מינורית ללא השפעה פונקציונלית.', example: 'יישור טקסט שגוי בכרטיס מוצר.' },
};

export const PRIORITY_GUIDE: Record<Priority, string> = {
  P1: 'מיידי – עוצר שחרור / משפיע על לקוחות כעת',
  P2: 'גבוה – לטפל בספרינט הנוכחי',
  P3: 'בינוני – לתכנן לספרינט קרוב',
  P4: 'נמוך – לפי זמינות',
};

export function emptyReport(): BugReport {
  return {
    category: '',
    title: '',
    component: '',
    environment: '',
    build: '',
    reproducibility: '',
    frequency: '',
    preconditions: '',
    steps: '',
    testData: '',
    expected: '',
    actual: '',
    api: { method: '', endpoint: '', statusCode: '', correlationId: '', request: '', response: '', contract: '' },
    data: { issues: [], sourceOfTruthVerified: '', sources: '', query: '' },
    evidence: '',
    hypotheses: '',
    severity: '',
    priority: '',
    impact: '',
    workaround: '',
  };
}

export function stepLines(steps: string): string[] {
  return steps
    .split('\n')
    .map((s) => s.replace(/^\s*(\d+[.)-]|[-*•])\s*/, '').trim())
    .filter(Boolean);
}

const GENERIC_TITLES = [/^באג$/, /^bug$/i, /^לא עובד$/, /^not working$/i, /^error$/i, /^שגיאה$/, /^תקלה$/, /^issue$/i];

/** Wording that states a cause as fact. Hypotheses should be phrased as such. */
const CERTAINTY_PATTERNS = [/בוודאות/, /ללא ספק/, /הסיבה היא/, /נגרם (על ידי|ע"י|בגלל)/, /root cause is/i, /definitely/i, /caused by/i, /\bobviously\b/i, /ברור ש/];

const SENSITIVE_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/, label: 'נראה כמו JWT' },
  { re: /Bearer\s+(?!demo-|\{\{)[A-Za-z0-9._~+/=-]{16,}/i, label: 'טוקן Bearer' },
  { re: /(password|passwd|pwd|סיסמה)\s*[:=]\s*\S+/i, label: 'סיסמה' },
  { re: /(api[_-]?key|secret|client[_-]?secret)\s*[:=]\s*\S+/i, label: 'מפתח / סוד' },
  { re: /cookie:\s*(?![^\n]*fictional)[^\n]{12,}/i, label: 'Cookie' },
  { re: /\b(?:\d[ -]?){13,16}\b/, label: 'רצף שנראה כמו מספר כרטיס' },
];

export function scanSensitive(r: BugReport): string[] {
  const text = JSON.stringify(r);
  return SENSITIVE_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.label);
}

export function hasCertaintyWording(text: string): boolean {
  return CERTAINTY_PATTERNS.some((re) => re.test(text));
}

export function qualityChecks(r: BugReport): QualityCheck[] {
  const checks: QualityCheck[] = [];
  const add = (c: QualityCheck) => checks.push(c);
  const title = r.title.trim();

  add({ id: 'category', label: 'נבחרה קטגוריה', level: 'error', pass: !!r.category, hint: 'הקטגוריה קובעת אילו פרטים טכניים נדרשים.', step: 0 });
  add({ id: 'title', label: 'כותרת ספציפית (לפחות 15 תווים)', level: 'error', pass: title.length >= 15 && !GENERIC_TITLES.some((g) => g.test(title)), hint: 'כותרת טובה = מה + איפה + מתי. למשל: "POST /v1/orders מחזיר 422 כשהמיקוד חסר בקופה".', step: 0 });
  add({ id: 'environment', label: 'צוינה סביבה', level: 'error', pass: !!r.environment.trim(), hint: 'אותה התנהגות יכולה להיות תקינה בסביבה אחרת.', step: 0 });
  add({ id: 'build', label: 'צוינה גרסה / build', level: 'warning', pass: !!r.build.trim(), hint: 'מאפשר לקשר את הבאג לשינוי ספציפי.', step: 0 });
  add({ id: 'repro', label: 'צוינה יכולת השחזור', level: 'error', pass: !!r.reproducibility, hint: 'ציינו אם התקלה עקבית, לסירוגין או חד-פעמית.', step: 1 });
  add({ id: 'steps', label: 'לפחות 2 צעדים לשחזור', level: 'error', pass: stepLines(r.steps).length >= 2, hint: 'כתבו צעדים ממוספרים, כל צעד בשורה.', step: 1 });
  add({ id: 'expected', label: 'צוינה תוצאה צפויה', level: 'error', pass: !!r.expected.trim(), hint: 'רצוי עם מקור: דרישה, חוזה, התנהגות קודמת.', step: 2 });
  add({ id: 'actual', label: 'צוינה תוצאה בפועל', level: 'error', pass: !!r.actual.trim(), hint: 'תארו מה קרה בפועל – עובדות, לא פרשנות.', step: 2 });
  add({ id: 'distinct', label: 'הצפוי והבפועל שונים', level: 'error', pass: !r.expected.trim() || r.expected.trim() !== r.actual.trim(), hint: 'אם הם זהים – אין כאן באג מתועד.', step: 2 });

  if (r.category === 'api') {
    add({ id: 'api-endpoint', label: 'API: שיטה ו-endpoint', level: 'error', pass: !!r.api.method && r.api.endpoint.trim().startsWith('/'), hint: 'למשל POST /v1/orders.', step: 3 });
    add({ id: 'api-status', label: 'API: קוד סטטוס', level: 'error', pass: /^\d{3}$/.test(r.api.statusCode.trim()) || r.api.statusCode.trim().toLowerCase() === 'none', hint: 'קוד תלת-ספרתי, או "none" כשלא התקבלה תגובה.', step: 3 });
    add({ id: 'api-corr', label: 'API: Correlation / Request ID', level: 'warning', pass: !!r.api.correlationId.trim(), hint: 'מזרז מאוד את החיפוש בלוגים.', step: 3 });
    add({ id: 'api-contract', label: 'API: ציפיית החוזה', level: 'warning', pass: !!r.api.contract.trim(), hint: 'מה החוזה/תיעוד מגדיר? בלי זה קשה לקבוע מי חורג.', step: 3 });
    add({ id: 'api-response', label: 'API: פרטי התגובה', level: 'warning', pass: !!r.api.response.trim(), hint: 'הדביקו את החלק הרלוונטי בגוף התגובה (ללא סודות).', step: 3 });
  }
  if (r.category === 'data') {
    add({ id: 'data-issue', label: 'נתונים: סוג הבעיה', level: 'error', pass: r.data.issues.length > 0, hint: 'ערכים שגויים / חסרים / כפולים / לא נשמרו / אי-התאמה.', step: 3 });
    add({ id: 'data-sot', label: 'נתונים: האם אומת מקור האמת', level: r.data.sourceOfTruthVerified === '' ? 'error' : 'warning', pass: r.data.sourceOfTruthVerified === 'yes', hint: 'בלי בדיקת מקור האמת לא ידוע באיזו שכבה הנתון השתבש (מקור / API / UI).', step: 3 });
  }

  add({ id: 'evidence', label: 'צורפו ראיות ותצפיות', level: 'warning', pass: !!r.evidence.trim(), hint: 'צילומי מסך, HAR מנוקה, לוגים, תוצאות השוואה.', step: 3 });
  add({ id: 'hypothesis-wording', label: 'השערות מנוסחות כהשערות', level: 'warning', pass: !hasCertaintyWording(r.hypotheses), hint: 'הימנעו מ"הסיבה היא" / "בוודאות" כשאין אימות. נסחו: "ייתכן ש..., לא אומת".', step: 3 });
  add({ id: 'severity', label: 'נקבעה חומרה (Severity)', level: 'error', pass: !!r.severity, hint: 'השפעה טכנית/עסקית.', step: 4 });
  add({ id: 'priority', label: 'הוצעה עדיפות (Priority)', level: 'warning', pass: !!r.priority, hint: 'דחיפות – בדרך כלל החלטת מוצר; ניתן להציע.', step: 4 });
  add({ id: 'impact', label: 'תוארה השפעה', level: r.severity === 'Critical' || r.severity === 'High' ? 'error' : 'warning', pass: !!r.impact.trim(), hint: 'מי מושפע ובאיזה היקף? חובה בחומרה Critical/High.', step: 4 });

  const sensitive = scanSensitive(r);
  add({ id: 'sensitive', label: 'לא זוהה מידע רגיש', level: 'error', pass: sensitive.length === 0, hint: sensitive.length ? `נמצא: ${sensitive.join(', ')}. הסירו או החליפו במשתנים.` : 'אין טוקנים, סיסמאות או Cookies אמיתיים.', step: 3 });
  return checks;
}

export function gateSummary(checks: QualityCheck[]) {
  const errors = checks.filter((c) => !c.pass && c.level === 'error');
  const warnings = checks.filter((c) => !c.pass && c.level === 'warning');
  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
  return { errors, warnings, score, ready: errors.length === 0 };
}

function section(title: string, body: string | undefined): string[] {
  if (!body || !body.trim()) return [];
  return [title, body.trim(), ''];
}

export function reportTitle(r: BugReport): string {
  const tag = r.category ? `[${CATEGORY_META[r.category].tag}] ` : '';
  return `${tag}${r.title.trim() || '(ללא כותרת)'}`;
}

/** Plain-text report, safe to paste into Jira or Azure DevOps. Deterministic. */
export function buildReportText(r: BugReport): string {
  const L: string[] = [];
  L.push(reportTitle(r), '');
  const meta = [
    r.environment && `סביבה: ${r.environment}`,
    r.build && `גרסה: ${r.build}`,
    r.component && `רכיב: ${r.component}`,
  ].filter(Boolean);
  if (meta.length) L.push(meta.join(' | '));
  const sev = [r.severity && `חומרה (Severity): ${r.severity}`, r.priority && `עדיפות מוצעת (Priority): ${r.priority}`].filter(Boolean);
  if (sev.length) L.push(sev.join(' | '));
  if (r.reproducibility) L.push(`שחזור: ${REPRO_LABEL[r.reproducibility]}${r.frequency.trim() ? ` (${r.frequency.trim()})` : ''}`);
  L.push('');

  L.push(...section('תנאים מקדימים:', r.preconditions));
  const steps = stepLines(r.steps);
  if (steps.length) {
    L.push('צעדים לשחזור:');
    steps.forEach((s, i) => L.push(`${i + 1}. ${s}`));
    L.push('');
  }
  L.push(...section('נתוני בדיקה:', r.testData));
  L.push(...section('תוצאה צפויה:', r.expected));
  L.push(...section('תוצאה בפועל:', r.actual));

  if (r.category === 'api') {
    const a = r.api;
    L.push('פרטים טכניים (API):');
    if (a.method || a.endpoint) L.push(`- Endpoint: ${[a.method, a.endpoint].filter(Boolean).join(' ')}`);
    if (a.statusCode) L.push(`- Status: ${a.statusCode}`);
    if (a.correlationId) L.push(`- Correlation ID: ${a.correlationId}`);
    L.push('');
    L.push(...section('בקשה (פרטים רלוונטיים, ללא סודות):', a.request));
    L.push(...section('תגובה (פרטים רלוונטיים):', a.response));
    L.push(...section('ציפיית החוזה / תיעוד:', a.contract));
  }
  if (r.category === 'data') {
    const d = r.data;
    L.push('פרטי נתונים:');
    if (d.issues.length) L.push(`- סוג הבעיה: ${d.issues.map((i) => DATA_ISSUE_LABEL[i]).join(', ')}`);
    if (d.sourceOfTruthVerified) L.push(`- מקור האמת אומת: ${{ yes: 'כן', no: 'לא', unknown: 'לא ידוע' }[d.sourceOfTruthVerified]}`);
    L.push('');
    L.push(...section('מקורות שהושוו:', d.sources));
    L.push(...section('שאילתת אימות (קריאה בלבד):', d.query));
  }

  L.push(...section('ראיות ותצפיות:', r.evidence));
  if (r.hypotheses.trim()) {
    L.push('השערות לגבי הגורם (לא מאומתות):');
    L.push(r.hypotheses.trim());
    L.push('');
  }
  L.push(...section('השפעה:', r.impact));
  L.push(...section('מעקף (Workaround):', r.workaround));
  L.push('—', 'נוצר ב-DRQA Bug Report Builder. השערות אינן ממצאים מאומתים.');
  return L.join('\n').replace(/\n{3,}/g, '\n\n');
}

/** Markdown variant (Azure DevOps / GitHub style). */
export function buildReportMarkdown(r: BugReport): string {
  const text = buildReportText(r);
  const lines = text.split('\n');
  const out: string[] = [`## ${lines[0]}`];
  for (const line of lines.slice(1)) {
    if (/^[^\s-].*:$/.test(line)) out.push(`### ${line.slice(0, -1)}`);
    else out.push(line);
  }
  return out.join('\n');
}

export function buildReportJson(r: BugReport): string {
  return JSON.stringify(
    {
      tool: 'DRQA Bug Report Builder',
      displayTitle: reportTitle(r),
      ...r,
      steps: stepLines(r.steps),
      hypothesesNote: 'Hypotheses are unverified.',
    },
    null,
    2,
  );
}
