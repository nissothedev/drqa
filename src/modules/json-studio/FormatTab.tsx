import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownAZ, CheckCircle2, Eraser, FileCode2, Minimize2, Sparkles } from 'lucide-react';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { CopyButton } from '../../components/ui/CopyButton';
import { Segmented } from '../../components/ui/Field';
import { formatJson, jsonStats, minifyJson, parseJson, sortKeys, MAX_JSON_CHARS } from '../../utils/json';
import { SAMPLE_BROKEN, SAMPLE_PRODUCT } from './samples';

type Mode = 'pretty' | 'minify' | 'sorted';

export function FormatTab() {
  const [input, setInput] = useState(SAMPLE_PRODUCT);
  const [mode, setMode] = useState<Mode>('pretty');
  const [indent, setIndent] = useState<'2' | '4'>('2');
  const parsed = useMemo(() => parseJson(input), [input]);

  const output = useMemo(() => {
    if (!parsed.ok) return '';
    if (mode === 'minify') return minifyJson(parsed.value);
    return formatJson(mode === 'sorted' ? sortKeys(parsed.value) : parsed.value, Number(indent));
  }, [parsed, mode, indent]);

  const stats = parsed.ok ? jsonStats(parsed.value) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="card flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="section-title">קלט</h2>
          <div className="flex flex-wrap gap-1">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setInput(SAMPLE_PRODUCT)}>
              <FileCode2 className="size-3.5" aria-hidden />
              דוגמה תקינה
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setInput(SAMPLE_BROKEN)}>
              <AlertTriangle className="size-3.5" aria-hidden />
              דוגמה שבורה
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setInput('')}>
              <Eraser className="size-3.5" aria-hidden />
              ניקוי
            </button>
          </div>
        </div>
        <div className="flex-1 p-4">
          <label htmlFor="json-input" className="sr-only">
            JSON לבדיקה
          </label>
          <textarea id="json-input" value={input} onChange={(e) => setInput(e.target.value)} rows={18} spellCheck={false} className="textarea-code h-full min-h-[380px]" placeholder='{ "hello": "json" }' />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-2xs text-subtle">
            <span dir="ltr">
              {input.length.toLocaleString('en-US')} / {MAX_JSON_CHARS.toLocaleString('en-US')} chars
            </span>
            <span>לא נשמר ולא נשלח לשום מקום.</span>
          </div>
        </div>
      </section>

      <section className="card flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="section-title">תוצאה</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              size="sm"
              ariaLabel="מצב פלט"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'pretty', label: <span className="inline-flex items-center gap-1"><Sparkles className="size-3" aria-hidden />עיצוב</span> },
                { value: 'minify', label: <span className="inline-flex items-center gap-1"><Minimize2 className="size-3" aria-hidden />כיווץ</span> },
                { value: 'sorted', label: <span className="inline-flex items-center gap-1"><ArrowDownAZ className="size-3" aria-hidden />מיון מפתחות</span> },
              ]}
            />
            {mode !== 'minify' && (
              <Segmented
                size="sm"
                ariaLabel="הזחה"
                value={indent}
                onChange={setIndent}
                options={[
                  { value: '2', label: '2' },
                  { value: '4', label: '4' },
                ]}
              />
            )}
          </div>
        </div>
        <div className="flex-1 space-y-3 p-4">
          {parsed.ok ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge badge-success">
                  <CheckCircle2 className="size-3" aria-hidden />
                  JSON תקין
                </span>
                {stats && (
                  <>
                    <span className="badge badge-neutral">{stats.keys} מפתחות</span>
                    <span className="badge badge-neutral">עומק {stats.depth}</span>
                    <span className="badge badge-neutral">{stats.arrays} מערכים</span>
                    <span className="badge badge-neutral">{stats.nulls} null</span>
                  </>
                )}
              </div>
              <CodeBlock code={output} lang="json" maxHeight={420} lineNumbers={mode !== 'minify'} wrap={mode === 'minify'} title={mode === 'minify' ? 'minified.json' : 'formatted.json'} />
              <div className="flex gap-2">
                <CopyButton text={output} label="העתקת התוצאה" variant="secondary" size="md" />
                <button type="button" className="btn btn-ghost" onClick={() => setInput(output)}>
                  החלפת הקלט בתוצאה
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className={`rounded-xl border p-4 ${parsed.empty ? 'border-line bg-surface-2/40' : 'border-danger/30 bg-danger/[0.06]'}`} role={parsed.empty ? undefined : 'alert'}>
                <div className={`mb-1 flex items-center gap-2 font-semibold ${parsed.empty ? 'text-muted' : 'text-danger'}`}>
                  <AlertTriangle className="size-4" aria-hidden />
                  {parsed.empty ? 'אין קלט' : 'JSON לא תקין'}
                  {parsed.error.line && (
                    <span className="badge badge-danger" dir="ltr">
                      line {parsed.error.line}, col {parsed.error.column}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-6 text-fg">{parsed.error.message}</p>
              </div>
              {!parsed.empty && <CodeBlock code={input} lang="json" lineNumbers highlightLines={parsed.error.line ? [parsed.error.line] : []} title="input (error line highlighted)" maxHeight={380} copy={false} />}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
