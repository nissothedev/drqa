import { useState } from 'react';
import { ArrowRight, Check, CircleDot, Lightbulb, Pencil, Undo2 } from 'lucide-react';
import type { Answers, DecisionNode, Phase, PathStep } from '../../types/diagnostics';
import { OptionCard } from '../../components/ui/Field';
import { cn } from '../../utils/cn';

export const PHASES: Array<{ id: Phase | 'evidence' | 'hypotheses' | 'checks' | 'summary'; label: string }> = [
  { id: 'symptom', label: 'סימפטום' },
  { id: 'reproducibility', label: 'שחזור' },
  { id: 'environment', label: 'סביבה' },
  { id: 'request', label: 'בקשה' },
  { id: 'response', label: 'תגובה' },
  { id: 'contract', label: 'חוזה' },
  { id: 'followup', label: 'המשך' },
  { id: 'evidence', label: 'ראיות' },
  { id: 'hypotheses', label: 'השערות' },
  { id: 'checks', label: 'בדיקות' },
  { id: 'summary', label: 'סיכום' },
];

export const PHASE_LABEL: Record<Phase, string> = {
  symptom: 'זיהוי סימפטום',
  reproducibility: 'שחזור',
  environment: 'סביבה',
  request: 'בחינת הבקשה',
  response: 'בחינת התגובה',
  contract: 'השוואה לחוזה',
  followup: 'שאלת המשך',
};

/** 11-step investigation tracker. Phases a scenario doesn't need are shown as skipped. */
export function PhaseTracker({ path, complete }: { path: PathStep[]; complete: boolean }) {
  const visited = new Set(path.filter((s) => s.option).map((s) => s.node.phase));
  const currentPhase = complete ? 'evidence' : path[path.length - 1]?.node.phase;
  const currentIdx = PHASES.findIndex((p) => p.id === currentPhase);
  return (
    <ol className="flex gap-1 overflow-x-auto pb-1" aria-label="שלבי החקירה">
      {PHASES.map((p, i) => {
        const done = complete ? true : visited.has(p.id as Phase) && p.id !== currentPhase;
        const active = p.id === currentPhase;
        const skipped = !done && !active && i < currentIdx;
        return (
          <li
            key={p.id}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex min-w-[72px] flex-1 flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center transition',
              active && 'bg-accent/10',
            )}
          >
            <span
              className={cn(
                'grid size-6 place-items-center rounded-full border text-[10px] font-bold',
                done && 'border-accent/50 bg-accent/15 text-accent',
                active && 'border-transparent bg-gradient-to-br from-accent to-accent-2 text-on-accent',
                skipped && 'border-dashed border-line-strong text-subtle',
                !done && !active && !skipped && 'border-line-strong text-subtle',
              )}
            >
              {done ? <Check className="size-3" aria-hidden /> : i + 1}
            </span>
            <span className={cn('text-[11px] leading-tight', active ? 'font-semibold text-fg' : done ? 'text-muted' : 'text-subtle')}>{p.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function QuestionCard({
  node,
  selected,
  onSelect,
  onBack,
  canGoBack,
  stepNumber,
}: {
  node: DecisionNode;
  selected?: string;
  onSelect: (optionId: string) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  stepNumber: number;
}) {
  return (
    <section key={node.id} className="card gradient-border animate-fade-in p-5 md:p-6" aria-labelledby={`q-${node.id}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="badge badge-accent">שאלה {stepNumber}</span>
          <span className="badge badge-neutral">{PHASE_LABEL[node.phase]}</span>
        </div>
        {canGoBack && onBack && (
          <button type="button" onClick={onBack} className="btn btn-ghost btn-sm">
            <ArrowRight className="size-3.5" aria-hidden />
            חזרה לשאלה הקודמת
          </button>
        )}
      </div>
      <h2 id={`q-${node.id}`} className="text-lg font-bold leading-8 text-fg md:text-xl">
        {node.question}
      </h2>
      {node.help && (
        <p className="mt-2 flex gap-2 text-sm leading-6 text-muted">
          <Lightbulb className="mt-1 size-4 shrink-0 text-warning" aria-hidden />
          {node.help}
        </p>
      )}
      <div role="radiogroup" aria-labelledby={`q-${node.id}`} className="mt-5 grid gap-2.5">
        {node.options.map((o) => (
          <OptionCard key={o.id} selected={selected === o.id} onClick={() => onSelect(o.id)} title={o.label} description={o.description} />
        ))}
      </div>
    </section>
  );
}

/** Answered steps with inline editing; changing an answer re-routes the tree. */
export function PathHistory({
  path,
  presetIds,
  onChange,
  onRewind,
}: {
  path: PathStep[];
  presetIds: Set<string>;
  onChange: (nodeId: string, optionId: string) => void;
  onRewind: (nodeId: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const answered = path.filter((s) => s.option);
  if (answered.length === 0) return null;
  return (
    <section className="card p-4" aria-label="מסלול החקירה">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">מסלול החקירה</h2>
        <span className="text-2xs text-subtle">שינוי תשובה מחשב מחדש את המסלול</span>
      </div>
      <ol className="relative space-y-1 before:absolute before:inset-y-3 before:start-[11px] before:w-px before:bg-line">
        {answered.map((s, i) => {
          const isEditing = editing === s.node.id;
          return (
            <li key={s.node.id} className="relative ps-8">
              <span className="absolute start-0 top-2.5 grid size-6 place-items-center rounded-full border border-accent/40 bg-surface text-accent">
                <CircleDot className="size-3" aria-hidden />
              </span>
              <div className={cn('rounded-lg p-2 transition', isEditing ? 'bg-surface-2' : 'hover:bg-surface-2/60')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-2xs text-subtle">
                      {i + 1}. {PHASE_LABEL[s.node.phase]}
                      {presetIds.has(s.node.id) && <span className="badge badge-violet ms-2">נבחר מראש לפי הסימפטום</span>}
                    </div>
                    <div className="text-xs leading-5 text-muted">{s.node.question}</div>
                    <div className="text-sm font-medium text-fg">← {s.option!.label}</div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => setEditing(isEditing ? null : s.node.id)} aria-label={`שינוי התשובה: ${s.node.question}`} title="שינוי תשובה">
                      <Pencil className="size-3.5" />
                    </button>
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => onRewind(s.node.id)} aria-label={`חזרה לשאלה: ${s.node.question}`} title="חזרה לשאלה זו">
                      <Undo2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <div className="mt-2 grid gap-1.5" role="radiogroup" aria-label={s.node.question}>
                    {s.node.options.map((o) => (
                      <OptionCard
                        key={o.id}
                        className="p-2.5"
                        selected={s.option!.id === o.id}
                        onClick={() => {
                          onChange(s.node.id, o.id);
                          setEditing(null);
                        }}
                        title={o.label}
                      />
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function presetSet(preset?: Answers): Set<string> {
  return new Set(Object.keys(preset ?? {}));
}
