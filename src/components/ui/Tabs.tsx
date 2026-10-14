import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TabDef<T extends string> {
  id: T;
  label: ReactNode;
  icon?: LucideIcon;
  count?: number;
}

interface Props<T extends string> {
  tabs: TabDef<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'pill' | 'underline';
  ariaLabel?: string;
}

/** Accessible tab list (roving focus with arrow keys, RTL aware). */
export function Tabs<T extends string>({ tabs, value, onChange, className, size = 'md', variant = 'pill', ariaLabel }: Props<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = tabs.findIndex((t) => t.id === value);
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    let next = idx;
    if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = (idx + 1) % tabs.length;
    else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[next].id);
    const btns = ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    btns?.[next]?.focus();
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKey}
      className={cn(
        'flex max-w-full items-center gap-1 overflow-x-auto',
        variant === 'pill' && 'rounded-xl border border-line bg-surface-2/70 p-1',
        variant === 'underline' && 'border-b border-line',
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.id === value;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            id={`${baseId}-${t.id}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn(
              'relative inline-flex shrink-0 items-center gap-1.5 font-medium transition',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
              variant === 'pill' && 'rounded-lg',
              variant === 'pill' && (active ? 'bg-surface text-fg shadow-sm ring-1 ring-line-strong' : 'text-muted hover:text-fg'),
              variant === 'underline' && '-mb-px border-b-2 pb-2.5',
              variant === 'underline' && (active ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'),
            )}
          >
            {Icon && <Icon className={cn('size-4', active && 'text-accent')} aria-hidden />}
            {t.label}
            {t.count !== undefined && (
              <span className={cn('rounded-full px-1.5 text-[10px] font-semibold', active ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-subtle')}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
