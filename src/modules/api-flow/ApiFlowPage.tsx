import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, CircleHelp, Compass, Eye, Play, RotateCcw, ShieldAlert, Stethoscope, TriangleAlert, Workflow, XCircle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Callout } from '../../components/ui/Callout';
import { cn } from '../../utils/cn';
import { FLOW, FLOW_SCENARIOS, type NodeId, type NodeState } from './data';

const STATE_META: Record<NodeState, { label: string; ring: string; icon: typeof CheckCircle2; text: string }> = {
  ok: { label: 'תקין לפי הראיות', ring: 'border-success/60 shadow-[0_0_0_4px_color-mix(in_oklab,var(--success)_15%,transparent)]', icon: CheckCircle2, text: 'text-success' },
  fail: { label: 'כשל נצפה', ring: 'border-danger/70 shadow-[0_0_0_5px_color-mix(in_oklab,var(--danger)_20%,transparent)]', icon: XCircle, text: 'text-danger' },
  suspect: { label: 'חשוד – דורש אימות', ring: 'border-warning/70 shadow-[0_0_0_4px_color-mix(in_oklab,var(--warning)_18%,transparent)]', icon: TriangleAlert, text: 'text-warning' },
  unknown: { label: 'לא נבדק', ring: 'border-line-strong', icon: CircleHelp, text: 'text-subtle' },
};

