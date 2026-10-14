import { useMemo, useState } from 'react';
import { ArrowLeftRight, Eye, EyeOff, KeyRound, ServerCog } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Callout } from '../../components/ui/Callout';
import { CheckRow, Toggle } from '../../components/ui/Field';
import { FictionalTag } from '../../components/ui/misc';
import { cn } from '../../utils/cn';
import { diffEnv, mask, parseEnv, type DiffStatus } from './envDiff';

type EnvName = 'Dev' | 'QA' | 'UAT' | 'Production';

// Fictional configurations – illustrative only. Never paste real production secrets here.
const CONFIGS: Record<EnvName, string> = {
  Dev: `# Demo Shop – Dev (fictional)
APP_VERSION=2026.10.3-dev
API_BASE_URL=https://dev-api.example.com/v1
PAYMENT_PROVIDER_URL=https://sandbox.pay.example.net
REQUEST_TIMEOUT_MS=60000
RATE_LIMIT_PER_MIN=1000
FEATURE_NEW_CHECKOUT=true
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://dev-shop.example.com
AUTH_ISSUER=https://dev-auth.example.com
DEFAULT_CURRENCY=ILS
LOG_LEVEL=debug
PAYMENT_API_KEY=dev-fictional-key-001`,
  QA: `# Demo Shop – QA (fictional)
APP_VERSION=2026.10.2
API_BASE_URL=https://qa-api.example.com/v1
PAYMENT_PROVIDER_URL=https://sandbox.pay.example.net
REQUEST_TIMEOUT_MS=30000
RATE_LIMIT_PER_MIN=300
FEATURE_NEW_CHECKOUT=true
CORS_ALLOWED_ORIGINS=https://qa-shop.example.com
AUTH_ISSUER=https://qa-auth.example.com
DEFAULT_CURRENCY=ILS
LOG_LEVEL=info
PAYMENT_API_KEY=qa-fictional-key-002`,
  UAT: `# Demo Shop – UAT (fictional)
APP_VERSION=2026.10.1
API_BASE_URL=https://uat-api.example.com/v1
PAYMENT_PROVIDER_URL=https://sandbox.pay.example.net
REQUEST_TIMEOUT_MS=10000
RATE_LIMIT_PER_MIN=60
FEATURE_NEW_CHECKOUT=false
CORS_ALLOWED_ORIGINS=https://uat-shop.example.com
AUTH_ISSUER=https://uat-auth.example.com
DEFAULT_CURRENCY=USD
LOG_LEVEL=warn
PAYMENT_API_KEY=uat-fictional-key-003`,
  Production: `# Demo Shop – Production (fictional)
APP_VERSION=2026.09.4
API_BASE_URL=https://api.example.com/v1
PAYMENT_PROVIDER_URL=https://pay.example.net
REQUEST_TIMEOUT_MS=10000
RATE_LIMIT_PER_MIN=120
FEATURE_NEW_CHECKOUT=false
CORS_ALLOWED_ORIGINS=https://shop.example.com
AUTH_ISSUER=https://auth.example.com
DEFAULT_CURRENCY=ILS
LOG_LEVEL=warn
CDN_CACHE_TTL_SECONDS=300
PAYMENT_API_KEY=prod-fictional-key-004`,
};

const ENVS = Object.keys(CONFIGS) as EnvName[];

const STATUS_META: Record<DiffStatus, { label: string; cls: string }> = {
  different: { label: 'שונה', cls: 'badge-warning' },
  onlyA: { label: 'רק ב-A', cls: 'badge-danger' },
  onlyB: { label: 'רק ב-B', cls: 'badge-violet' },
  same: { label: 'זהה', cls: 'badge-neutral' },
};

