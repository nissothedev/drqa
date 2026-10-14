/** Rule-based change-impact → regression suggestions. A starting point, never a coverage guarantee. */

export interface ChangeType {
  id: string;
  label: string;
  hint: string;
}

export const CHANGE_TYPES: ChangeType[] = [
  { id: 'api-contract', label: 'שינוי בחוזה API', hint: 'שדה נוסף / שונה שם / שינוי טיפוס או סטטוס' },
  { id: 'validation', label: 'שינוי כללי ולידציה', hint: 'שדה חובה, טווח, פורמט' },
  { id: 'auth', label: 'אימות והרשאות', hint: 'roles, scopes, טוקנים, session' },
  { id: 'db', label: 'סכמת DB / מיגרציה', hint: 'עמודה, אינדקס, אילוץ, המרת נתונים' },
  { id: 'ui', label: 'מסך / טופס ב-UI', hint: 'רכיבים, ניווט, טקסטים' },
  { id: 'calc', label: 'חישוב / לוגיקה עסקית', hint: 'מחיר, הנחה, מע״מ, סטטוסים' },
  { id: 'integration', label: 'אינטגרציה חיצונית', hint: 'ספק תשלום, משלוחים, הודעות' },
  { id: 'config', label: 'קונפיגורציה / Feature flag', hint: 'ערכי סביבה, דגלים, timeouts' },
  { id: 'performance', label: 'שינוי ביצועים', hint: 'שאילתה, cache, עימוד' },
  { id: 'dependency', label: 'שדרוג ספרייה משותפת', hint: 'framework, SDK, ספריית UI' },
];

export const AREAS: Array<{ id: string; label: string }> = [
  { id: 'catalog', label: 'קטלוג וחיפוש' },
  { id: 'cart', label: 'עגלת קניות' },
  { id: 'checkout', label: 'קופה והזמנות' },
  { id: 'payments', label: 'תשלומים' },
  { id: 'accounts', label: 'חשבונות והתחברות' },
  { id: 'admin', label: 'ניהול מוצרים' },
  { id: 'reports', label: 'דוחות' },
  { id: 'notifications', label: 'התראות ואימיילים' },
];

export type Level = 'must' | 'should' | 'could';

export interface PlanItem {
  id: string;
  title: string;
  level: Level;
  type: 'API' | 'UI' | 'Data' | 'Integration' | 'Performance' | 'Security' | 'Smoke';
  reasons: string[];
}

export interface PlanInput {
  changes: string[];
  areas: string[];
  risk: { nearRelease: boolean; bugHistory: boolean; noAutomation: boolean };
}

type Rule = { title: string; type: PlanItem['type']; level: Level; reason: string };

