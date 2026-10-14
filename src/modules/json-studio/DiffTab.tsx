import { useMemo, useState } from 'react';
import { ArrowLeftRight, Columns2, FileCode2, ListTree, Minus, Plus, RefreshCw, Shuffle } from 'lucide-react';
import { CopyButton } from '../../components/ui/CopyButton';
import { Segmented, Toggle } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/misc';
import { diffJson, formatJson, parseJson, sortKeys, summarizeDiff, type DiffEntry, type DiffKind, type JsonValue } from '../../utils/json';
import { lineDiff } from '../../utils/lineDiff';
import { cn } from '../../utils/cn';
import { SAMPLE_ACTUAL, SAMPLE_EXPECTED } from './samples';

const KIND_META: Record<DiffKind, { label: string; cls: string; icon: typeof Plus }> = {
  added: { label: 'נוסף', cls: 'badge-success', icon: Plus },
  removed: { label: 'הוסר', cls: 'badge-danger', icon: Minus },
  changed: { label: 'שונה', cls: 'badge-warning', icon: RefreshCw },
  'type-changed': { label: 'טיפוס השתנה', cls: 'badge-violet', icon: Shuffle },
};

function show(v: JsonValue | undefined): string {
  if (v === undefined) return '';
  const s = JSON.stringify(v);
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

function diffToText(entries: DiffEntry[]): string {
  return entries.map((e) => `${e.kind.toUpperCase().padEnd(13)} ${e.path}  ${show(e.before)}${e.before !== undefined && e.after !== undefined ? ' → ' : ''}${show(e.after)}`).join('\n');
}

export function DiffTab() {
  const [left, setLeft] = useState(SAMPLE_EXPECTED);
  const [right, setRight] = useState(SAMPLE_ACTUAL);
  const [ignoreOrder, setIgnoreOrder] = useState(false);
  const [view, setView] = useState<'paths' | 'side'>('paths');
  const [filter, setFilter] = useState<DiffKind | 'all'>('all');

  const a = useMemo(() => parseJson(left), [left]);
  const b = useMemo(() => parseJson(right), [right]);
  const entries = useMemo(() => (a.ok && b.ok ? diffJson(a.value, b.value, { ignoreArrayOrder: ignoreOrder }) : []), [a, b, ignoreOrder]);
  const summary = summarizeDiff(entries);
  const rows = useMemo(() => (a.ok && b.ok && view === 'side' ? lineDiff(formatJson(sortKeys(a.value)), formatJson(sortKeys(b.value))) : null), [a, b, view]);
  const filtered = filter === 'all' ? entries : entries.filter((e) => e.kind === filter);

  const editor = (id: string, label: string, value: string, set: (v: string) => void, parsed: typeof a, tone: string) => (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-2 text-xs font-semibold text-fg">
          <span className={cn('size-2 rounded-full', tone)} aria-hidden />
          {label}
        </label>
        {parsed.ok ? <span className="badge badge-success">תקין</span> : parsed.empty ? <span className="badge badge-neutral">ריק</span> : <span className="badge badge-danger">לא תקין{parsed.error.line ? ` · שורה ${parsed.error.line}` : ''}</span>}
      </div>
      <textarea id={id} value={value} onChange={(e) => set(e.target.value)} rows={13} spellCheck={false} className="textarea-code" />
      {!parsed.ok && !parsed.empty && <p className="mt-1 text-xs text-danger">{parsed.error.message}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <section className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">שני מסמכי JSON להשוואה</h2>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setLeft(SAMPLE_EXPECTED);
                setRight(SAMPLE_ACTUAL);
              }}
            >
              <FileCode2 className="size-3.5" aria-hidden />
              דוגמת Demo Shop
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setLeft(right);
                setRight(left);
              }}
            >
              <ArrowLeftRight className="size-3.5" aria-hidden />
              החלפת צדדים
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setLeft('');
                setRight('');
              }}
            >
              ניקוי
            </button>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {editor('diff-a', 'A · צפוי (לפי חוזה / סביבה תקינה)', left, setLeft, a, 'bg-danger')}
          {editor('diff-b', 'B · בפועל (התגובה שהתקבלה)', right, setRight, b, 'bg-success')}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <Toggle checked={ignoreOrder} onChange={setIgnoreOrder} label="התעלמות מסדר במערכים פשוטים" description="שימושי כשהסדר אינו חלק מהחוזה" />
          <Segmented
            ariaLabel="תצוגת השוואה"
            value={view}
            onChange={setView}
            options={[
              { value: 'paths', label: <span className="inline-flex items-center gap-1.5"><ListTree className="size-3.5" aria-hidden />לפי נתיבים</span> },
              { value: 'side', label: <span className="inline-flex items-center gap-1.5"><Columns2 className="size-3.5" aria-hidden />זה לצד זה</span> },
            ]}
          />
        </div>
      </section>

      {!a.ok || !b.ok ? (
        <EmptyState icon={ArrowLeftRight} title="נדרשים שני מסמכי JSON תקינים" description="תקנו את שגיאות התחביר המסומנות כדי לראות את ההשוואה." />
      ) : (
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
            {entries.length === 0 ? (
              <span className="badge badge-success">המסמכים זהים מבנית</span>
            ) : (
              <>
                <button type="button" onClick={() => setFilter('all')} className={cn('chip', filter === 'all' && 'chip-active')}>
                  הכל · {entries.length}
                </button>
                {(Object.keys(KIND_META) as DiffKind[]).map((k) => (
                  <button key={k} type="button" onClick={() => setFilter(k)} className={cn('chip', filter === k && 'chip-active')} disabled={summary[k] === 0}>
                    {KIND_META[k].label} · {summary[k]}
                  </button>
                ))}
                <CopyButton text={diffToText(entries)} label="העתקת ההבדלים" className="ms-auto" />
              </>
            )}
          </div>

          {view === 'paths' ? (
            filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs text-subtle">
                      <th className="px-4 py-2 text-start font-medium">סוג</th>
                      <th className="px-4 py-2 text-start font-medium">נתיב</th>
                      <th className="px-4 py-2 text-start font-medium">A · צפוי</th>
                      <th className="px-4 py-2 text-start font-medium">B · בפועל</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => {
                      const M = KIND_META[e.kind];
                      return (
                        <tr key={`${e.kind}-${e.path}-${show(e.before)}-${show(e.after)}`} className="border-b border-line/60 last:border-0 hover:bg-surface-2/40">
                          <td className="px-4 py-2.5">
                            <span className={cn('badge', M.cls)}>
                              <M.icon className="size-3" aria-hidden />
                              {M.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-accent" dir="ltr">
                            {e.path}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs" dir="ltr">
                            {e.before !== undefined && <span className="rounded bg-danger/10 px-1.5 py-0.5 text-danger">{show(e.before)}</span>}
                            {e.kind === 'type-changed' && <span className="ms-1 text-2xs text-subtle">({e.beforeType})</span>}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs" dir="ltr">
                            {e.after !== undefined && <span className="rounded bg-success/10 px-1.5 py-0.5 text-success">{show(e.after)}</span>}
                            {e.kind === 'type-changed' && <span className="ms-1 text-2xs text-subtle">({e.afterType})</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : rows === null ? (
            <p className="p-6 text-center text-sm text-muted">המסמכים גדולים מדי לתצוגה זה לצד זה. השתמשו בתצוגת הנתיבים.</p>
          ) : (
            <div className="overflow-x-auto bg-code" dir="ltr">
              <div className="grid min-w-[720px] grid-cols-2 font-mono text-[12px] leading-6">
                {rows.map((r, i) => (
                  <div key={i} className="contents">
                    <div className={cn('flex border-r border-white/5', (r.kind === 'removed' || r.kind === 'modified') && 'bg-red-500/12', r.kind === 'added' && 'bg-white/[0.02]')}>
                      <span className="w-10 shrink-0 select-none pe-2 text-right text-slate-600">{r.left?.no ?? ''}</span>
                      <span className={cn('w-4 shrink-0 select-none', r.kind === 'removed' || r.kind === 'modified' ? 'text-red-400' : 'text-transparent')}>-</span>
                      <span className="whitespace-pre text-slate-200">{r.left?.text ?? ''}</span>
                    </div>
                    <div className={cn('flex', (r.kind === 'added' || r.kind === 'modified') && 'bg-emerald-500/12', r.kind === 'removed' && 'bg-white/[0.02]')}>
                      <span className="w-10 shrink-0 select-none pe-2 text-right text-slate-600">{r.right?.no ?? ''}</span>
                      <span className={cn('w-4 shrink-0 select-none', r.kind === 'added' || r.kind === 'modified' ? 'text-emerald-400' : 'text-transparent')}>+</span>
                      <span className="whitespace-pre text-slate-200">{r.right?.text ?? ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="border-t border-line px-4 py-2.5 text-2xs text-subtle">
            בתצוגה זה לצד זה המפתחות ממוינים כדי שסדר שדות לא ייחשב כהבדל. השוואה מבנית מראה <strong>מה</strong> שונה – לא <strong>מי</strong> צודק: בדקו מול החוזה.
          </p>
        </section>
      )}
    </div>
  );
}
