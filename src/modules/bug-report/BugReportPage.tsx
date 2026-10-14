import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Bug, CheckCircle2, Download, FileJson, FileText, RotateCcw, ShieldCheck, XCircle, Scale } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Stepper } from '../../components/ui/Stepper';
import { Callout } from '../../components/ui/Callout';
import { Field, OptionCard, Segmented } from '../../components/ui/Field';
import { CopyButton } from '../../components/ui/CopyButton';
import { Progress } from '../../components/ui/misc';
import { HTTP_METHODS } from '../../data/http';
import type { BugCategory, BugReport, DataIssue, Priority, Reproducibility, Severity } from '../../types/bugReport';
import { downloadFile, fileStamp } from '../../utils/download';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/cn';
import { CATEGORY_META, DATA_ISSUE_LABEL, PRIORITY_GUIDE, REPRO_LABEL, SEVERITY_GUIDE, buildReportJson, buildReportMarkdown, buildReportText, emptyReport, gateSummary, qualityChecks } from './reportLogic';
import { SCENARIO_BY_ID } from '../api-doctor/data';

const STEPS = [
  { id: 'class', label: 'סיווג' },
  { id: 'repro', label: 'שחזור' },
  { id: 'exp', label: 'צפוי מול בפועל' },
  { id: 'tech', label: 'חקירה טכנית' },
  { id: 'sev', label: 'חומרה והשפעה' },
  { id: 'gate', label: 'Quality Gate' },
  { id: 'final', label: 'דוח סופי' },
];

const ENVIRONMENTS = ['Dev', 'QA', 'UAT', 'Staging', 'Production'];

function initialFromParams(params: URLSearchParams): BugReport {
  const r = emptyReport();
  const type = params.get('type');
  if (type && type in CATEGORY_META) r.category = type as BugCategory;
  const status = params.get('status');
  if (status && /^\d{3}$/.test(status)) r.api.statusCode = status;
  const scenario = params.get('scenario');
  if (scenario && SCENARIO_BY_ID[scenario]) {
    r.evidence = `נחקר ב-DRQA API Doctor (תרחיש: ${SCENARIO_BY_ID[scenario].title}). ראו את סיכום החקירה המצורף.`;
  }
  return r;
}

function TextArea({ id, label, value, onChange, rows = 3, placeholder, hint, required, mono }: { id: string; label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; hint?: string; required?: boolean; mono?: boolean }) {
  return (
    <Field label={label} htmlFor={id} hint={hint} required={required}>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className={mono ? 'textarea-code' : 'input leading-6'} />
    </Field>
  );
}

