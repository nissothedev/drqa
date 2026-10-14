import { useMemo, useState } from 'react';
import { ArrowLeft, Globe, KeyRound, Search, Server, FileWarning, Unplug } from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badges';
import { Tabs } from '../../components/ui/Tabs';
import { ENTRY_POINTS, SCENARIO_BY_ID } from './data';
import type { ScenarioCategory } from '../../types/diagnostics';
import { cn } from '../../utils/cn';

const CAT_META: Record<ScenarioCategory, { label: string; icon: typeof Globe }> = {
  client: { label: 'בקשה / לקוח', icon: FileWarning },
  auth: { label: 'אימות, הרשאות וקצב', icon: KeyRound },
  server: { label: 'צד שרת ותשתית', icon: Server },
  network: { label: 'רשת ודפדפן', icon: Unplug },
  contract: { label: 'חוזים וסביבות', icon: Globe },
};

type TabId = 'status' | 'symptom';

export function ScenarioPicker({ onPick }: { onPick: (entryId: string) => void }) {
  const [tab, setTab] = useState<TabId>('status');
  const [q, setQ] = useState('');

  const entries = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ENTRY_POINTS.filter((e) => e.group === tab).filter((e) => !term || `${e.label} ${e.hint}`.toLowerCase().includes(term));
  }, [tab, q]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs
          ariaLabel="סוג נקודת כניסה"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'status', label: 'קוד סטטוס HTTP', count: ENTRY_POINTS.filter((e) => e.group === 'status').length },
            { id: 'symptom', label: 'סימפטום / תיאור תקלה', count: ENTRY_POINTS.filter((e) => e.group === 'symptom').length },
          ]}
        />
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input ps-9" placeholder="סינון…" aria-label="סינון תרחישים" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((e) => {
          const s = SCENARIO_BY_ID[e.scenarioId];
          const Cat = CAT_META[s.category];
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onPick(e.id)}
              className="card card-interactive group flex flex-col gap-3 p-4 text-start"
            >
              <div className="flex items-center justify-between gap-2">
                {s.code && e.group === 'status' ? (
                  <StatusBadge code={s.code} size="lg" />
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-fg">
                    <Cat.icon className="size-4 text-accent" aria-hidden />
                    {e.label}
                  </span>
                )}
                <span className={cn('badge', s.category === 'server' ? 'badge-danger' : s.category === 'auth' ? 'badge-violet' : s.category === 'network' ? 'badge-accent' : 'badge-warning')}>
                  {Cat.label}
                </span>
              </div>
              <p className="text-sm leading-6 text-muted">{e.group === 'status' ? s.tagline : e.hint}</p>
              {e.group === 'symptom' && (
                <span className="text-2xs text-subtle">
                  מסלול: <span dir="ltr">{s.title}</span>
                </span>
              )}
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-accent opacity-70 transition group-hover:opacity-100">
                התחלת אבחון
                <ArrowLeft className="size-3.5 transition group-hover:-translate-x-1" aria-hidden />
              </span>
            </button>
          );
        })}
      </div>
      {entries.length === 0 && <p className="py-8 text-center text-sm text-muted">אין תרחיש שתואם לסינון.</p>}
    </div>
  );
}
