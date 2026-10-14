import { EVIDENCE_META, EvidenceBadge, type EvidenceKind } from '../../components/ui/Badges';
import type { Diagnosis } from '../../types/diagnostics';
import { cn } from '../../utils/cn';
import { LEVEL_LABEL } from './summary';
import { LAYER_LABEL } from './data/hypotheses';

const LEVEL_CLS = {
  stronger: 'from-violet to-accent',
  possible: 'from-violet/70 to-violet/40',
  weaker: 'from-line-strong to-line-strong',
};

/** Compact live board shown beside the questions; updates as answers change. */
export function LiveEvidence({ diagnosis }: { diagnosis: Diagnosis }) {
  const top = diagnosis.hypotheses.filter((h) => h.score > 0).slice(0, 4);
  const max = Math.max(6, ...top.map((h) => h.score));
  const counts: Array<[EvidenceKind, number]> = [
    ['observed', diagnosis.facts.length],
    ['assumption', diagnosis.assumptions.length],
    ['confirmed', diagnosis.confirmed.length],
  ];
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="section-title">לוח ראיות חי</h2>
        <span className="flex items-center gap-1.5 text-2xs text-success">
          <span className="size-1.5 animate-pulse rounded-full bg-success" aria-hidden />
          מתעדכן לפי התשובות
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-x-reverse divide-line border-b border-line">
        {counts.map(([k, n]) => {
          const Icon = EVIDENCE_META[k].icon;
          return (
            <div key={k} className="p-3 text-center">
              <Icon className={cn('mx-auto mb-1 size-4', EVIDENCE_META[k].cls.split(' ')[0])} aria-hidden />
              <div className="text-xl font-bold text-fg">{n}</div>
              <div className="text-2xs leading-4 text-subtle">{EVIDENCE_META[k].label}</div>
            </div>
          );
        })}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <EvidenceBadge kind="hypothesis" />
          <span className="text-2xs text-subtle">דירוג יחסי – לא הסתברות</span>
        </div>
        {top.length === 0 && <p className="text-xs text-muted">ענו על השאלות כדי לדרג השערות.</p>}
        {top.map((h) => (
          <div key={h.id}>
            <div className="mb-1 flex items-start justify-between gap-2 text-xs">
              <span className="font-medium leading-5 text-fg">{h.title}</span>
              <span className="shrink-0 text-2xs text-subtle">{LAYER_LABEL[h.layer]}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div className={cn('h-full rounded-full bg-gradient-to-l transition-all duration-500', LEVEL_CLS[h.level])} style={{ width: `${Math.max(8, (h.score / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceList({ kind, items, empty }: { kind: EvidenceKind; items: string[]; empty: string }) {
  const m = EVIDENCE_META[kind];
  return (
    <section className="card flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <EvidenceBadge kind={kind} />
        <span className="text-xs font-semibold text-fg">{m.label}</span>
      </div>
      <p className="mb-3 text-2xs leading-4 text-subtle">{m.desc}</p>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-2 text-xs text-subtle">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it} className="flex gap-2 text-sm leading-6 text-fg">
              <span className={cn('mt-2.5 size-1.5 shrink-0 rounded-full', kind === 'observed' ? 'bg-accent' : kind === 'assumption' ? 'bg-warning' : 'bg-success')} aria-hidden />
              {it}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function EvidenceQuadrants({ diagnosis }: { diagnosis: Diagnosis }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <EvidenceList kind="observed" items={diagnosis.facts} empty="לא נרשמו עובדות." />
      <EvidenceList kind="assumption" items={diagnosis.assumptions} empty="לא זוהו הנחות לא מאומתות." />
      <EvidenceList kind="confirmed" items={diagnosis.confirmed} empty="אין עדיין ממצא מאומת. זה תקין – ממצא דורש ראיה ישירה." />
    </div>
  );
}

export function HypothesisList({ diagnosis }: { diagnosis: Diagnosis }) {
  const visible = diagnosis.hypotheses.filter((h) => h.score > 0);
  const hidden = diagnosis.hypotheses.filter((h) => h.score <= 0);
  const max = Math.max(6, ...visible.map((h) => h.score));
  return (
    <div className="space-y-3">
      {visible.map((h, i) => (
        <article key={h.id} className={cn('rounded-xl border p-4 transition', i === 0 ? 'border-violet/40 bg-violet/[0.05]' : 'border-line bg-surface-2/40')}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-6 place-items-center rounded-full bg-surface-3 text-2xs font-bold text-muted">{i + 1}</span>
            <h3 className="font-semibold text-fg">{h.title}</h3>
            <span className={cn('badge', h.level === 'stronger' ? 'badge-violet' : h.level === 'possible' ? 'badge-neutral' : 'badge-neutral opacity-70')}>{LEVEL_LABEL[h.level]}</span>
            <span className="badge badge-neutral">{LAYER_LABEL[h.layer]}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{h.description}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div className={cn('h-full rounded-full bg-gradient-to-l', LEVEL_CLS[h.level])} style={{ width: `${Math.max(6, (h.score / max) * 100)}%` }} />
          </div>
          {(h.support.length > 0 || h.against.length > 0) && (
            <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
              {h.support.length > 0 && (
                <div>
                  <div className="mb-1 font-semibold text-success">תומך:</div>
                  <ul className="space-y-0.5 text-muted">
                    {h.support.map((s) => (
                      <li key={s}>+ {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {h.against.length > 0 && (
                <div>
                  <div className="mb-1 font-semibold text-danger">מחליש:</div>
                  <ul className="space-y-0.5 text-muted">
                    {h.against.map((s) => (
                      <li key={s}>− {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </article>
      ))}
      {hidden.length > 0 && (
        <details className="rounded-xl border border-line p-3 text-sm">
          <summary className="cursor-pointer text-muted">השערות שנחלשו לפי התשובות ({hidden.length})</summary>
          <ul className="mt-2 space-y-1 text-xs text-subtle">
            {hidden.map((h) => (
              <li key={h.id}>
                {h.title} — {h.against.length ? `נחלשה בגלל: ${h.against.join(' | ')}` : 'ללא ראיה תומכת'}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-2xs text-subtle">השערה שנחלשה עדיין לא נשללה – היא רק פחות נתמכת בראיות הנוכחיות.</p>
        </details>
      )}
    </div>
  );
}