const CHANGE_RULES: Record<string, Rule[]> = {
  'api-contract': [
    { title: 'בדיקות חוזה לכל ה-endpoints שהשתנו (בקשה ותגובה)', type: 'API', level: 'must', reason: 'שינוי חוזה' },
    { title: 'צרכני ה-API (UI, שירותים אחרים) מטפלים במבנה החדש', type: 'Integration', level: 'must', reason: 'שינוי חוזה משפיע על צרכנים' },
    { title: 'תאימות לאחור: לקוחות ישנים / שדות שהוסרו', type: 'API', level: 'should', reason: 'שינוי חוזה' },
  ],
  validation: [
    { title: 'ערכי גבול ושדות חובה ב-endpoints שהשתנו', type: 'API', level: 'must', reason: 'שינוי ולידציה' },
    { title: 'ולידציה ב-UI עקבית עם השרת (הודעות שגיאה)', type: 'UI', level: 'should', reason: 'שינוי ולידציה' },
    { title: 'נתונים קיימים שלא עומדים בכלל החדש', type: 'Data', level: 'should', reason: 'שינוי ולידציה עלול לחסום עריכת רשומות ישנות' },
  ],
  auth: [
    { title: 'מטריצת הרשאות: כל role מול כל פעולה רלוונטית (401/403)', type: 'Security', level: 'must', reason: 'שינוי הרשאות' },
    { title: 'התחברות, התנתקות ורענון טוקן', type: 'Security', level: 'must', reason: 'שינוי אימות' },
    { title: 'גישה למשאבים של משתמש אחר (בעלות)', type: 'Security', level: 'should', reason: 'שינוי הרשאות' },
  ],
  db: [
    { title: 'אימות נתונים אחרי מיגרציה (ספירות, NULL, כפילויות)', type: 'Data', level: 'must', reason: 'מיגרציה' },
    { title: 'כתיבה וקריאה בזרימות שמשתמשות בטבלאות שהשתנו', type: 'API', level: 'must', reason: 'שינוי סכמה' },
    { title: 'ביצועי שאילתות מרכזיות', type: 'Performance', level: 'should', reason: 'שינוי אינדקס/סכמה' },
  ],
  ui: [
    { title: 'זרימות משתמש מרכזיות במסכים שהשתנו', type: 'UI', level: 'must', reason: 'שינוי UI' },
    { title: 'רספונסיביות, RTL ונגישות במסכים שהשתנו', type: 'UI', level: 'should', reason: 'שינוי UI' },
    { title: 'Payload שהטופס שולח תואם לחוזה', type: 'API', level: 'should', reason: 'שינוי טופס' },
  ],
  calc: [
    { title: 'טבלת מקרים לחישוב (כולל גבולות, עיגול, הנחות)', type: 'API', level: 'must', reason: 'שינוי לוגיקה עסקית' },
    { title: 'עקביות סכומים בין UI, API ומסד הנתונים', type: 'Data', level: 'must', reason: 'שינוי חישוב' },
    { title: 'דוחות שמסתמכים על החישוב', type: 'Data', level: 'should', reason: 'שינוי חישוב' },
  ],
  integration: [
    { title: 'תרחישי הצלחה וכשל מול הספק (timeout, שגיאה, תשובה כפולה)', type: 'Integration', level: 'must', reason: 'שינוי אינטגרציה' },
    { title: 'Retry ו-idempotency – ללא פעולות כפולות', type: 'Integration', level: 'must', reason: 'שינוי אינטגרציה' },
    { title: 'ניטור ולוגים עם Correlation ID בין המערכות', type: 'Integration', level: 'could', reason: 'שינוי אינטגרציה' },
  ],
  config: [
    { title: 'השוואת קונפיגורציה בין סביבות (Environment Checker)', type: 'Smoke', level: 'must', reason: 'שינוי קונפיגורציה' },
    { title: 'התנהגות עם הדגל פעיל וכבוי', type: 'API', level: 'must', reason: 'Feature flag' },
  ],
  performance: [
    { title: 'זמני תגובה של endpoints מושפעים מול baseline', type: 'Performance', level: 'must', reason: 'שינוי ביצועים' },
    { title: 'נכונות נתונים אחרי שינוי cache / עימוד', type: 'Data', level: 'must', reason: 'cache/עימוד עלולים להחזיר נתון ישן או חלקי' },
  ],
  dependency: [
    { title: 'Smoke רחב על כל המודולים', type: 'Smoke', level: 'must', reason: 'שדרוג ספרייה משותפת משפיע רוחבית' },
    { title: 'הרצה מלאה של בדיקות אוטומטיות', type: 'Smoke', level: 'should', reason: 'שדרוג ספרייה' },
  ],
};

