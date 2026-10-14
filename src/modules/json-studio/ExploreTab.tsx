import { useMemo, useState } from 'react';
import { Copy, Crosshair, Search } from 'lucide-react';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { EmptyState } from '../../components/ui/misc';
import { flattenPaths, formatJson, getAtPath, parseJson, type JsonType } from '../../utils/json';
import { copyText } from '../../utils/clipboard';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/cn';
import { SAMPLE_ACTUAL } from './samples';

const TYPE_CLS: Record<JsonType, string> = {
  object: 'text-sky-400',
  array: 'text-violet-400',
  string: 'text-emerald-400',
  number: 'text-amber-400',
  boolean: 'text-fuchsia-400',
  null: 'text-pink-400',
};

export function ExploreTab() {
  const [input, setInput] = useState(SAMPLE_ACTUAL);
  const [filter, setFilter] = useState('');
  const [query, setQuery] = useState('$.items[1].sku');
  const { toast } = useApp();
  const parsed = useMemo(() => parseJson(input), [input]);
  const paths = useMemo(() => (parsed.ok ? flattenPaths(parsed.value) : []), [parsed]);
  const visible = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return f ? paths.filter((p) => p.path.toLowerCase().includes(f) || p.preview.toLowerCase().includes(f)) : paths;
  }, [paths, filter]);
  const result = parsed.ok ? getAtPath(parsed.value, query) : { found: false };

  const copyPath = async (p: string) => {
    const ok = await copyText(p);
    toast(ok ? `הנתיב ${p} הועתק` : 'ההעתקה נכשלה', ok ? 'success' : 'error');
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="card p-4">
        <label htmlFor="explore-input" className="section-title mb-2 block">
          JSON לסיור
        </label>
        <textarea id="explore-input" value={input} onChange={(e) => setInput(e.target.value)} rows={16} spellCheck={false} className="textarea-code" />
        {!parsed.ok && !parsed.empty && <p className="mt-2 text-xs text-danger">{parsed.error.message}</p>}
        <div className="mt-4 space-y-2">
          <label htmlFor="path-query" className="label flex items-center gap-1.5">
            <Crosshair className="size-3.5" aria-hidden />
            שליפת ערך לפי נתיב
          </label>
          <input id="path-query" value={query} onChange={(e) => setQuery(e.target.value)} className="input input-mono" placeholder="$.items[0].sku" spellCheck={false} />
          {parsed.ok &&
            (result.found ? (
              <CodeBlock code={formatJson(result.value!)} lang="json" title={query} maxHeight={200} />
            ) : (
              <p className="text-xs text-warning">הנתיב לא נמצא. תחביר נתמך: $.key, [index], ["key with spaces"].</p>
            ))}
        </div>
      </section>

      <section className="card flex min-w-0 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="section-title">
            עץ נתיבים <span className="text-subtle">({visible.length})</span>
          </h2>
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle" aria-hidden />
            <input value={filter} onChange={(e) => setFilter(e.target.value)} className="input ps-8 py-1.5 text-xs" placeholder="סינון נתיבים / ערכים" aria-label="סינון נתיבים" />
          </div>
        </div>
        {!parsed.ok ? (
          <div className="p-4">
            <EmptyState icon={Crosshair} title="אין JSON תקין להצגה" />
          </div>
        ) : (
          <ul className="max-h-[560px] flex-1 overflow-auto p-2 font-mono text-xs" dir="ltr">
            {visible.map((p) => (
              <li key={p.path}>
                <button
                  type="button"
                  onClick={() => {
                    setQuery(p.path);
                    copyPath(p.path);
                  }}
                  className="group flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-surface-2"
                  style={{ paddingLeft: `${8 + p.depth * 16}px` }}
                  title="לחיצה: העתקת הנתיב ושליפת הערך"
                >
                  <span className="text-fg">{p.key}</span>
                  <span className={cn('rounded px-1 text-[10px]', TYPE_CLS[p.type])}>{p.type}</span>
                  <span className="truncate text-subtle">{p.preview}</span>
                  <Copy className="ms-auto size-3 shrink-0 text-subtle opacity-0 group-hover:opacity-100" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
