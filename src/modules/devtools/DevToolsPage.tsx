import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CircleDashed, Lightbulb, MonitorSmartphone, ShieldAlert, Target } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Callout } from '../../components/ui/Callout';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { Progress } from '../../components/ui/misc';
import { cn } from '../../utils/cn';
import { DevToolsSimulator } from './DevToolsSimulator';
import { curlFor, DIFFERENCES, LESSON, NET_REQUESTS, type SimState } from './data';

const INITIAL: SimState = { tab: 'elements', preserveLog: false, filter: 'all', selected: null, detailTab: 'headers', placed: false, lostLog: false, curlCopied: false };

/** Replaces credentials in a copied cURL with Postman variables – what you should do before sharing. */
export function sanitizeCurl(curl: string): string {
  return curl
    .replace(/(-H 'authorization: Bearer )[^']+'/i, "$1{{access_token}}'")
    .replace(/\s*\\\n\s*-H 'cookie: [^']+'/i, '')
    .replace(/'https:\/\/api\.example\.com/g, "'{{baseUrl}}");
}

export default function DevToolsPage() {
  const [sim, setSim] = useState<SimState>(INITIAL);
  const [step, setStep] = useState(0);
  const [diffs, setDiffs] = useState<Set<string>>(new Set());
  const set = (p: Partial<SimState>) => setSim((s) => ({ ...s, ...p }));

  const doneFlags = useMemo(() => LESSON.map((l) => (l.done ? l.done(sim) : false)), [sim]);
  const tasks = LESSON.filter((l) => l.done).length;
  const completed = doneFlags.filter(Boolean).length;
  const current = LESSON[step];
  const ordersCurl = curlFor(NET_REQUESTS.find((r) => r.id === 'orders')!);

  return (
    <div>
      <PageHeader
        icon={MonitorSmartphone}
        eyebrow="DevTools → Postman"
        title="מ-DevTools ל-Postman"
        description="שיעור אינטראקטיבי: איך מאתרים את הבקשה הנכונה בלשונית Network, קוראים אותה לעומק, מעתיקים כ-cURL ומשחזרים ב-Postman – ולמה לפעמים התוצאה שונה."
      />

      <Callout tone="danger" title="אבטחה: אל תשתפו פרטי גישה אמיתיים" className="mb-5">
        Copy as cURL ו-HAR כוללים Cookies, טוקנים ולעיתים מידע אישי. לפני שיתוף בכרטיס, בצ׳אט או בצילום מסך – הסירו או החליפו אותם במשתנים. כל הערכים בשיעור הזה בדויים.
      </Callout>

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Lesson */}
        <section className="card h-fit xl:sticky xl:top-24" aria-label="שלבי השיעור">
          <div className="border-b border-line p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-fg">
                שלב {step + 1} מתוך {LESSON.length}
              </span>
              <span className="text-muted">
                {completed}/{tasks} משימות
              </span>
            </div>
            <Progress value={completed} max={tasks} label="התקדמות משימות" />
          </div>
          <div className="p-5">
            <h2 className="mb-3 text-lg font-bold text-fg">{current.title}</h2>
            <div className="space-y-2.5">
              {current.body.map((b) => (
                <p key={b} className="text-sm leading-7 text-muted">
                  {b}
                </p>
              ))}
            </div>
            {current.task && (
              <div className={cn('mt-4 rounded-xl border p-3 transition', doneFlags[step] ? 'border-success/40 bg-success/[0.07]' : 'border-accent/30 bg-accent/[0.06]')} aria-live="polite">
                <div className={cn('mb-1 flex items-center gap-1.5 text-xs font-semibold', doneFlags[step] ? 'text-success' : 'text-accent')}>
                  {doneFlags[step] ? <Check className="size-3.5" aria-hidden /> : <Target className="size-3.5" aria-hidden />}
                  {doneFlags[step] ? 'בוצע!' : 'משימה'}
                </div>
                <p className="text-sm text-fg">{current.task}</p>
              </div>
            )}
            {current.tip && (
              <p className="mt-3 flex gap-2 text-xs leading-5 text-subtle">
                <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
                {current.tip}
              </p>
            )}
            {current.id === 'postman' && (
              <ol className="mt-4 space-y-2 text-sm">
                {['Postman ← Import', 'בחרו Raw text', 'הדביקו את פקודת ה-cURL', 'Continue ← Import', 'החליפו טוקן ו-Base URL במשתני סביבה'].map((s, i) => (
                  <li key={s} className="flex items-center gap-2.5">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-violet/15 text-2xs font-bold text-violet">{i + 1}</span>
                    <span className="text-fg">{s}</span>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-5 flex items-center justify-between gap-2">
              <button type="button" className="btn btn-secondary btn-sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                <ArrowRight className="size-3.5" aria-hidden />
                הקודם
              </button>
              <button type="button" className="btn btn-primary btn-sm" disabled={step === LESSON.length - 1} onClick={() => setStep((s) => s + 1)}>
                הבא
                <ArrowLeft className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>
          <ol className="max-h-72 space-y-0.5 overflow-y-auto border-t border-line p-2">
            {LESSON.map((l, i) => (
              <li key={l.id}>
                <button type="button" onClick={() => setStep(i)} className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-start text-xs transition', i === step ? 'bg-accent/10 text-fg' : 'text-muted hover:bg-surface-2')} aria-current={i === step ? 'step' : undefined}>
                  {doneFlags[i] ? <Check className="size-3.5 shrink-0 text-success" aria-hidden /> : <CircleDashed className="size-3.5 shrink-0 text-subtle" aria-hidden />}
                  <span className="truncate">
                    {i + 1}. {l.title}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        {/* Simulator */}
        <div className="min-w-0 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="section-title">סימולטור דפדפן (בדוי)</h2>
            <span className="text-2xs text-subtle">כל הבקשות מדומות – אין תעבורת רשת</span>
          </div>
          <DevToolsSimulator state={sim} set={set} />
        </div>
      </div>

      {/* Sanitize + compare */}
      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="card min-w-0 p-5">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-fg">
            <ShieldAlert className="size-5 text-warning" aria-hidden />
            ניקוי cURL לפני שיתוף
          </h2>
          <p className="mb-4 text-sm text-muted">כך נראית הפקודה אחרי החלפת הטוקן ו-Base URL במשתני Postman והסרת ה-Cookie.</p>
          <div className="space-y-3">
            <CodeBlock code={ordersCurl} lang="curl" title="לפני – כפי שהועתק (ערכים בדויים)" maxHeight={200} />
            <CodeBlock code={sanitizeCurl(ordersCurl)} lang="curl" title="אחרי – מוכן לשיתוף" maxHeight={200} />
          </div>
        </div>
        <div className="card min-w-0 p-5">
          <h2 className="mb-1 text-lg font-bold text-fg">למה הבקשה מתנהגת אחרת ב-Postman?</h2>
          <p className="mb-4 text-sm text-muted">סמנו הבדלים שזיהיתם בין הדפדפן ל-Postman – ותקבלו את ההשפעה הצפויה.</p>
          <div className="space-y-2">
            {DIFFERENCES.map((d) => {
              const on = diffs.has(d.id);
              return (
                <div key={d.id} className={cn('rounded-xl border transition', on ? 'border-accent/40 bg-accent/[0.05]' : 'border-line')}>
                  <label className="flex cursor-pointer items-center gap-3 p-3">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) =>
                        setDiffs((s) => {
                          const n = new Set(s);
                          if (e.target.checked) n.add(d.id);
                          else n.delete(d.id);
                          return n;
                        })
                      }
                      className="size-4"
                    />
                    <span className="text-sm font-medium text-fg">{d.title}</span>
                  </label>
                  {on && (
                    <div className="grid gap-2 px-3 pb-3 text-xs md:grid-cols-3 animate-fade-in">
                      <div className="rounded-lg bg-surface-2 p-2">
                        <div className="mb-0.5 font-semibold text-accent">דפדפן</div>
                        <div className="text-muted">{d.browser}</div>
                      </div>
                      <div className="rounded-lg bg-surface-2 p-2">
                        <div className="mb-0.5 font-semibold text-violet">Postman</div>
                        <div className="text-muted">{d.postman}</div>
                      </div>
                      <div className="rounded-lg bg-warning/10 p-2">
                        <div className="mb-0.5 font-semibold text-warning">השפעה</div>
                        <div className="text-fg">{d.effect}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Callout tone="info" className="mt-4">
            שחזור ב-Postman מוכיח שהבקשה הספציפית הזו נכשלת – לא שהבעיה בשרת. <Link to="/api-doctor?entry=cors" className="font-medium text-accent underline-offset-2 hover:underline">תרחיש CORS ב-API Doctor</Link>
          </Callout>
        </div>
      </section>
    </div>
  );
}
