import { useState } from 'react';
import { Bot, CheckCircle2, Info, XCircle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Callout } from '../../components/ui/Callout';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { Segmented } from '../../components/ui/Field';
import { cn } from '../../utils/cn';
import { TOPICS, type Framework } from './examples';

export default function AutomationPage() {
  const [fw, setFw] = useState<Framework>('playwright');
  const [topicId, setTopicId] = useState(TOPICS[0].id);
  const topic = TOPICS.find((t) => t.id === topicId)!;
  const ex = topic.code[fw];

  return (
    <div>
      <PageHeader
        icon={Bot}
        eyebrow="Automation Assistant"
        title="עוזר אוטומציה"
        description="דוגמאות מעשיות ל-Selenium + Python + Pytest ול-Playwright + TypeScript: לוקייטורים, המתנות, אסרציות, Fixtures, Page Object Model ובדיקות API."
        actions={
          <Segmented
            ariaLabel="פריימוורק"
            value={fw}
            onChange={setFw}
            options={[
              { value: 'playwright', label: 'Playwright · TS' },
              { value: 'selenium', label: 'Selenium · Pytest' },
            ]}
          />
        }
      />
      <Callout tone="info" icon={Info} title="דוגמאות להמחשה" className="mb-5">
        הקוד מתייחס לאתר בדוי (shop.example.com) ונועד ללמד דפוסים – לא להרצה כמו שהוא. פרטי גישה נלקחים ממשתני סביבה, לעולם לא מהקוד.
      </Callout>

      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav className="card h-fit p-2" aria-label="נושאים">
          {TOPICS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTopicId(t.id)} aria-current={t.id === topicId} className={cn('block w-full rounded-lg px-3 py-2.5 text-start text-sm transition', t.id === topicId ? 'bg-accent/10 font-medium text-fg' : 'text-muted hover:bg-surface-2')}>
              {t.title}
            </button>
          ))}
        </nav>

        <section className="min-w-0 space-y-4">
          <div className="card p-5">
            <h2 className="text-xl font-bold text-fg">{topic.title}</h2>
            <p className="mt-1 text-sm leading-7 text-muted">{topic.summary}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-success/25 bg-success/[0.05] p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-success">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  מומלץ
                </div>
                <ul className="space-y-1 text-sm text-fg">
                  {topic.do.map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-danger/25 bg-danger/[0.05] p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-danger">
                  <XCircle className="size-3.5" aria-hidden />
                  להימנע
                </div>
                <ul className="space-y-1 text-sm text-fg">
                  {topic.dont.map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <CodeBlock code={ex.code} lang={ex.lang} title={`${ex.file} · illustrative`} lineNumbers maxHeight={560} />
          <ul className="card space-y-1.5 p-4">
            {ex.notes.map((n) => (
              <li key={n} className="flex gap-2 text-sm leading-6 text-muted">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {n}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
