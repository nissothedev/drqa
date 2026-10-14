import { useMemo, useState } from 'react';
import { GitCompareArrows } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Callout } from '../../components/ui/Callout';
import { CopyButton } from '../../components/ui/CopyButton';
import { EmptyState } from '../../components/ui/misc';
import { Toggle } from '../../components/ui/Field';
import { cn } from '../../utils/cn';
import { AREAS, CHANGE_TYPES, LEVEL_LABEL, planRegression, planToText, type Level, type PlanInput } from './planner';

const LEVEL_CLS: Record<Level, string> = { must: 'badge-danger', should: 'badge-warning', could: 'badge-neutral' };

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export default function RegressionPage() {
  const [input, setInput] = useState<PlanInput>({ changes: ['api-contract'], areas: ['checkout'], risk: { nearRelease: false, bugHistory: false, noAutomation: false } });
  const items = useMemo(() => planRegression(input), [input]);
  const [done, setDone] = useState<Set<string>>(new Set());

  return (
    <div>
      <PageHeader
        icon={GitCompareArrows}
        eyebrow="Regression Planner"
        title="מתכנן רגרסיה"
        description="סמנו מה השתנה ואילו אזורים מושפעים – ותקבלו רשימת אזורי רגרסיה מתועדפת עם הנימוק לכל פריט."
      />
      <Callout tone="warning" title="הצעה – לא כיסוי מובטח" className="mb-5">
        התכנית נגזרת מחוקים כלליים. היא לא מכירה את הקוד שלכם, ואינה מחליפה ניתוח השפעה עם המפתחים. השתמשו בה כנקודת פתיחה לדיון.
      </Callout>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="card space-y-5 p-5">
          <div>
            <h2 className="section-title mb-2">מה השתנה?</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {CHANGE_TYPES.map((c) => {
                const on = input.changes.includes(c.id);
                return (
                  <label key={c.id} className={cn('flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition', on ? 'border-accent/50 bg-accent/[0.06]' : 'border-line hover:border-line-strong')}>
                    <input type="checkbox" checked={on} onChange={() => setInput((s) => ({ ...s, changes: toggle(s.changes, c.id) }))} className="mt-0.5 size-4" />
                    <span>
                      <span className="block text-sm font-medium text-fg">{c.label}</span>
                      <span className="block text-xs text-muted">{c.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <h2 className="section-title mb-2">אזורים מושפעים ב-Demo Shop</h2>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <button key={a.id} type="button" aria-pressed={input.areas.includes(a.id)} onClick={() => setInput((s) => ({ ...s, areas: toggle(s.areas, a.id) }))} className={cn('chip', input.areas.includes(a.id) && 'chip-active')}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="section-title">גורמי סיכון</h2>
            <Toggle checked={input.risk.nearRelease} onChange={(v) => setInput((s) => ({ ...s, risk: { ...s.risk, nearRelease: v } }))} label="קרוב לשחרור" description="מעלה עדיפות לפריטים שמושפעים מכמה שינויים" />
            <Toggle checked={input.risk.bugHistory} onChange={(v) => setInput((s) => ({ ...s, risk: { ...s.risk, bugHistory: v } }))} label="היסטוריית באגים באזור" description='פריטי "אם יש זמן" הופכים ל"מומלץ"' />
            <Toggle checked={input.risk.noAutomation} onChange={(v) => setInput((s) => ({ ...s, risk: { ...s.risk, noAutomation: v } }))} label="אין כיסוי אוטומציה" />
          </div>
        </section>

        <section className="card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="section-title">
              תכנית מוצעת · {items.length} פריטים · {done.size} סומנו
            </h2>
            {items.length > 0 && <CopyButton text={() => planToText(items, input)} label="העתקה כצ׳קליסט" variant="secondary" />}
          </div>
          {items.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={GitCompareArrows} title="בחרו לפחות שינוי אחד או אזור אחד" />
            </div>
          ) : (
            <ul className="space-y-2 p-4">
              {items.map((it) => (
                <li key={it.title} className={cn('flex items-start gap-3 rounded-xl border p-3 transition', done.has(it.title) ? 'border-success/30 bg-success/[0.04]' : 'border-line')}>
                  <input
                    type="checkbox"
                    checked={done.has(it.title)}
                    onChange={() =>
                      setDone((d) => {
                        const n = new Set(d);
                        if (n.has(it.title)) n.delete(it.title);
                        else n.add(it.title);
                        return n;
                      })
                    }
                    className="mt-1 size-4"
                    aria-label={`סימון: ${it.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('badge', LEVEL_CLS[it.level])}>{LEVEL_LABEL[it.level]}</span>
                      <span className="badge badge-neutral" dir="ltr">
                        {it.type}
                      </span>
                    </div>
                    <div className={cn('mt-1 text-sm font-medium', done.has(it.title) ? 'text-muted line-through' : 'text-fg')}>{it.title}</div>
                    <div className="text-xs text-subtle">למה: {it.reasons.join(' · ')}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
