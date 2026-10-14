import { useId, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

/** CSS-only tooltip that also works with keyboard focus. */
export function Tooltip({ content, children, className }: { content: ReactNode; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      <span aria-describedby={id} className="inline-flex">
        {children}
      </span>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full start-1/2 z-40 mb-2 w-max max-w-64 translate-x-1/2 rounded-lg border border-line-strong bg-surface-3 px-2.5 py-1.5 text-xs leading-5 text-fg opacity-0 shadow-xl transition group-hover/tt:opacity-100 group-focus-within/tt:opacity-100 rtl:translate-x-1/2 ltr:-translate-x-1/2"
      >
        {content}
      </span>
    </span>
  );
}

export function Progress({ value, max = 100, className, tone = 'accent', label }: { value: number; max?: number; className?: string; tone?: 'accent' | 'success' | 'warning' | 'danger'; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bar = { accent: 'from-accent to-violet', success: 'from-success to-emerald-300', warning: 'from-warning to-amber-300', danger: 'from-danger to-rose-300' }[tone];
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-surface-3', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn('h-full rounded-full bg-gradient-to-l transition-all duration-500', bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }: { icon: LucideIcon; title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center', className)}>
      <div className="relative mb-3 grid size-12 place-items-center rounded-2xl bg-surface-2 ring-1 ring-line">
        <Icon className="size-6 text-subtle" aria-hidden />
      </div>
      <div className="font-semibold text-fg">{title}</div>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionCard({ title, icon: Icon, actions, children, className, bodyClassName, description }: { title: ReactNode; icon?: LucideIcon; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string; description?: ReactNode }) {
  return (
    <section className={cn('card', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="size-4 shrink-0 text-accent" aria-hidden />}
          <div className="min-w-0">
            <h2 className="section-title">{title}</h2>
            {description && <p className="text-xs text-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Small "fictional data" marker shown next to every synthetic example. */
export function FictionalTag({ className }: { className?: string }) {
  return (
    <span className={cn('badge badge-violet', className)} title="כל הנתונים בדוגמה זו בדויים">
      נתונים בדויים · Demo Shop
    </span>
  );
}