const MATRIX: Array<{ aspect: string; values: Record<EnvName, string> }> = [
  { aspect: 'מטרה', values: { Dev: 'פיתוח ובדיקות מפתחים', QA: 'בדיקות פונקציונליות ורגרסיה', UAT: 'אישור משתמשים עסקיים', Production: 'משתמשים אמיתיים' } },
  { aspect: 'נתונים', values: { Dev: 'סינתטיים, מתאפסים', QA: 'נתוני בדיקה מבוקרים', UAT: 'דומים ל-Production (ממוסכים)', Production: 'אמיתיים – אין לגעת' } },
  { aspect: 'קצב פריסה', values: { Dev: 'מספר פעמים ביום', QA: 'לפי build מאושר', UAT: 'לפי גרסת שחרור', Production: 'בשחרור מתוכנן' } },
  { aspect: 'תלויות', values: { Dev: 'Mocks / sandbox', QA: 'Sandbox', UAT: 'Sandbox / staging של ספקים', Production: 'ספקים אמיתיים' } },
  { aspect: 'מה מותר ל-QA', values: { Dev: 'הכל', QA: 'בדיקות מלאות', UAT: 'בתיאום', Production: 'קריאה בלבד / smoke מאושר' } },
];

const CHECKLIST = [
  'אותה גרסה (build) פרוסה בשתי הסביבות?',
  'אותם feature flags?',
  'אותו base URL ו-URLs של תלויות?',
  'הטוקן הונפק לסביבה הנכונה (issuer / audience)?',
  'נתוני הבדיקה קיימים ובמצב זהה בשתי הסביבות?',
  'timeouts ומגבלות קצב דומים?',
  'מטמון (CDN / שירות) – האם רוקן אחרי פריסה?',
  'רמת הלוג מאפשרת לראות את הראיה בסביבה התקולה?',
];