export default function ApiFlowPage() {
  const [selected, setSelected] = useState<NodeId>('gateway');
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const scenario = FLOW_SCENARIOS.find((s) => s.id === scenarioId) ?? null;

  const states = useMemo(() => {
    const m = new Map<NodeId, { state: NodeState; observation: string }>();
    if (scenario) scenario.steps.slice(0, step + 1).forEach((s) => m.set(s.node, { state: s.state, observation: s.observation }));
    return m;
  }, [scenario, step]);

  const activeNode = scenario ? scenario.steps[step].node : null;
  const node = FLOW.find((n) => n.id === selected)!;
  const finished = scenario && step === scenario.steps.length - 1;

  const startScenario = (id: string) => {
    const s = FLOW_SCENARIOS.find((x) => x.id === id)!;
    setScenarioId(id);
    setStep(0);
    setSelected(s.steps[0].node);
  };
  const go = (i: number) => {
    if (!scenario) return;
    setStep(i);
    setSelected(scenario.steps[i].node);
  };

  return (
    <div>
      <PageHeader
        icon={Workflow}
        eyebrow="API Flow Explorer"
        title="סייר זרימת API"
        description="המסלול שבקשה עוברת – מהלחיצה ועד התוצאה במסך. לחצו על רכיב כדי לראות מה הוא עושה, איך הוא נכשל ומה אפשר (ומה אי אפשר) להסיק ממנו. או הריצו תרחיש כשל מודרך."
      />

      {/* Scenarios */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="me-1 text-xs font-medium text-subtle">תרחישי כשל:</span>
        {FLOW_SCENARIOS.map((s) => (
          <button key={s.id} type="button" onClick={() => startScenario(s.id)} className={cn('chip', scenarioId === s.id && 'chip-active')}>
            <Play className="size-3" aria-hidden />
            {s.title}
          </button>
        ))}
        {scenario && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setScenarioId(null);
              setStep(0);
            }}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            מצב חופשי
          </button>
        )}
      </div>

      {/* Diagram */}
      <section className="card relative overflow-hidden p-4 md:p-6" aria-label="תרשים זרימת בקשה">
        <div className="grid-pattern pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <ol className="relative grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 xl:flex xl:items-stretch xl:gap-0">
          {FLOW.map((n, i) => {
            const st = states.get(n.id);
            const meta = st ? STATE_META[st.state] : null;
            const isSel = selected === n.id;
            const isActive = activeNode === n.id;
            return (
              <li key={n.id} className="flex items-center xl:flex-1">
                <button
                  type="button"
                  onClick={() => setSelected(n.id)}
                  aria-pressed={isSel}
                  aria-label={`${n.title}${meta ? ` – ${meta.label}` : ''}`}
                  className={cn(
                    'group relative flex w-full flex-col items-center gap-2 rounded-2xl border-2 bg-surface px-2 py-3 text-center transition hover:-translate-y-0.5',
                    meta ? meta.ring : isSel ? 'border-accent/70 shadow-[0_0_0_4px_rgb(var(--glow)/0.15)]' : 'border-line hover:border-line-strong',
                    isActive && 'scale-[1.04]',
                  )}
                >
                  {st?.state === 'fail' && <span className="absolute -top-1.5 end-2 size-3 animate-ping-slow rounded-full bg-danger" aria-hidden />}
                  <span className={cn('grid size-11 place-items-center rounded-xl transition', meta ? 'bg-surface-2' : isSel ? 'bg-accent/15' : 'bg-surface-2 group-hover:bg-surface-3')}>
                    <n.icon className={cn('size-5', meta ? meta.text : isSel ? 'text-accent' : 'text-muted')} aria-hidden />
                  </span>
                  <span className="text-xs font-semibold leading-tight text-fg">{n.title}</span>
                  <span className="text-[10px] leading-tight text-subtle" dir="ltr">
                    {n.en}
                  </span>
                  {meta && (
                    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold', meta.text)}>
                      <meta.icon className="size-3" aria-hidden />
                      {meta.label}
                    </span>
                  )}
                </button>
                {i < FLOW.length - 1 && (
                  <span className="hidden w-6 shrink-0 items-center justify-center xl:flex" aria-hidden>
                    <ChevronLeft className={cn('size-5', states.has(FLOW[i + 1].id) ? 'text-accent' : 'text-line-strong')} />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <div className="relative mt-5 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-2xs text-subtle">
          {(Object.keys(STATE_META) as NodeState[]).map((s) => {
            const M = STATE_META[s];
            return (
              <span key={s} className="inline-flex items-center gap-1">
                <M.icon className={cn('size-3', M.text)} aria-hidden />
                {M.label}
              </span>
            );
          })}
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Scenario walkthrough */}
        {scenario ? (
          <section className="card flex flex-col p-5" aria-live="polite">
            <div className="mb-1 text-2xs font-semibold text-accent">תרחיש מודרך · נתונים בדויים</div>
            <h2 className="text-lg font-bold text-fg">{scenario.title}</h2>
            <p className="mt-1 rounded-lg bg-surface-2 p-3 text-sm text-muted">
              <span className="font-semibold text-fg">סימפטום: </span>
              {scenario.symptom}
            </p>
            <ol className="mt-4 space-y-2">
              {scenario.steps.map((s, i) => {
                const M = STATE_META[s.state];
                const n = FLOW.find((f) => f.id === s.node)!;
                const visible = i <= step;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => go(i)}
                      disabled={!visible && i !== step + 1}
                      className={cn('flex w-full items-start gap-3 rounded-xl border p-3 text-start transition', i === step ? 'border-accent/50 bg-accent/[0.06]' : visible ? 'border-line' : 'border-dashed border-line opacity-50')}
                    >
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-2xs font-bold text-muted">{i + 1}</span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-sm font-semibold text-fg">
                          {n.title}
                          {visible && <M.icon className={cn('size-3.5', M.text)} aria-label={M.label} />}
                        </span>
                        {visible ? <span className="text-sm leading-6 text-muted">{s.observation}</span> : <span className="text-xs text-subtle">לחצו "הבא" כדי לבדוק</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 flex justify-between gap-2">
              <button type="button" className="btn btn-secondary btn-sm" disabled={step === 0} onClick={() => go(step - 1)}>
                <ArrowRight className="size-3.5" aria-hidden />
                הקודם
              </button>
              <button type="button" className="btn btn-primary btn-sm" disabled={!!finished} onClick={() => go(step + 1)}>
                בדיקת הרכיב הבא
                <ArrowLeft className="size-3.5" aria-hidden />
              </button>
            </div>
            {finished && (
              <div className="mt-4 space-y-3 animate-fade-in">
                <Callout tone="success" title="מה הראיות מראות">
                  {scenario.conclusion}
                </Callout>
                <Callout tone="warning" title="המלכודת">
                  {scenario.trap}
                </Callout>
                {scenario.doctorEntry && (
                  <Link to={`/api-doctor?entry=${scenario.doctorEntry}`} className="btn btn-secondary btn-sm">
                    <Stethoscope className="size-4" aria-hidden />
                    חקירה מלאה ב-API Doctor
                  </Link>
                )}
              </div>
            )}
          </section>
        ) : (
          <section className="card p-5">
            <h2 className="mb-2 text-lg font-bold text-fg">איך להשתמש בסייר</h2>
            <ul className="space-y-2 text-sm leading-6 text-muted">
              <li>• לחצו על כל רכיב בתרשים כדי לראות את תפקידו, כשלים אופייניים והראיות שהוא מספק.</li>
              <li>• בחרו תרחיש כשל כדי לעבור רכיב-רכיב ולראות איך מצטברת התמונה.</li>
              <li>• שימו לב להבדל בין "כשל נצפה" ל"חשוד" – בדיוק כמו בין ממצא להשערה.</li>
            </ul>
            <Callout tone="info" className="mt-4">
              הרכיב שבו השגיאה <strong>נראית</strong> הוא לא תמיד הרכיב שבו היא <strong>נוצרה</strong>.
            </Callout>
          </section>
        )}

        {/* Node details */}
        <section className="card overflow-hidden" aria-live="polite">
          <div className="flex items-center gap-3 border-b border-line p-5">
            <span className="grid size-11 place-items-center rounded-xl bg-accent/10 text-accent">
              <node.icon className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-bold text-fg">{node.title}</h2>
              <div className="text-xs text-subtle" dir="ltr" style={{ textAlign: 'right' }}>
                {node.en}
              </div>
            </div>
          </div>
          <div className="space-y-4 p-5">
            {states.get(node.id) && (
              <div className={cn('rounded-xl border p-3 text-sm', STATE_META[states.get(node.id)!.state].ring)}>
                <span className="font-semibold text-fg">בתרחיש: </span>
                <span className="text-muted">{states.get(node.id)!.observation}</span>
              </div>
            )}
            <p className="text-sm leading-7 text-fg">{node.role}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface-2/50 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-danger">
                  <TriangleAlert className="size-3.5" aria-hidden />
                  כשלים אופייניים
                </div>
                <ul className="space-y-1 text-sm text-muted">
                  {node.failures.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/50 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <Eye className="size-3.5" aria-hidden />
                  ראיות רלוונטיות
                </div>
                <ul className="space-y-1 text-sm text-muted">
                  {node.evidence.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/50 p-3 sm:col-span-2">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-violet">
                  <Compass className="size-3.5" aria-hidden />
                  בדיקות מומלצות
                </div>
                <ul className="space-y-1 text-sm text-muted">
                  {node.checks.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-success/25 bg-success/[0.05] p-3">
                <div className="mb-1 text-xs font-semibold text-success">מה אפשר להסיק</div>
                <p className="text-sm text-fg">{node.canConclude}</p>
              </div>
              <div className="rounded-xl border border-warning/25 bg-warning/[0.05] p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-warning">
                  <ShieldAlert className="size-3.5" aria-hidden />
                  מה אי אפשר להסיק
                </div>
                <p className="text-sm text-fg">{node.cannotConclude}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
