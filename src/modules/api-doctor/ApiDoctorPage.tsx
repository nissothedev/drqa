import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, LayoutGrid, RotateCcw, ShieldAlert, Stethoscope, PartyPopper } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/Badges';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { Tabs } from '../../components/ui/Tabs';
import { FictionalTag } from '../../components/ui/misc';
import type { Answers } from '../../types/diagnostics';
import { answer, answersBefore, diagnose, walk } from './engine';
import { contextFor, entryById, SCENARIO_BY_ID } from './data';
import { ScenarioPicker } from './ScenarioPicker';
import { PathHistory, PhaseTracker, QuestionCard, presetSet } from './QuestionFlow';
import { LiveEvidence } from './EvidenceBoard';
import { ResultsPanel } from './ResultsPanel';

function ScenarioBrief({ scenarioId }: { scenarioId: string }) {
  const s = SCENARIO_BY_ID[scenarioId];
  const [demo, setDemo] = useState<'request' | 'response'>('response');
  const [open, setOpen] = useState(true);
  return (
    <section className="card overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-start">
        {s.code ? <StatusBadge code={s.code} size="lg" /> : <span className="badge badge-accent text-xs">{s.shortTitle}</span>}
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-fg" dir="ltr" style={{ textAlign: 'right' }}>
            {s.title}
          </h2>
          <p className="text-sm text-muted">{s.tagline}</p>
        </div>
        <ChevronDown className={`size-4 shrink-0 text-subtle transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="grid gap-4 border-t border-line p-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-xs font-semibold text-accent">מה זה אומר</div>
              <p className="text-sm leading-7 text-fg">{s.meaning}</p>
            </div>
            <div className="rounded-xl border border-warning/25 bg-warning/[0.05] p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-warning">
                <ShieldAlert className="size-3.5" aria-hidden />
                מה זה לבדו לא מוכיח
              </div>
              <ul className="space-y-1 text-sm leading-6 text-muted">
                {s.notProof.map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Tabs
                size="sm"
                ariaLabel="דוגמה"
                value={demo}
                onChange={setDemo}
                tabs={[
                  { id: 'request', label: 'בקשה לדוגמה' },
                  { id: 'response', label: 'תגובה לדוגמה' },
                ]}
              />
              <FictionalTag />
            </div>
            <CodeBlock code={demo === 'request' ? s.demo.request : s.demo.response} lang="http" maxHeight={260} />
            {s.demo.note && <p className="text-xs leading-5 text-subtle">💡 {s.demo.note}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

export default function ApiDoctorPage() {
  const [params, setParams] = useSearchParams();
  const entryId = params.get('entry');
  const entry = entryId ? entryById(entryId) : undefined;
  const scenario = entry ? SCENARIO_BY_ID[entry.scenarioId] : undefined;
  const ctx = useMemo(() => (scenario ? contextFor(scenario) : null), [scenario]);

  const [answers, setAnswers] = useState<Answers>({});
  const [collected, setCollected] = useState<Set<number>>(new Set());

  // Reset the investigation whenever the entry point changes.
  useEffect(() => {
    setAnswers({ ...(entry?.preset ?? {}) });
    setCollected(new Set());
  }, [entry]);

  const walkResult = useMemo(() => (ctx ? walk(ctx, answers) : null), [ctx, answers]);
  const diagnosis = useMemo(() => (ctx ? diagnose(ctx, answers) : null), [ctx, answers]);

  const pick = useCallback((id: string) => setParams({ entry: id }), [setParams]);
  const restart = () => {
    setAnswers({ ...(entry?.preset ?? {}) });
    setCollected(new Set());
  };
  const exit = () => setParams({});

  const onAnswer = (nodeId: string, optionId: string) => {
    if (!ctx) return;
    setAnswers((a) => answer(ctx, a, nodeId, optionId));
  };
  const rewindTo = (nodeId: string) => {
    if (!ctx) return;
    setAnswers((a) => answersBefore(ctx, a, nodeId));
  };
  const goBack = () => {
    if (!ctx || !walkResult) return;
    const answered = walkResult.path.filter((s) => s.option && !(entry?.preset && s.node.id in entry.preset));
    const last = answered[answered.length - 1];
    if (last) rewindTo(last.node.id);
  };

  const answeredCount = walkResult?.path.filter((s) => s.option).length ?? 0;

  return (
    <div>
      <PageHeader
        icon={Stethoscope}
        eyebrow="API Doctor · Flagship"
        title="API Doctor"
        description="מנוע אבחון מודרך: בחרו סימפטום, ענו על שאלות ממוקדות, וקבלו תמונת ראיות מובנית – עובדות, השערות מדורגות, הנחות ובדיקות המשך. המנוע דטרמיניסטי ופועל מקומית."
        actions={
          scenario && (
            <>
              <button type="button" className="btn btn-secondary" onClick={restart}>
                <RotateCcw className="size-4" aria-hidden />
                התחלה מחדש
              </button>
              <button type="button" className="btn btn-ghost" onClick={exit}>
                <LayoutGrid className="size-4" aria-hidden />
                תרחיש אחר
              </button>
            </>
          )
        }
      />

      {!scenario || !ctx || !walkResult || !diagnosis ? (
        <ScenarioPicker onPick={pick} />
      ) : (
        <div className="space-y-5">
          <ScenarioBrief scenarioId={scenario.id} />

          <div className="card px-3 py-2">
            <PhaseTracker path={walkResult.path} complete={walkResult.complete} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-5">
              {walkResult.current ? (
                <QuestionCard
                  node={walkResult.current}
                  selected={answers[walkResult.current.id]}
                  onSelect={(o) => onAnswer(walkResult.current!.id, o)}
                  onBack={goBack}
                  canGoBack={answeredCount > Object.keys(entry?.preset ?? {}).length}
                  stepNumber={answeredCount + 1}
                />
              ) : (
                <section className="card gradient-border flex flex-col items-start gap-3 p-5 md:flex-row md:items-center animate-fade-in">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-success/10 text-success">
                    <PartyPopper className="size-5" aria-hidden />
                  </span>
                  <div className="flex-1">
                    <h2 className="font-bold text-fg">שלב השאלות הושלם</h2>
                    <p className="text-sm text-muted">
                      יש לכם תמונת ראיות מסודרת. השלב הבא הוא <strong className="text-fg">לבצע</strong> את הבדיקות המומלצות – רק כך השערה הופכת לממצא.
                    </p>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={goBack}>
                    שינוי התשובה האחרונה
                  </button>
                </section>
              )}
              <ResultsPanel
                key={`${scenario.id}-${walkResult.complete}`}
                scenario={scenario}
                path={walkResult.path}
                diagnosis={diagnosis}
                complete={walkResult.complete}
                collected={collected}
                onToggleEvidence={(i, v) =>
                  setCollected((c) => {
                    const n = new Set(c);
                    if (v) n.add(i);
                    else n.delete(i);
                    return n;
                  })
                }
              />
            </div>
            <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
              <LiveEvidence diagnosis={diagnosis} />
              <PathHistory path={walkResult.path} presetIds={presetSet(entry?.preset)} onChange={onAnswer} onRewind={rewindTo} />
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
