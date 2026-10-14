import { useId, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export function Field({ label, hint, error, children, className, htmlFor, required }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode; className?: string; htmlFor?: string; required?: boolean }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
        {required && <span className="ms-1 text-danger" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-2xs leading-4 text-subtle">{hint}</p>}
      {error && <p className="mt-1 text-2xs leading-4 text-danger">{error}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, className }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition', checked ? 'border-accent/60 bg-accent/80' : 'border-line-strong bg-surface-3')}
      >
        <span className={cn('absolute size-3.5 rounded-full bg-white shadow transition-all', checked ? 'start-[18px]' : 'start-[3px]')} />
        <span className="sr-only">{label}</span>
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm">
        <span className="font-medium text-fg">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </label>
    </div>
  );
}

export interface SegOption<T extends string> {
  value: T;
  label: ReactNode;
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel, className, size = 'md' }: { options: SegOption<T>[]; value: T; onChange: (v: T) => void; ariaLabel: string; className?: string; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex flex-wrap rounded-xl border border-line bg-surface-2/70 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg font-medium transition',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
            value === o.value ? 'bg-surface text-fg shadow-sm ring-1 ring-line-strong' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Big selectable card used as a radio option in wizards. */
export function OptionCard({ selected, onClick, title, description, icon, className, badge }: { selected: boolean; onClick: () => void; title: ReactNode; description?: ReactNode; icon?: ReactNode; className?: string; badge?: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-start gap-3 rounded-xl border p-3.5 text-start transition',
        selected ? 'border-accent/60 bg-accent/[0.07] shadow-[0_0_0_3px_rgb(var(--glow)/0.10)]' : 'border-line bg-surface-2/50 hover:border-line-strong hover:bg-surface-2',
        className,
      )}
    >
      <span className={cn('mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full border-2 transition', selected ? 'border-accent' : 'border-line-strong')} aria-hidden>
        <span className={cn('size-2 rounded-full transition', selected ? 'bg-accent' : 'bg-transparent')} />
      </span>
      {icon && <span className="shrink-0 text-accent">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
          {title}
          {badge}
        </span>
        {description && <span className="mt-0.5 block text-xs leading-5 text-muted">{description}</span>}
      </span>
    </button>
  );
}

export function CheckRow({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode }) {
  const id = useId();
  return (
    <div className={cn('flex items-start gap-3 rounded-lg border p-2.5 transition', checked ? 'border-success/30 bg-success/[0.05]' : 'border-line bg-surface-2/40 hover:border-line-strong')}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 shrink-0 cursor-pointer" />
      <label htmlFor={id} className="cursor-pointer text-sm">
        <span className={cn('text-fg', checked && 'text-muted line-through decoration-success/50')}>{label}</span>
        {description && <span className="block text-xs text-subtle">{description}</span>}
      </label>
    </div>
  );
}
