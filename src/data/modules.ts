import type { LucideIcon } from 'lucide-react';
import {
  Stethoscope,
  FlaskConical,
  MonitorSmartphone,
  Workflow,
  FileCheck2,
  Braces,
  ListChecks,
  Bug,
  Siren,
  Database,
  GitCompareArrows,
  Bot,
  ServerCog,
  BookOpenText,
} from 'lucide-react';

export type ModuleGroup = 'api' | 'qa';

export interface ModuleDef {
  id: string;
  path: string;
  title: string;
  titleEn: string;
  description: string;
  icon: LucideIcon;
  group: ModuleGroup;
  flagship?: boolean;
  keywords: string[];
}

export const MODULES: ModuleDef[] = [
  {
    id: 'api-doctor',
    path: '/api-doctor',
    title: 'API Doctor',
    titleEn: 'API Doctor',
    description: 'מנוע אבחון מודרך לתקלות API: קודי סטטוס, רשת, אימות, חוזים ותלויות – עם הפרדה בין עובדות להשערות.',
    icon: Stethoscope,
    group: 'api',
    flagship: true,
    keywords: ['אבחון', 'תקלה', 'status', '400', '401', '403', '404', '500', '502', '503', '504', 'timeout', 'cors', 'dns'],
  },
  {
    id: 'request-lab',
    path: '/request-lab',
    title: 'מעבדת בקשות API',
    titleEn: 'API Request Lab',
    description: 'סימולטור בקשות מקומי מול API בדוי של Demo Shop – שיטה, כותרות, גוף, אימות ותגובה מוסברת.',
    icon: FlaskConical,
    group: 'api',
    keywords: ['request', 'response', 'headers', 'body', 'postman', 'simulator', 'בקשה', 'תגובה'],
  },
  {
    id: 'devtools',
    path: '/devtools',
    title: 'מ-DevTools ל-Postman',
    titleEn: 'DevTools to Postman',
    description: 'הדרכה אינטראקטיבית: איתור הבקשה הנכונה בלשונית Network, Copy as cURL, ייבוא ל-Postman והשוואה.',
    icon: MonitorSmartphone,
    group: 'api',
    keywords: ['devtools', 'network', 'curl', 'postman', 'fetch', 'xhr', 'cookies', 'preserve log'],
  },
  {
    id: 'api-flow',
    path: '/api-flow',
    title: 'סייר זרימת API',
    titleEn: 'API Flow Explorer',
    description: 'מפה אינטראקטיבית של מסלול בקשה – מהפעולה ב-UI דרך Gateway, שירות ומסד נתונים ועד התוצאה.',
    icon: Workflow,
    group: 'api',
    keywords: ['architecture', 'gateway', 'backend', 'database', 'flow', 'ארכיטקטורה', 'זרימה'],
  },
  {
    id: 'contract-validator',
    path: '/contract-validator',
    title: 'מאמת חוזי API',
    titleEn: 'API Contract Validator',
    description: 'אימות payload מול JSON Schema מקומי: שדות חובה, טיפוסים, ערכים מותרים ונתיבי שגיאה.',
    icon: FileCheck2,
    group: 'api',
    keywords: ['schema', 'contract', 'json schema', 'validation', 'חוזה', 'סכמה'],
  },
  {
    id: 'json-studio',
    path: '/json-studio',
    title: 'JSON Studio',
    titleEn: 'JSON Studio',
    description: 'אימות תחביר, עיצוב, כיווץ, השוואה מבנית בין שני JSON וסיור בנתיבים.',
    icon: Braces,
    group: 'api',
    keywords: ['json', 'diff', 'format', 'minify', 'compare', 'path', 'השוואה'],
  },
  {
    id: 'test-designer',
    path: '/test-designer',
    title: 'מתכנן בדיקות API',
    titleEn: 'API Test Designer',
    description: 'מחולל דטרמיניסטי של מקרי בדיקה: חיוביים, שדות חסרים, טיפוסים, גבולות, הרשאות וייצוא CSV.',
    icon: ListChecks,
    group: 'api',
    keywords: ['test cases', 'boundary', 'negative', 'csv', 'מקרי בדיקה', 'גבולות'],
  },
  {
    id: 'bug-report',
    path: '/bug-report',
    title: 'בונה דיווח באגים',
    titleEn: 'Bug Report Builder',
    description: 'אשף מקצועי לדיווח באג עם Quality Gate, הבחנה בין Severity ל-Priority וייצוא ל-Jira / Azure DevOps.',
    icon: Bug,
    group: 'api',
    keywords: ['bug', 'jira', 'azure devops', 'severity', 'priority', 'באג', 'דיווח'],
  },
  {
    id: 'incident',
    path: '/incident',
    title: 'חוקר תקלות',
    titleEn: 'Incident Investigator',
    description: 'אשף כללי לחקירת תקלה כשמקור הכשל לא ידוע: UI, API, נתונים, אימות, אינטגרציה וביצועים.',
    icon: Siren,
    group: 'qa',
    keywords: ['incident', 'rca', 'investigation', 'חקירה', 'תקלה'],
  },
  {
    id: 'sql',
    path: '/sql',
    title: 'עוזר SQL',
    titleEn: 'SQL Helper',
    description: 'דוגמאות SQL לקריאה בלבד על טבלאות Demo Shop: סינון, JOIN, קיבוץ, NULL וכפילויות.',
    icon: Database,
    group: 'qa',
    keywords: ['sql', 'select', 'join', 'group by', 'duplicates', 'null', 'שאילתה'],
  },
  {
    id: 'regression',
    path: '/regression',
    title: 'מתכנן רגרסיה',
    titleEn: 'Regression Planner',
    description: 'הערכת השפעת שינוי לפי צ׳קליסט והצעת אזורי רגרסיה – כנקודת פתיחה, לא כיסוי מובטח.',
    icon: GitCompareArrows,
    group: 'qa',
    keywords: ['regression', 'impact', 'smoke', 'רגרסיה', 'השפעה'],
  },
  {
    id: 'automation',
    path: '/automation',
    title: 'עוזר אוטומציה',
    titleEn: 'Automation Assistant',
    description: 'דוגמאות Selenium + Pytest ו-Playwright + TypeScript: המתנות, לוקייטורים, Fixtures ו-POM.',
    icon: Bot,
    group: 'qa',
    keywords: ['selenium', 'playwright', 'pytest', 'pom', 'locators', 'אוטומציה'],
  },
  {
    id: 'environments',
    path: '/environments',
    title: 'בודק סביבות',
    titleEn: 'Environment Checker',
    description: 'השוואת קונפיגורציה בין Dev, QA, UAT ו-Production ואיתור הבדלים שמסבירים התנהגות שונה.',
    icon: ServerCog,
    group: 'qa',
    keywords: ['environment', 'config', 'dev', 'qa', 'uat', 'prod', 'סביבה'],
  },
  {
    id: 'knowledge',
    path: '/knowledge',
    title: 'מאגר ידע QA',
    titleEn: 'QA Knowledge Base',
    description: 'מילון מונחים עברי-אנגלי מדויק: HTTP, REST, JSON, Schema, Severity, RCA, Correlation ID ועוד.',
    icon: BookOpenText,
    group: 'qa',
    keywords: ['glossary', 'terms', 'מילון', 'מונחים'],
  },
];

export const API_MODULES = MODULES.filter((m) => m.group === 'api');
export const QA_MODULES = MODULES.filter((m) => m.group === 'qa');

export function moduleByPath(pathname: string): ModuleDef | undefined {
  return MODULES.find((m) => pathname === m.path || pathname.startsWith(`${m.path}/`));
}

export function moduleById(id: string): ModuleDef | undefined {
  return MODULES.find((m) => m.id === id);
}
