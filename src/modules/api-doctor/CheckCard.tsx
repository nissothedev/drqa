import { useState } from 'react';
import { ChevronDown, CircleHelp, Compass, Footprints, Search, ShieldAlert, Target } from 'lucide-react';
import type { RecommendedCheck } from '../../types/diagnostics';
import { CopyButton } from '../../components/ui/CopyButton';
import { cn } from '../../utils/cn';

export function checkToText(c: RecommendedCheck): string {
  return [
    `בדיקה: ${c.title}`,
    `מה לבדוק: ${c.what}`,
    'איך:',
    ...c.how.map((h, i) => `  ${i + 1}. ${h}`),
    `למה זה חשוב: ${c.why}`,
    `מה התוצאה עשויה להראות: ${c.indicates}`,
    `מה התוצאה לא מוכיחה: ${c.doesNotProve}`,
    `מה הלאה: ${c.next}`,
  ].join('\n');
}

export function CheckCard({ check, index, defaultOpen = false }: { check: RecommendedCheck; index: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const rows = [
    { icon: Search, label: 'מה לבדוק', text: check.what, cls: 'text-accent' },
    { icon: CircleHelp, label: 'למה זה חשוב', text: check.why, cls: 'text-info' },
    { icon: Target, label: 'מה התוצאה עשויה להראות', text: check.indicates, cls: 'text-success' },
    { icon: ShieldAlert, label: 'מה התוצאה לא מוכיחה', text: check.doesNotProve, cls: 'text-warning' },
    { icon: Compass, label: 'מה הלאה', text: check.next, cls: 'text-violet' },
  ];
  return (
    <article className={cn('overflow-hidden rounded-xl border transition', open ? 'border-line-strong bg-surface-2/50' : 'border-line bg-surface-2/30 hover:border-line-strong')}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 p-3.5 text-start">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent/10 text-xs font-bold text-accent">{index + 1}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-fg">{check.title}</span>
          {!open && <span className="line-clamp-1 block text-xs text-muted">{check.what}</span>}
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-subtle transition', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="space-y-4 border-t border-line p-4 animate-fade-in">
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((r) => (
              <div key={r.label} className={cn('rounded-lg border border-line bg-surface p-3', r.label === 'מה התוצאה לא מוכיחה' && 'border-warning/25 bg-warning/[0.04]')}>
                <div className={cn('mb-1 flex items-center gap-1.5 text-xs font-semibold', r.cls)}>
                  <r.icon className="size-3.5" aria-hidden />
                  {r.label}
                </div>
                <p className="text-sm leading-6 text-fg">{r.text}</p>
              </div>
            ))}
            <div className="rounded-lg border border-line bg-surface p-3 md:row-span-1">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-fg">
                <Footprints className="size-3.5 text-accent" aria-hidden />
                איך לבדוק
              </div>
              <ol className="list-decimal space-y-1 ps-5 text-sm leading-6 text-fg marker:text-subtle">
                {check.how.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="flex justify-end">
            <CopyButton text={() => checkToText(check)} label="העתקת הבדיקה" variant="secondary" />
          </div>
        </div>
      )}
    </article>
  );
}
