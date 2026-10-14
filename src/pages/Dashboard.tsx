import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Braces,
  Bug,
  Eye,
  FlaskConical,
  History,
  Lightbulb,
  Search,
  ServerCrash,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  BadgeCheck,
  Workflow,
  ScanSearch,
} from 'lucide-react';
import { HeroVisual } from '../components/brand/HeroVisual';
import { StatusBadge, MethodBadge } from '../components/ui/Badges';
import { API_MODULES, QA_MODULES, moduleById } from '../data/modules';
import { ENTRY_POINTS, SCENARIO_BY_ID } from '../modules/api-doctor/data';
import { search, SEARCH_KIND_LABEL } from '../data/searchIndex';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/cn';

const QUICK_ACTIONS = [
  { title: 'אבחון HTTP 400', desc: 'בקשה נדחתה – תחביר, מבנה או חוזה?', to: '/api-doctor?entry=http-400', icon: Stethoscope, code: 400 },
  { title: 'חקירת HTTP 500', desc: 'כשל בצד השרת – בלי לקפוץ למסקנות', to: '/api-doctor?entry=http-500', icon: ServerCrash, code: 500 },
  { title: 'בחינת בקשה', desc: 'שלחו בקשה מדומה ל-Demo Shop API', to: '/request-lab', icon: FlaskConical },
  { title: 'השוואת JSON', desc: 'מה נוסף, הוסר או השתנה בין שתי תגובות', to: '/json-studio?tab=diff', icon: Braces },
  { title: 'דיווח באג API', desc: 'אשף מובנה עם Quality Gate', to: '/bug-report?type=api', icon: Bug },
];

const STATUS_PICKS = [400, 401, 403, 404, 405, 409, 415, 422, 429, 500, 502, 503, 504];

