import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, BookOpenText, Link2, Search, X } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/misc';
import { GLOSSARY, GLOSSARY_CATEGORIES, termById, type GlossaryCategory } from '../../data/glossary';
import { CHECKS } from '../api-doctor/data';
import { CheckCard } from '../api-doctor/CheckCard';
import { cn } from '../../utils/cn';

function norm(s: string) {
  return s.toLowerCase().replace(/[֑-ׇ]/g, '');
}

export default function KnowledgePage() {
  const [params, setParams] = useSearchParams();
  const focusTerm = params.get('term');
  const checkId = params.get('check');
  const check = checkId ? CHECKS[checkId] : undefined;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<GlossaryCategory | 'all'>('all');
  const focusRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focusTerm) {
      setQ('');
      setCat('all');
      const t = window.setTimeout(() => focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
      return () => window.clearTimeout(t);
    }
  }, [focusTerm]);

  const list = useMemo(() => {
    const n = norm(q.trim());
    return GLOSSARY.filter((t) => (cat === 'all' || t.category === cat) && (!n || norm(`${t.term} ${t.he} ${t.definition} ${t.example ?? ''}`).includes(n))).sort((a, b) => a.term.localeCompare(b.term, 'en'));
  }, [q, cat]);

  return (
    <div>
      <PageHeader
        icon={BookOpenText}
        eyebrow="QA Knowledge Base"
        title="מאגר ידע QA"
        description={`מילון מונחים עברי-אנגלי (${GLOSSARY.length} מונחים) לעולמות HTTP, API, נתונים, כלים, תהליכי בדיקה וניהול איכות – כולל מלכודות נפוצות וקישורים בין מונחים.`}
      />

      {check && (
        <section className="mb-6 animate-fade-in">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="section-title">בדיקה מומלצת מתוך API Doctor</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setParams({})}>
              <X className="size-3.5" aria-hidden />
              סגירה
            </button>
          </div>
          <CheckCard check={check} index={0} defaultOpen />
        </section>
      )}

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input ps-9" placeholder="חיפוש מונח בעברית או באנגלית…" aria-label="חיפוש במילון" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setCat('all')} className={cn('chip', cat === 'all' && 'chip-active')}>
            הכל
          </button>
          {(Object.keys(GLOSSARY_CATEGORIES) as GlossaryCategory[]).map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={cn('chip', cat === c && 'chip-active')}>
              {GLOSSARY_CATEGORIES[c]}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Search} title="לא נמצאו מונחים" description="נסו מילה אחרת, או בחרו בקטגוריה 'הכל'." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((t) => {
            const focused = t.id === focusTerm;
            return (
              <article
                key={t.id}
                id={`term-${t.id}`}
                ref={focused ? focusRef : undefined}
                className={cn('card flex flex-col p-5 transition', focused && 'gradient-border shadow-[0_0_0_4px_rgb(var(--glow)/0.15)]')}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-fg" dir="ltr" style={{ textAlign: 'right' }}>
                      {t.term}
                    </h2>
                    <div className="text-sm text-accent">{t.he}</div>
                  </div>
                  <span className="badge badge-neutral shrink-0">{GLOSSARY_CATEGORIES[t.category]}</span>
                </div>
                <p className="text-sm leading-7 text-muted">{t.definition}</p>
                {t.example && (
                  <code className="mt-3 block rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-fg" dir="ltr">
                    {t.example}
                  </code>
                )}
                {t.pitfall && (
                  <p className="mt-3 flex gap-2 rounded-lg border border-warning/25 bg-warning/[0.05] p-2.5 text-xs leading-5 text-fg">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
                    {t.pitfall}
                  </p>
                )}
                {t.related && t.related.length > 0 && (
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
                    <Link2 className="size-3.5 text-subtle" aria-hidden />
                    {t.related.map((r) => {
                      const rt = termById(r);
                      return rt ? (
                        <Link key={r} to={`/knowledge?term=${r}`} className="chip py-0.5 text-2xs" dir="ltr">
                          {rt.term}
                        </Link>
                      ) : null;
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
