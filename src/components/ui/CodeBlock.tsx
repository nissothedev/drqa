import { useMemo, type ReactNode } from 'react';
import { tokenize, type Lang } from '../../utils/highlight';
import { cn } from '../../utils/cn';
import { CopyButton } from './CopyButton';

interface Props {
  code: string;
  lang?: Lang;
  title?: ReactNode;
  actions?: ReactNode;
  className?: string;
  maxHeight?: number | string;
  lineNumbers?: boolean;
  copy?: boolean;
  /** Line numbers (1-based) to highlight, e.g. error locations. */
  highlightLines?: number[];
  wrap?: boolean;
}

const LANG_LABEL: Record<Lang, string> = {
  json: 'JSON',
  http: 'HTTP',
  curl: 'cURL',
  sql: 'SQL',
  python: 'Python',
  ts: 'TypeScript',
  text: 'Text',
  env: 'Config',
};

/** Dark, LTR, syntax-highlighted code panel used across all modules. */
export function CodeBlock({ code, lang = 'text', title, actions, className, maxHeight = 420, lineNumbers = false, copy = true, highlightLines, wrap = false }: Props) {
  const lines = useMemo(() => {
    const tokens = tokenize(code, lang);
    const result: Array<Array<{ text: string; cls?: string }>> = [[]];
    for (const t of tokens) {
      const parts = t.text.split('\n');
      parts.forEach((p, i) => {
        if (i > 0) result.push([]);
        if (p) result[result.length - 1].push({ text: p, cls: t.cls });
      });
    }
    return result;
  }, [code, lang]);

  const hl = new Set(highlightLines ?? []);

  return (
    <div className={cn('overflow-hidden rounded-xl border border-white/[0.07] bg-code shadow-inner', className)} dir="ltr">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex gap-1" aria-hidden>
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-amber-300/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
          </span>
          <span className="truncate font-mono text-[11px] text-slate-400">{title ?? LANG_LABEL[lang]}</span>
        </div>
        <div className="flex items-center gap-1" dir="rtl">
          {actions}
          {copy && <CopyButton text={code} variant="code" />}
        </div>
      </div>
      <pre
        className={cn('overflow-auto p-3.5 text-left font-mono text-[12.5px] leading-6 text-slate-200', wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre')}
        style={{ maxHeight }}
        tabIndex={0}
        aria-label={typeof title === 'string' ? title : `${LANG_LABEL[lang]} code`}
      >
        <code>
          {lines.map((line, i) => (
            <div key={i} className={cn('min-h-6', hl.has(i + 1) && '-mx-3.5 border-l-2 border-red-400 bg-red-500/10 px-3')}>
              {lineNumbers && <span className="me-4 inline-block w-7 select-none text-right text-slate-600">{i + 1}</span>}
              {line.map((t, j) => (
                <span key={j} className={t.cls}>
                  {t.text}
                </span>
              ))}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