const AREA_RULES: Record<string, Rule[]> = {
  catalog: [{ title: 'חיפוש, סינון ועימוד מוצרים', type: 'API', level: 'should', reason: 'אזור מושפע: קטלוג' }],
  cart: [{ title: 'הוספה/הסרה מעגלה, כמויות ומלאי', type: 'UI', level: 'should', reason: 'אזור מושפע: עגלה' }],
  checkout: [{ title: 'יצירת הזמנה מקצה לקצה (כולל 4xx צפויים)', type: 'API', level: 'must', reason: 'אזור מושפע: קופה – זרימה קריטית' }],
  payments: [{ title: 'תשלום מוצלח, נדחה ומבוטל (בסביבת בדיקה בלבד)', type: 'Integration', level: 'must', reason: 'אזור מושפע: תשלומים – סיכון כספי' }],
  accounts: [{ title: 'הרשמה, התחברות ושחזור סיסמה', type: 'Security', level: 'must', reason: 'אזור מושפע: חשבונות' }],
  admin: [{ title: 'יצירה/עריכה/מחיקה של מוצרים והרשאות מנהל', type: 'API', level: 'should', reason: 'אזור מושפע: ניהול' }],
  reports: [{ title: 'התאמת סכומים בדוחות לנתוני המקור', type: 'Data', level: 'should', reason: 'אזור מושפע: דוחות' }],
  notifications: [{ title: 'שליחת התראות באירועים מרכזיים (ללא כפילויות)', type: 'Integration', level: 'could', reason: 'אזור מושפע: התראות' }],
};

const ORDER: Level[] = ['must', 'should', 'could'];

function bump(l: Level): Level {
  return l === 'could' ? 'should' : 'must';
}

export function planRegression(input: PlanInput): PlanItem[] {
  const map = new Map<string, PlanItem>();
  const addRule = (r: Rule) => {
    const existing = map.get(r.title);
    if (existing) {
      if (ORDER.indexOf(r.level) < ORDER.indexOf(existing.level)) existing.level = r.level;
      if (!existing.reasons.includes(r.reason)) existing.reasons.push(r.reason);
    } else map.set(r.title, { id: `R${map.size + 1}`, title: r.title, level: r.level, type: r.type, reasons: [r.reason] });
  };
  for (const c of input.changes) (CHANGE_RULES[c] ?? []).forEach(addRule);
  for (const a of input.areas) (AREA_RULES[a] ?? []).forEach(addRule);

  if (map.size > 0) addRule({ title: 'Smoke על הזרימות הקריטיות (קטלוג → עגלה → קופה → התחברות)', type: 'Smoke', level: 'must', reason: 'בסיס לכל שחרור' });

  const items = [...map.values()];
  // Risk factors escalate "should" items in the selected areas/changes.
  const escalate = input.risk.nearRelease || input.risk.bugHistory;
  if (escalate) for (const it of items) if (it.level === 'should' && it.reasons.length > 1) it.level = bump(it.level);
  if (input.risk.bugHistory) for (const it of items) if (it.level === 'could') it.level = 'should';
  if (input.risk.noAutomation)
    items.push({ id: `R${items.length + 1}`, title: 'הקצאת זמן לבדיקות ידניות חוזרות (אין כיסוי אוטומטי)', level: 'should', type: 'Smoke', reasons: ['אין כיסוי אוטומציה לאזור'] });

  return items.sort((a, b) => ORDER.indexOf(a.level) - ORDER.indexOf(b.level) || a.title.localeCompare(b.title, 'he'));
}

export const LEVEL_LABEL: Record<Level, string> = { must: 'חובה', should: 'מומלץ', could: 'אם יש זמן' };

export function planToText(items: PlanItem[], input: PlanInput): string {
  const lines = ['DRQA · תכנית רגרסיה מוצעת', `שינויים: ${input.changes.map((c) => CHANGE_TYPES.find((x) => x.id === c)?.label).join(', ') || '—'}`, `אזורים: ${input.areas.map((a) => AREAS.find((x) => x.id === a)?.label).join(', ') || '—'}`, ''];
  for (const l of ORDER) {
    const group = items.filter((i) => i.level === l);
    if (!group.length) continue;
    lines.push(`${LEVEL_LABEL[l]}:`);
    for (const g of group) lines.push(`  [ ] (${g.type}) ${g.title} — ${g.reasons.join('; ')}`);
    lines.push('');
  }
  lines.push('הערה: זו הצעה מבוססת חוקים ואינה מבטיחה כיסוי מלא. התאימו לפי ניתוח השינוי בפועל.');
  return lines.join('\n');
}
