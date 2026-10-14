import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Layers, RotateCcw, Siren, Stethoscope } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Callout } from '../../components/ui/Callout';
import type { Answers } from '../../types/diagnostics';
import { answer, answersBefore, diagnose, walk } from '../api-doctor/engine';
import { contextFor } from '../api-doctor/data';
import { LAYER_LABEL } from '../api-doctor/data/hypotheses';
import { PathHistory, PhaseTracker, QuestionCard } from '../api-doctor/QuestionFlow';
import { LiveEvidence } from '../api-doctor/EvidenceBoard';
import { ResultsPanel } from '../api-doctor/ResultsPanel';
import { API_DOCTOR_HANDOFF, INCIDENT } from './scenario';

const NO_PRESET = new Set<string>();

export default function IncidentPage() {
  const ctx = useMemo(() => contextFor(INCIDENT), []);
  const [answers, setAnswers] = useState<Answers>({});
  const [collected, setCollected] = useState<Set<number>>(new Set());
  const w = useMemo(() => walk(ctx, answers), [ctx, answers]);
  const d = useMemo(() => diagnose(ctx, answers), [ctx, answers]);
  const answered = w.path.filter((s) => s.option);

  const handoff = answered.map((s) => API_DOCTOR_HANDOFF[s.option!.id]).find(Boolean);

  // Aggregate hypothesis weight per layer – a quick "where to look" view.
  const layers = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of d.hypotheses) if (h.score > 0) m.set(h.layer, (m.get(h.layer) ?? 0) + h.score);
    const total = [...m.values()].reduce((a, b) => a + b, 0) || 1;
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([layer, v]) => ({ layer, pct: Math.round((v / total) * 100) }));
  }, [d]);

  return (
    <div>
      <PageHeader
        icon={Siren}
        eyebrow="Incident Investigator"
        title="חוקר תקלות"
        description="כשלא ברור איפה הבעיה: חקירה מבוססת ראיות שמבודדת את השכבה – UI, API, נתונים, אימות, אינטגרציה או ביצועים. כשמזוהה כשל API, תקבלו מעבר ישיר ל-API Doctor."
        actions={
          answered.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setAnswers({});
                setCollected(new Set());
              }}
            >
              <RotateCcw className="size-4" aria-hidden />
              התחלה מחדש
            </button>
          )
        }
      />

      <div className="card mb-5 px-3 py-2">
        <PhaseTracker path={w.path} complete={w.complete} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          {w.current ? (
            <QuestionCard
              node={w.current}
              selected={answers[w.current.id]}
              onSelect={(o) => setAnswers((a) => answer(ctx, a, w.current!.id, o))}
              canGoBack={answered.length > 0}
              onBack={() => setAnswers((a) => answersBefore(ctx, a, answered[answered.length - 1].node.id))}
              stepNumber={answered.length + 1}
            />
          ) : (
            <Callout tone="success" title="שלב השאלות הושלם">
              עברו לבדיקות המומלצות כדי לאמת את ההשערה המובילה, ותעדו את הממצאים.
            </Callout>
          )}

          {handoff && (
            <div className="card gradient-border flex flex-col gap-3 p-4 sm:flex-row sm:items-center animate-fade-in">
              <Stethoscope className="size-8 shrink-0 text-accent" aria-hidden />
              <div className="flex-1">
                <div className="font-semibold text-fg">זוהה כשל ברמת API</div>
                <p className="text-sm text-muted">API Doctor מעמיק בדיוק בסוג הזה של תקלות – עם שאלות ובדיקות ייעודיות.</p>
              </div>
              <Link to={handoff.entry ? `/api-doctor?entry=${handoff.entry}` : '/api-doctor'} className="btn btn-primary btn-sm">
                {handoff.label}
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
          )}

          <ResultsPanel
            key={String(w.complete)}
            scenario={INCIDENT}
            path={w.path}
            diagnosis={d}
            complete={w.complete}
            collected={collected}
            toolName="Incident Investigator"
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
          <section className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 section-title">
              <Layers className="size-4 text-accent" aria-hidden />
              איפה כדאי לחפש
            </h2>
            {layers.length === 0 ? (
              <p className="text-xs text-muted">ענו על השאלות כדי לראות את התפלגות החשד בין השכבות.</p>
            ) : (
              <ul className="space-y-2.5">
                {layers.map((l) => (
                  <li key={l.layer}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-fg">{LAYER_LABEL[l.layer as keyof typeof LAYER_LABEL]}</span>
                      <span className="text-subtle">{l.pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div className="h-full rounded-full bg-gradient-to-l from-accent to-violet transition-all duration-500" style={{ width: `${l.pct}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-2xs leading-4 text-subtle">משקל יחסי של ההשערות לפי שכבה – כיוון לחקירה, לא הסתברות.</p>
          </section>
          <LiveEvidence diagnosis={d} />
          <PathHistory path={w.path} presetIds={NO_PRESET} onChange={(n, o) => setAnswers((a) => answer(ctx, a, n, o))} onRewind={(n) => setAnswers((a) => answersBefore(ctx, a, n))} />
        </aside>
      </div>
    </div>
  );
}