export default function EnvironmentPage() {
  const [aName, setAName] = useState<EnvName>('QA');
  const [bName, setBName] = useState<EnvName>('UAT');
  const [aText, setAText] = useState(CONFIGS.QA);
  const [bText, setBText] = useState(CONFIGS.UAT);
  const [showSame, setShowSame] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const a = useMemo(() => parseEnv(aText), [aText]);
  const b = useMemo(() => parseEnv(bText), [bText]);
  const rows = useMemo(() => diffEnv(a.values, b.values), [a, b]);
  const visible = showSame ? rows : rows.filter((r) => r.status !== 'same');
  const counts = rows.reduce<Record<DiffStatus, number>>((acc, r) => ({ ...acc, [r.status]: acc[r.status] + 1 }), { different: 0, onlyA: 0, onlyB: 0, same: 0 });

  const pick = (side: 'a' | 'b', env: EnvName) => {
    if (side === 'a') {
      setAName(env);
      setAText(CONFIGS[env]);
    } else {
      setBName(env);
      setBText(CONFIGS[env]);
    }
  };

  const editor = (side: 'a' | 'b') => {
    const name = side === 'a' ? aName : bName;
    const text = side === 'a' ? aText : bText;
    const parsed = side === 'a' ? a : b;
    return (
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-fg">{side.toUpperCase()}</span>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={`סביבה ${side.toUpperCase()}`}>
            {ENVS.map((e) => (
              <button key={e} type="button" role="radio" aria-checked={name === e} onClick={() => pick(side, e)} className={cn('chip py-0.5', name === e && 'chip-active')}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <textarea value={text} onChange={(e) => (side === 'a' ? setAText(e.target.value) : setBText(e.target.value))} rows={12} spellCheck={false} className="textarea-code" aria-label={`קונפיגורציית ${name}`} />
        {(parsed.duplicates.length > 0 || parsed.invalidLines.length > 0) && (
          <p className="mt-1 text-2xs text-warning">
            {parsed.duplicates.length > 0 && `מפתחות כפולים: ${parsed.duplicates.join(', ')}. `}
            {parsed.invalidLines.length > 0 && `שורות לא תקינות: ${parsed.invalidLines.join(', ')}.`}
          </p>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        icon={ServerCog}
        eyebrow="Environment Checker"
        title="בודק סביבות"
        description="השוואת קונפיגורציה בין Dev, QA, UAT ו-Production כדי להסביר התנהגות שונה בין סביבות. ההשוואה מקומית בלבד – אין גישה או בדיקה חיה של סביבות."
      />
      <Callout tone="privacy" icon={KeyRound} title="אל תדביקו סודות אמיתיים" className="mb-5">
        הדוגמאות בדויות. אם אתם מדביקים קונפיגורציה משלכם – הסירו קודם מפתחות, סיסמאות ו-connection strings. ערכים של מפתחות רגישים מוסתרים כברירת מחדל.
      </Callout>

      <section className="card mb-5 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title flex items-center gap-2">
            השוואת קונפיגורציה <FictionalTag />
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setAName(bName);
              setBName(aName);
              setAText(bText);
              setBText(aText);
            }}
          >
            <ArrowLeftRight className="size-3.5" aria-hidden />
            החלפת צדדים
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {editor('a')}
          {editor('b')}
        </div>
      </section>

      <section className="card mb-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STATUS_META) as DiffStatus[]).map((s) => (
              <span key={s} className={cn('badge', STATUS_META[s].cls)}>
                {STATUS_META[s].label}: {counts[s]}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Toggle checked={showSame} onChange={setShowSame} label="הצגת זהים" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReveal((r) => !r)} aria-pressed={reveal}>
              {reveal ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
              {reveal ? 'הסתרת ערכים רגישים' : 'הצגת ערכים רגישים'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-subtle">
                <th className="px-4 py-2 text-start font-medium">מפתח</th>
                <th className="px-4 py-2 text-start font-medium">A · {aName}</th>
                <th className="px-4 py-2 text-start font-medium">B · {bName}</th>
                <th className="px-4 py-2 text-start font-medium">סטטוס ומשמעות</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.key} className="border-b border-line/60 align-top last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs text-accent" dir="ltr">
                    {r.key}
                    {r.sensitive && <KeyRound className="ms-1 inline size-3 text-warning" aria-label="רגיש" />}
                  </td>
                  <td className="max-w-[240px] break-all px-4 py-2.5 font-mono text-xs text-fg" dir="ltr">
                    {r.sensitive && !reveal ? mask(r.a) : (r.a ?? '—')}
                  </td>
                  <td className="max-w-[240px] break-all px-4 py-2.5 font-mono text-xs text-fg" dir="ltr">
                    {r.sensitive && !reveal ? mask(r.b) : (r.b ?? '—')}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn('badge', STATUS_META[r.status].cls)}>{STATUS_META[r.status].label}</span>
                    {r.hint && <p className="mt-1 text-xs leading-5 text-muted">{r.hint}</p>}
                    {r.sensitive && r.status === 'different' && <p className="mt-1 text-xs text-subtle">מפתחות שונים בין סביבות הם לרוב תקינים ומכוונים.</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <p className="p-6 text-center text-sm text-muted">אין הבדלים.</p>}
        </div>
        <p className="border-t border-line px-4 py-2.5 text-2xs text-subtle">הבדל בקונפיגורציה הוא השערה להסבר התנהגות שונה – לא הוכחה. אמתו את ההשפעה לפני שמדווחים.</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="card overflow-hidden">
          <h2 className="border-b border-line px-4 py-3 section-title">מאפייני סביבות טיפוסיים</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-subtle">
                  <th className="px-4 py-2 text-start font-medium" />
                  {ENVS.map((e) => (
                    <th key={e} className="px-4 py-2 text-start font-medium" dir="ltr">
                      {e}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((m) => (
                  <tr key={m.aspect} className="border-b border-line/60 last:border-0">
                    <th scope="row" className="px-4 py-2.5 text-start text-xs font-semibold text-fg">
                      {m.aspect}
                    </th>
                    {ENVS.map((e) => (
                      <td key={e} className={cn('px-4 py-2.5 text-xs text-muted', e === 'Production' && 'text-warning')}>
                        {m.values[e]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card p-4">
          <h2 className="section-title mb-1">לפני שמאשימים את הקוד</h2>
          <p className="mb-3 text-xs text-muted">צ׳קליסט כשמשהו עובד בסביבה אחת ולא באחרת:</p>
          <div className="space-y-1.5">
            {CHECKLIST.map((c, i) => (
              <CheckRow
                key={c}
                checked={checked.has(i)}
                onChange={(v) =>
                  setChecked((s) => {
                    const n = new Set(s);
                    if (v) n.add(i);
                    else n.delete(i);
                    return n;
                  })
                }
                label={c}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