export default function BugReportPage() {
  const [params] = useSearchParams();
  const [r, setR] = useState<BugReport>(() => initialFromParams(params));
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState<'text' | 'md'>('text');
  const { toast } = useApp();

  const set = (p: Partial<BugReport>) => setR((x) => ({ ...x, ...p }));
  const setApi = (p: Partial<BugReport['api']>) => setR((x) => ({ ...x, api: { ...x.api, ...p } }));
  const setData = (p: Partial<BugReport['data']>) => setR((x) => ({ ...x, data: { ...x.data, ...p } }));

  const checks = useMemo(() => qualityChecks(r), [r]);
  const gate = gateSummary(checks);
  const report = useMemo(() => (format === 'text' ? buildReportText(r) : buildReportMarkdown(r)), [r, format]);

  const go = (i: number) => {
    setStep(i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stepIssues = (i: number) => checks.filter((c) => !c.pass && c.step === i);

  const reset = () => {
    setR(emptyReport());
    setStep(0);
    toast('הטופס אופס', 'info');
  };

  return (
    <div>
      <PageHeader
        icon={Bug}
        eyebrow="Bug Report Builder"
        title="בונה דיווח באגים"
        description="אשף בשבעה שלבים שמוביל לדיווח מקצועי, מבוסס ראיות ומוכן להדבקה ב-Jira או Azure DevOps. ללא אינטגרציה חיה – הטקסט נשאר אצלכם."
        actions={
          <button type="button" className="btn btn-ghost" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden />
            דוח חדש
          </button>
        }
      />

      <div className="card mb-5 p-4">
        <Stepper steps={STEPS} current={step} maxReachable={6} onSelect={go} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="card p-5 md:p-6" aria-labelledby="step-title">
          <h2 id="step-title" className="mb-1 text-xl font-bold text-fg">
            {step + 1}. {STEPS[step].label}
          </h2>

          {/* 1. Classification */}
          {step === 0 && (
            <div className="mt-4 space-y-5">
              <div>
                <div className="label">קטגוריה *</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="קטגוריית באג">
                  {(Object.keys(CATEGORY_META) as BugCategory[]).map((c) => (
                    <OptionCard key={c} selected={r.category === c} onClick={() => set({ category: c })} title={CATEGORY_META[c].label} description={CATEGORY_META[c].hint} />
                  ))}
                </div>
              </div>
              <Field label="כותרת" htmlFor="br-title" required hint='מה + איפה + מתי. לדוגמה: "POST /v1/orders מחזיר 422 כשהמיקוד חסר בקופה"'>
                <input id="br-title" className="input" value={r.title} onChange={(e) => set({ title: e.target.value })} maxLength={160} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="סביבה" htmlFor="br-env" required>
                  <input id="br-env" className="input" list="br-envs" value={r.environment} onChange={(e) => set({ environment: e.target.value })} placeholder="QA" />
                  <datalist id="br-envs">
                    {ENVIRONMENTS.map((e) => (
                      <option key={e} value={e} />
                    ))}
                  </datalist>
                </Field>
                <Field label="גרסה / build" htmlFor="br-build">
                  <input id="br-build" className="input input-mono" value={r.build} onChange={(e) => set({ build: e.target.value })} placeholder="2026.10.2" />
                </Field>
                <Field label="רכיב / מודול" htmlFor="br-comp">
                  <input id="br-comp" className="input" value={r.component} onChange={(e) => set({ component: e.target.value })} placeholder="קופה" />
                </Field>
              </div>
            </div>
          )}

          {/* 2. Reproducibility */}
          {step === 1 && (
            <div className="mt-4 space-y-5">
              <div>
                <div className="label">יכולת שחזור *</div>
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="יכולת שחזור">
                  {(Object.keys(REPRO_LABEL) as Reproducibility[]).map((k) => (
                    <OptionCard key={k} selected={r.reproducibility === k} onClick={() => set({ reproducibility: k })} title={REPRO_LABEL[k]} />
                  ))}
                </div>
              </div>
              <Field label="תדירות (למשל 3 מתוך 10)" htmlFor="br-freq">
                <input id="br-freq" className="input" value={r.frequency} onChange={(e) => set({ frequency: e.target.value })} placeholder="5/5" />
              </Field>
              <TextArea id="br-pre" label="תנאים מקדימים" value={r.preconditions} onChange={(v) => set({ preconditions: v })} placeholder="משתמש בדוי demo.buyer מחובר; עגלה עם מוצר אחד" />
              <TextArea id="br-steps" label="צעדים לשחזור (צעד בכל שורה)" required value={r.steps} onChange={(v) => set({ steps: v })} rows={5} placeholder={'1. היכנסו לעמוד הקופה\n2. מלאו כתובת משלוח\n3. לחצו "ביצוע הזמנה"'} />
              <TextArea id="br-data" label="נתוני בדיקה (בדויים בלבד)" value={r.testData} onChange={(v) => set({ testData: v })} placeholder="SKU-DS-1004, כמות 1" />
            </div>
          )}

          {/* 3. Expected vs actual */}
          {step === 2 && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-success/25 bg-success/[0.04] p-4">
                <TextArea id="br-exp" label="תוצאה צפויה" required value={r.expected} onChange={(v) => set({ expected: v })} rows={6} hint="ציינו מקור: דרישה, חוזה, התנהגות בגרסה קודמת." />
              </div>
              <div className="rounded-xl border border-danger/25 bg-danger/[0.04] p-4">
                <TextArea id="br-act" label="תוצאה בפועל" required value={r.actual} onChange={(v) => set({ actual: v })} rows={6} hint="עובדות שנצפו – בלי פרשנות לגבי הגורם." />
              </div>
            </div>
          )}

          {/* 4. Technical investigation */}
          {step === 3 && (
            <div className="mt-4 space-y-5">
              {r.category === 'api' && (
                <div className="space-y-4 rounded-xl border border-accent/25 bg-accent/[0.03] p-4">
                  <h3 className="text-sm font-semibold text-accent">פרטי API</h3>
                  <div className="grid gap-3 sm:grid-cols-[130px_1fr_120px]">
                    <Field label="שיטה" htmlFor="br-m">
                      <select id="br-m" className="input font-mono" dir="ltr" value={r.api.method} onChange={(e) => setApi({ method: e.target.value })}>
                        <option value="">—</option>
                        {HTTP_METHODS.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Endpoint" htmlFor="br-ep">
                      <input id="br-ep" className="input input-mono" value={r.api.endpoint} onChange={(e) => setApi({ endpoint: e.target.value })} placeholder="/v1/orders" />
                    </Field>
                    <Field label="קוד סטטוס" htmlFor="br-sc">
                      <input id="br-sc" className="input input-mono" value={r.api.statusCode} onChange={(e) => setApi({ statusCode: e.target.value })} placeholder="422" />
                    </Field>
                  </div>
                  <Field label="Correlation / Request ID" htmlFor="br-cid">
                    <input id="br-cid" className="input input-mono" value={r.api.correlationId} onChange={(e) => setApi({ correlationId: e.target.value })} placeholder="demo-9f3e-0422" />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextArea id="br-req" label="פרטי בקשה רלוונטיים (ללא סודות)" value={r.api.request} onChange={(v) => setApi({ request: v })} rows={5} mono />
                    <TextArea id="br-res" label="פרטי תגובה רלוונטיים" value={r.api.response} onChange={(v) => setApi({ response: v })} rows={5} mono />
                  </div>
                  <TextArea id="br-contract" label="מה החוזה / התיעוד מגדיר" value={r.api.contract} onChange={(v) => setApi({ contract: v })} placeholder="לפי OpenAPI: zip הוא שדה חובה מסוג string" />
                </div>
              )}
              {r.category === 'data' && (
                <div className="space-y-4 rounded-xl border border-violet/25 bg-violet/[0.03] p-4">
                  <h3 className="text-sm font-semibold text-violet">פרטי נתונים</h3>
                  <div>
                    <div className="label">סוג הבעיה *</div>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(DATA_ISSUE_LABEL) as DataIssue[]).map((k) => {
                        const on = r.data.issues.includes(k);
                        return (
                          <button key={k} type="button" aria-pressed={on} onClick={() => setData({ issues: on ? r.data.issues.filter((x) => x !== k) : [...r.data.issues, k] })} className={cn('chip', on && 'chip-active')}>
                            {DATA_ISSUE_LABEL[k]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="label">האם אומת מקור האמת (Source of Truth)? *</div>
                    <Segmented
                      ariaLabel="אימות מקור האמת"
                      value={r.data.sourceOfTruthVerified || ('none' as never)}
                      onChange={(v) => setData({ sourceOfTruthVerified: v })}
                      options={[
                        { value: 'yes', label: 'כן, אומת' },
                        { value: 'no', label: 'לא' },
                        { value: 'unknown', label: 'לא ידוע מהו' },
                      ]}
                    />
                    {r.data.sourceOfTruthVerified && r.data.sourceOfTruthVerified !== 'yes' && (
                      <Callout tone="warning" className="mt-2">
                        בלי בדיקת מקור האמת לא ניתן לקבוע אם הנתון שגוי במקור, ב-API או רק בתצוגה. ציינו זאת בדיווח כהנחה לא מאומתת.
                      </Callout>
                    )}
                  </div>
                  <TextArea id="br-src" label="אילו מקורות הושוו (מקור / API / UI) ומה נמצא בכל אחד" value={r.data.sources} onChange={(v) => setData({ sources: v })} />
                  <TextArea id="br-q" label="שאילתת אימות (קריאה בלבד)" value={r.data.query} onChange={(v) => setData({ query: v })} mono rows={3} />
                </div>
              )}
              {r.category !== 'api' && r.category !== 'data' && <Callout tone="info">לקטגוריה זו אין שדות טכניים ייעודיים. תעדו את הראיות וההשערות למטה.</Callout>}
              <TextArea id="br-ev" label="ראיות ותצפיות" value={r.evidence} onChange={(v) => set({ evidence: v })} rows={4} hint="צילומי מסך, HAR מנוקה, לוגים, תוצאות השוואה. אל תצרפו טוקנים, סיסמאות או מידע אישי." />
              <div className="rounded-xl border border-warning/25 bg-warning/[0.04] p-4">
                <TextArea id="br-hyp" label="השערות לגבי הגורם (יסומנו כלא מאומתות)" value={r.hypotheses} onChange={(v) => set({ hypotheses: v })} rows={3} placeholder="ייתכן שמיפוי הטופס בצד הלקוח אינו כולל את zip – לא אומת." />
              </div>
            </div>
          )}

          {/* 5. Severity */}
          {step === 4 && (
            <div className="mt-4 space-y-5">
              <Callout tone="info" icon={Scale} title="Severity ≠ Priority">
                <strong>Severity</strong> מתארת את חומרת ההשפעה (נקבעת בעיקר ע״י QA). <strong>Priority</strong> מתארת את דחיפות התיקון (החלטה עסקית). באג קוסמטי בלוגו בדף הבית יכול להיות Low severity ו-P1 priority.
              </Callout>
              <div>
                <div className="label">חומרה (Severity) *</div>
                <div className="grid gap-2 md:grid-cols-2" role="radiogroup" aria-label="חומרה">
                  {(Object.keys(SEVERITY_GUIDE) as Severity[]).map((s) => (
                    <OptionCard key={s} selected={r.severity === s} onClick={() => set({ severity: s })} title={<span dir="ltr">{s}</span>} description={`${SEVERITY_GUIDE[s].desc} דוגמה: ${SEVERITY_GUIDE[s].example}`} />
                  ))}
                </div>
              </div>
              <div>
                <div className="label">עדיפות מוצעת (Priority)</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="עדיפות">
                  {(Object.keys(PRIORITY_GUIDE) as Priority[]).map((p) => (
                    <OptionCard key={p} selected={r.priority === p} onClick={() => set({ priority: p })} title={p} description={PRIORITY_GUIDE[p]} />
                  ))}
                </div>
              </div>
              <TextArea id="br-imp" label="השפעה" value={r.impact} onChange={(v) => set({ impact: v })} required={r.severity === 'Critical' || r.severity === 'High'} placeholder="מי מושפע, באיזה היקף, האם יש השפעה כספית / נתונים" />
              <TextArea id="br-wa" label="מעקף (Workaround)" value={r.workaround} onChange={(v) => set({ workaround: v })} rows={2} />
            </div>
          )}

          {/* 6. Quality gate */}
          {step === 5 && (
            <div className="mt-4 space-y-4">
              <div className={cn('flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center', gate.ready ? 'border-success/30 bg-success/[0.05]' : 'border-danger/30 bg-danger/[0.05]')}>
                {gate.ready ? <ShieldCheck className="size-8 text-success" aria-hidden /> : <AlertTriangle className="size-8 text-danger" aria-hidden />}
                <div className="flex-1">
                  <div className="font-bold text-fg">{gate.ready ? 'הדוח עבר את ה-Quality Gate' : `${gate.errors.length} פריטי חובה חסרים`}</div>
                  <div className="text-sm text-muted">{gate.warnings.length} המלצות לשיפור · ציון שלמות {gate.score}%</div>
                </div>
                <Progress value={gate.score} className="sm:w-40" tone={gate.ready ? 'success' : 'danger'} label="ציון שלמות" />
              </div>
              <ul className="space-y-1.5">
                {checks.map((c) => (
                  <li key={c.id} className={cn('flex items-start gap-3 rounded-lg border p-2.5', c.pass ? 'border-line' : c.level === 'error' ? 'border-danger/30 bg-danger/[0.04]' : 'border-warning/30 bg-warning/[0.04]')}>
                    {c.pass ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="עבר" /> : c.level === 'error' ? <XCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-label="חובה" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-label="המלצה" />}
                    <div className="min-w-0 flex-1">
                      <div className={cn('text-sm', c.pass ? 'text-muted' : 'font-medium text-fg')}>{c.label}</div>
                      {!c.pass && <div className="text-xs text-muted">{c.hint}</div>}
                    </div>
                    {!c.pass && (
                      <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => go(c.step)}>
                        תיקון
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 7. Final */}
          {step === 6 && (
            <div className="mt-4 space-y-4">
              {!gate.ready && (
                <Callout tone="warning" title="הדוח עדיין לא עבר את ה-Quality Gate">
                  אפשר להעתיק אותו, אבל מומלץ להשלים את {gate.errors.length} הפריטים החסרים קודם.
                </Callout>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Segmented
                  ariaLabel="פורמט"
                  value={format}
                  onChange={setFormat}
                  options={[
                    { value: 'text', label: 'טקסט (Jira)' },
                    { value: 'md', label: 'Markdown (Azure DevOps)' },
                  ]}
                />
                <div className="flex flex-wrap gap-2">
                  <CopyButton text={report} label="העתקה ללוח" variant="secondary" size="md" />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      downloadFile(`drqa-bug-report-${fileStamp()}.${format === 'md' ? 'md' : 'txt'}`, report);
                      toast('הקובץ הורד');
                    }}
                  >
                    <Download className="size-4" aria-hidden />
                    {format === 'md' ? 'MD' : 'TXT'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      downloadFile(`drqa-bug-report-${fileStamp()}.json`, buildReportJson(r), 'application/json;charset=utf-8');
                      toast('קובץ JSON הורד');
                    }}
                  >
                    <FileJson className="size-4" aria-hidden />
                    JSON
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-line bg-surface-2/40">
                <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5 text-xs text-muted">
                  <FileText className="size-4 text-accent" aria-hidden />
                  תצוגה מקדימה
                </div>
                <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap p-5 font-sans text-sm leading-7 text-fg">{report}</pre>
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="mt-6 flex items-center justify-between gap-2 border-t border-line pt-4">
            <button type="button" className="btn btn-secondary" disabled={step === 0} onClick={() => go(step - 1)}>
              <ArrowRight className="size-4" aria-hidden />
              הקודם
            </button>
            {stepIssues(step).filter((c) => c.level === 'error').length > 0 && step < 5 && <span className="hidden text-xs text-warning sm:block">{stepIssues(step).filter((c) => c.level === 'error').length} שדות חובה חסרים בשלב זה</span>}
            {step < STEPS.length - 1 && (
              <button type="button" className="btn btn-primary" onClick={() => go(step + 1)}>
                הבא
                <ArrowLeft className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </section>

        {/* Side: live gate */}
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="section-title">Quality Gate</h2>
              <span className={cn('badge', gate.ready ? 'badge-success' : 'badge-danger')}>{gate.ready ? 'מוכן' : 'חסר'}</span>
            </div>
            <Progress value={gate.score} tone={gate.ready ? 'success' : 'accent'} label="שלמות הדוח" />
            <div className="mt-2 text-xs text-muted">
              {gate.errors.length} חובה · {gate.warnings.length} המלצות
            </div>
            <ul className="mt-3 space-y-1">
              {STEPS.slice(0, 5).map((s, i) => {
                const errs = stepIssues(i).filter((c) => c.level === 'error').length;
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => go(i)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-surface-2">
                      <span className="text-muted">{s.label}</span>
                      {errs ? <span className="badge badge-danger">{errs}</span> : <CheckCircle2 className="size-3.5 text-success" aria-label="תקין" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <Callout tone="privacy" title="פרטיות">
            הטופס לא נשמר ולא נשלח. רענון הדף ימחק אותו – העתיקו או ייצאו לפני כן.
          </Callout>
        </aside>
      </div>
    </div>
  );
}
