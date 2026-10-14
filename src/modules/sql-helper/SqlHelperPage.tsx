import { useState } from 'react';
import { Database, HelpCircle, ShieldAlert, ShieldCheck, Table2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Callout } from '../../components/ui/Callout';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { Tabs } from '../../components/ui/Tabs';
import { FictionalTag } from '../../components/ui/misc';
import { cn } from '../../utils/cn';
import { SQL_EXAMPLES, TABLES, type Row } from './data';

function ResultTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-muted">0 שורות – וגם זו תוצאה: אין רשומות שעונות לתנאי.</p>;
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-xl border border-line" dir="ltr">
      <table className="w-full text-left font-mono text-xs">
        <thead className="bg-surface-2">
          <tr>
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 font-semibold text-accent">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {cols.map((c) => (
                <td key={c} className={cn('px-3 py-1.5', r[c] === null ? 'italic text-pink-400' : 'text-fg')}>
                  {r[c] === null ? 'NULL' : String(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SqlHelperPage() {
  const [id, setId] = useState(SQL_EXAMPLES[0].id);
  const [tab, setTab] = useState<'example' | 'schema'>('example');
  const ex = SQL_EXAMPLES.find((e) => e.id === id)!;
  const groups = [...new Set(SQL_EXAMPLES.map((e) => e.group))];

  return (
    <div>
      <PageHeader
        icon={Database}
        eyebrow="SQL Helper"
        title="עוזר SQL"
        description="דוגמאות SQL לקריאה בלבד לאימות נתונים בטבלאות Demo Shop: סינון, JOIN, קיבוץ, NULL, כפילויות והתאמה בין טבלאות. התוצאות מחושבות מהנתונים הבדויים המוצגים – אין חיבור למסד נתונים."
      />
      <Callout tone="danger" icon={ShieldAlert} title="כללי בטיחות לשאילתות QA" className="mb-5">
        רק SELECT, רק בסביבת בדיקה, רק עם הרשאת קריאה. הגבילו תוצאות (LIMIT / TOP), הימנעו משאילתות כבדות בשעות עומס, ואל תעתיקו נתונים אישיים אמיתיים לדיווחים.
      </Callout>

      <Tabs
        className="mb-5 w-fit"
        ariaLabel="תצוגה"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'example', label: 'דוגמאות', icon: Database },
          { id: 'schema', label: 'סכמת הטבלאות', icon: Table2 },
        ]}
      />

      {tab === 'schema' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.values(TABLES).map((t) => (
            <section key={t.name} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="font-mono font-semibold text-fg" dir="ltr">
                  {t.name}
                </h2>
                <span className="text-xs text-muted">
                  {t.description} · {t.rows.length} שורות
                </span>
              </div>
              <div className="p-4">
                <div className="mb-3 flex flex-wrap gap-1.5" dir="ltr">
                  {t.columns.map((c) => (
                    <span key={c.name} className="badge badge-neutral font-mono">
                      {c.name} <span className="text-accent">{c.type}</span>
                      {c.note && <span className="text-subtle">· {c.note}</span>}
                    </span>
                  ))}
                </div>
                <ResultTable rows={t.rows} />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav className="card h-fit p-2" aria-label="דוגמאות SQL">
            {groups.map((g) => (
              <div key={g} className="mb-2">
                <div className="px-2 py-1 text-2xs font-semibold text-subtle">{g}</div>
                {SQL_EXAMPLES.filter((e) => e.group === g).map((e) => (
                  <button key={e.id} type="button" onClick={() => setId(e.id)} aria-current={e.id === id} className={cn('block w-full rounded-lg px-3 py-2 text-start text-sm transition', e.id === id ? 'bg-accent/10 font-medium text-fg' : 'text-muted hover:bg-surface-2')}>
                    {e.title}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <section className="min-w-0 space-y-4">
            <div className="card p-5">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-accent">
                <HelpCircle className="size-3.5" aria-hidden />
                שאלת QA
              </div>
              <h2 className="text-lg font-bold text-fg">{ex.question}</h2>
              <div className="mt-4">
                <CodeBlock code={ex.sql} lang="sql" title={`${ex.id}.sql · read-only`} />
              </div>
              <ul className="mt-4 space-y-1.5">
                {ex.explanation.map((x) => (
                  <li key={x} className="flex gap-2 text-sm leading-6 text-muted">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="section-title">תוצאה על הנתונים הבדויים</h3>
                <FictionalTag />
              </div>
              <ResultTable rows={ex.run()} />
              <p className="mt-2 text-2xs text-subtle">
                טבלאות: <span dir="ltr">{ex.tables.join(', ')}</span> · ראו "סכמת הטבלאות" לנתוני המקור.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-success/25 bg-success/[0.05] p-4">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-success">
                  <ShieldCheck className="size-3.5" aria-hidden />
                  מה זה מראה
                </div>
                <p className="text-sm text-fg">{ex.proves}</p>
              </div>
              <div className="rounded-xl border border-warning/25 bg-warning/[0.05] p-4">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-warning">
                  <ShieldAlert className="size-3.5" aria-hidden />
                  מה זה לא מוכיח
                </div>
                <p className="text-sm text-fg">{ex.doesNotProve}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