function SearchHero() {
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const results = useMemo(() => search(q, 6), [q]);
  const blurTimer = useRef<number | undefined>(undefined);
  return (
    <div className="relative">
      <label htmlFor="dash-search" className="sr-only">
        חיפוש באבחונים ובמאגר הידע
      </label>
      <div className="flex h-12 items-center gap-3 rounded-2xl border border-line-strong bg-surface/80 px-4 shadow-lg backdrop-blur transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
        <Search className="size-5 text-accent" aria-hidden />
        <input
          id="dash-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            window.clearTimeout(blurTimer.current);
            setFocused(true);
          }}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => setFocused(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) navigate(results[0].path);
          }}
          placeholder='נסו: "401", "CORS", "Correlation ID", "timeout"'
          className="h-full w-full bg-transparent text-sm text-fg outline-none placeholder:text-subtle"
          autoComplete="off"
        />
      </div>
      {focused && q.trim() && (
        <div className="card absolute inset-x-0 top-full z-20 mt-2 overflow-hidden p-1.5 shadow-2xl">
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted">לא נמצאו תוצאות</div>
          ) : (
            results.map((r) => (
              <Link key={r.id} to={r.path} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
                <span className="badge badge-neutral shrink-0">{SEARCH_KIND_LABEL[r.kind]}</span>
                <span className="truncate font-medium text-fg">{r.title}</span>
                <span className="hidden truncate text-xs text-subtle md:inline">{r.subtitle}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Principle({ icon: Icon, title, text, cls }: { icon: typeof Eye; title: string; text: string; cls: string }) {
  return (
    <div className="flex gap-3">
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl border', cls)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div>
        <div className="text-sm font-semibold text-fg">{title}</div>
        <p className="text-xs leading-5 text-muted">{text}</p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { recent } = useApp();
  const featured = SCENARIO_BY_ID['http-400'];
  const symptoms = ENTRY_POINTS.filter((e) => e.group === 'symptom');
  const recentModules = recent.map(moduleById).filter((m): m is NonNullable<typeof m> => !!m);

  return (
    <div className="space-y-10">
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface/50 px-5 py-8 md:px-10 md:py-12">
        <div className="grid-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="pointer-events-none absolute -top-32 end-[-10%] size-[420px] rounded-full bg-accent/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 start-[-5%] size-[380px] rounded-full bg-violet/15 blur-3xl" aria-hidden />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
          <div className="animate-fade-in">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="size-3.5" aria-hidden />
              <span dir="ltr">Premium Interactive API Diagnostics &amp; QA Engineering</span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-fg md:text-5xl md:leading-[1.15]">
  <span className="text-gradient" dir="ltr">DRQA</span>
  <br />
  <span className="text-gradient">מערכת לתחקור תקלות תוכנה</span>
</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
פלטפורמה מקצועית לתחקור תקלות, אבחון בעיות API, ניתוח בקשות ותגובות, תכנון בדיקות ותיעוד ממצאי QA.            </p>
            <div className="mt-2 text-xs font-semibold tracking-[0.2em] text-subtle" dir="ltr" style={{ textAlign: 'right' }}>
              DIAGNOSE · RESOLVE · QUALITY ASSURANCE
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/api-doctor" className="btn btn-primary btn-lg">
                <Stethoscope className="size-5" aria-hidden />
                התחילו אבחון ב-API Doctor
              </Link>
              <Link to="/request-lab" className="btn btn-secondary btn-lg">
                <FlaskConical className="size-5" aria-hidden />
                מעבדת הבקשות
              </Link>
            </div>
            <div className="mt-7 max-w-xl">
              <SearchHero />
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md animate-float">
            <div className="absolute inset-6 rounded-3xl bg-accent/20 blur-2xl" aria-hidden />
            <div className="relative overflow-hidden rounded-3xl border border-line-strong shadow-2xl">
              <HeroVisual className="block h-auto w-full" />
            </div>
            <div className="card-glass absolute -bottom-5 start-4 flex items-center gap-2 px-3 py-2 text-xs shadow-xl md:start-[-24px]">
              <ScanSearch className="size-4 text-accent" aria-hidden />
              <span className="text-muted">שכבה חשודה ≠ שכבה אשמה</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Quick actions ---------------- */}
      <section aria-labelledby="qa-title">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="eyebrow mb-1">Quick actions</div>
            <h2 id="qa-title" className="text-xl font-bold text-fg">
              פעולות מהירות
            </h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.title} to={a.to} className="card card-interactive group flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20 transition group-hover:bg-accent/15">
                  <a.icon className="size-5" aria-hidden />
                </span>
                {a.code && <StatusBadge code={a.code} showReason={false} size="sm" />}
              </div>
              <div>
                <div className="font-semibold text-fg">{a.title}</div>
                <p className="mt-0.5 text-xs leading-5 text-muted">{a.desc}</p>
              </div>
              <ArrowLeft className="mt-auto size-4 text-subtle transition group-hover:-translate-x-1 group-hover:text-accent" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- Diagnostic picker + featured ---------------- */}
      <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="card gradient-border p-5 md:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow mb-1">API Doctor</div>
              <h2 className="text-xl font-bold text-fg">מה אתם רואים?</h2>
              <p className="mt-1 text-sm text-muted">בחרו קוד סטטוס או סימפטום – והאבחון המודרך יתחיל מיד.</p>
            </div>
            <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
              <span className="absolute inset-0 animate-ping-slow rounded-2xl bg-accent/20" aria-hidden />
              <Stethoscope className="relative size-5" aria-hidden />
            </span>
          </div>
          <div className="mb-2 text-xs font-medium text-subtle">קודי סטטוס HTTP</div>
          <div className="mb-5 flex flex-wrap gap-2">
            {STATUS_PICKS.map((c) => (
              <Link key={c} to={`/api-doctor?entry=http-${c}`} className="transition hover:-translate-y-0.5" aria-label={`אבחון HTTP ${c}`}>
                <StatusBadge code={c} showReason={false} size="lg" />
              </Link>
            ))}
          </div>
          <div className="mb-2 text-xs font-medium text-subtle">סימפטומים</div>
          <div className="flex flex-wrap gap-2">
            {symptoms.map((s) => (
              <Link key={s.id} to={`/api-doctor?entry=${s.id}`} className="chip" title={s.hint}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="card flex flex-col overflow-hidden">
          <div className="border-b border-line p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="badge badge-violet">תרחיש מומלץ</span>
              <span className="badge badge-neutral">Demo Shop · בדוי</span>
            </div>
            <h2 className="text-lg font-bold text-fg">הקופה מחזירה 400 – אבל רק מהאפליקציה</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              ב-Postman ההזמנה עוברת, במסך הקופה מתקבל <span className="code-inline">400</span>. האם זה באג בשרת? לא בהכרח. בואו נבדוק מה באמת נשלח.
            </p>
          </div>
          <div className="flex-1 space-y-3 p-5">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 p-3" dir="ltr">
              <MethodBadge method="POST" />
              <span className="truncate font-mono text-xs text-fg">https://api.example.com/v1/orders</span>
              <StatusBadge code={400} size="sm" className="ms-auto" />
            </div>
            <ol className="space-y-2 text-sm">
              {['לכדו את הבקשה המדויקת מ-DevTools', 'השוו אותה לבקשה ב-Postman ולחוזה', 'שלחו בקשה מינימלית תקינה כניסוי מבוקר'].map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-accent/40 text-2xs font-bold text-accent">{i + 1}</span>
                  <span className="text-muted">{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line p-4">
            <Link to={`/api-doctor?entry=${featured.id}`} className="btn btn-primary btn-sm">
              <Stethoscope className="size-4" aria-hidden />
              אבחנו ב-API Doctor
            </Link>
            <Link to="/request-lab?preset=order-invalid-json" className="btn btn-secondary btn-sm">
              <FlaskConical className="size-4" aria-hidden />
              שחזרו במעבדה
            </Link>
            <Link to="/devtools" className="btn btn-ghost btn-sm">
              DevTools → Postman
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- API modules ---------------- */}
      <section aria-labelledby="api-mods">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-1">API Diagnostics Suite</div>
            <h2 id="api-mods" className="text-xl font-bold text-fg">
              כלי אבחון ובדיקת API
            </h2>
          </div>
          <span className="hidden text-xs text-subtle md:block">כל הכלים רצים מקומית בדפדפן</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {API_MODULES.map((m) => (
            <Link
              key={m.id}
              to={m.path}
              className={cn('card card-interactive group relative flex flex-col overflow-hidden p-5', m.flagship && 'gradient-border md:col-span-2')}
            >
              {m.flagship && <div className="pointer-events-none absolute -top-20 end-[-20%] size-64 rounded-full bg-accent/15 blur-3xl" aria-hidden />}
              <div className="relative flex items-center justify-between">
                <span className={cn('grid place-items-center rounded-xl ring-1 transition', m.flagship ? 'size-12 bg-accent/15 text-accent ring-accent/30' : 'size-10 bg-surface-2 text-accent ring-line group-hover:ring-accent/30')}>
                  <m.icon className={m.flagship ? 'size-6' : 'size-5'} aria-hidden />
                </span>
                {m.flagship && <span className="badge badge-accent">Flagship</span>}
              </div>
              <div className="relative mt-4">
                <div className={cn('font-bold text-fg', m.flagship ? 'text-xl' : 'text-base')}>{m.title}</div>
                <div className="text-2xs font-medium tracking-wide text-subtle" dir="ltr" style={{ textAlign: 'right' }}>
                  {m.titleEn}
                </div>
                <p className={cn('mt-2 text-muted', m.flagship ? 'text-sm leading-6' : 'text-xs leading-5')}>{m.description}</p>
              </div>
              {m.flagship && (
                <div className="relative mt-5 grid gap-2 sm:grid-cols-2">
                  {['13 קודי סטטוס + 15 סימפטומים', 'מסלול מסתעף לפי תשובות', 'עובדות · השערות · הנחות · ממצאים', 'ייצוא סיכום חקירה'].map((f) => (
                    <div key={f} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-xs text-muted">
                      <BadgeCheck className="size-3.5 shrink-0 text-accent" aria-hidden />
                      {f}
                    </div>
                  ))}
                </div>
              )}
              <div className="relative mt-auto flex items-center gap-1 pt-4 text-xs font-medium text-accent opacity-80 transition group-hover:opacity-100">
                פתיחה
                <ArrowLeft className="size-3.5 transition group-hover:-translate-x-1" aria-hidden />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- Method + recent ---------------- */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-5 md:p-6">
          <div className="eyebrow mb-1">How DRQA thinks</div>
          <h2 className="mb-1 text-lg font-bold text-fg">ארבע קטגוריות שלא מערבבים</h2>
          <p className="mb-5 text-sm text-muted">כל חקירה ב-DRQA מפרידה בין סוגי ידע. כך דיווח באג נשאר מדויק ומקצועי – וקל לאתגר אותו.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Principle icon={Eye} title="עובדות שנצפו" text="סטטוס, גוף תגובה, כותרות, זמנים – מה שראיתם בעיניים." cls="border-accent/30 bg-accent/10 text-accent" />
            <Principle icon={Lightbulb} title="השערות" text="הסברים אפשריים, מדורגים לפי הראיות – אף פעם לא כמסקנה." cls="border-violet/30 bg-violet/10 text-violet" />
            <Principle icon={History} title="הנחות לא מאומתות" text="מה שהחקירה נשענת עליו בלי שבדקתם. כדאי לאמת או לציין." cls="border-warning/30 bg-warning/10 text-warning" />
            <Principle icon={BadgeCheck} title="ממצאים מאומתים" text="רק מה שהוכח בראיה ישירה: לוג, השוואה, ניסוי מבוקר." cls="border-success/30 bg-success/10 text-success" />
          </div>
        </div>
        <div className="card flex flex-col p-5 md:p-6">
          <div className="eyebrow mb-1">Getting started</div>
          <h2 className="mb-4 text-lg font-bold text-fg">{recentModules.length ? 'בשימוש לאחרונה (בסשן הנוכחי)' : 'איך מתחילים?'}</h2>
          {recentModules.length ? (
            <div className="space-y-2">
              {recentModules.map((m) => (
                <Link key={m.id} to={m.path} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-3 transition hover:border-line-strong">
                  <m.icon className="size-4 text-accent" aria-hidden />
                  <span className="text-sm font-medium text-fg">{m.title}</span>
                  <ArrowLeft className="ms-auto size-4 text-subtle" aria-hidden />
                </Link>
              ))}
            </div>
          ) : (
            <ol className="space-y-3 text-sm">
              {[
                { t: 'בחרו סימפטום', d: 'קוד סטטוס או תיאור תקלה – מהלוח או מהחיפוש (Ctrl+K).', icon: Stethoscope },
                { t: 'ענו על שאלות מודרכות', d: 'כל תשובה משנה את המסלול ואת דירוג ההשערות.', icon: Workflow },
                { t: 'בצעו את הבדיקות המומלצות', d: 'לכל בדיקה: מה, איך, למה – ומה היא לא מוכיחה.', icon: ScanSearch },
                { t: 'ייצאו ודווחו', d: 'סיכום חקירה ודיווח באג מוכן להדבקה ב-Jira / Azure DevOps.', icon: Bug },
              ].map((s) => (
                <li key={s.t} className="flex gap-3">
                  <s.icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <div>
                    <div className="font-medium text-fg">{s.t}</div>
                    <div className="text-xs text-muted">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-auto flex items-center gap-2 pt-5 text-xs text-subtle">
            <ShieldCheck className="size-4 text-success" aria-hidden />
            אין שליחת נתונים החוצה. אל תדביקו טוקנים או מידע אמיתי.
          </div>
        </div>
      </section>

      {/* ---------------- QA toolkit ---------------- */}
      <section aria-labelledby="qa-mods">
        <div className="mb-4">
          <div className="eyebrow mb-1 !text-subtle">Supporting QA Toolkit</div>
          <h2 id="qa-mods" className="text-lg font-bold text-fg">
            כלי QA משלימים
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QA_MODULES.map((m) => (
            <Link key={m.id} to={m.path} className="group flex items-start gap-3 rounded-2xl border border-line bg-surface/60 p-4 transition hover:border-line-strong hover:bg-surface">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted ring-1 ring-line transition group-hover:text-accent">
                <m.icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-fg">{m.title}</div>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted">{m.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
