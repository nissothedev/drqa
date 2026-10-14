import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StepDef {
  id: string;
  label: string;
  hint?: string;
}

interface Props {
  steps: StepDef[];
  current: number;
  /** Highest step index the user may jump to. */
  maxReachable?: number;
  onSelect?: (index: number) => void;
  className?: string;
}

/** Horizontal wizard stepper; collapses to a compact progress bar on small screens. */
export function Stepper({ steps, current, maxReachable = current, onSelect, className }: Props) {
  const pct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100;
  return (
    <nav aria-label="שלבי האשף" className={className}>
      <div className="mb-3 flex items-center justify-between text-xs text-muted md:hidden">
        <span>
          שלב {current + 1} מתוך {steps.length}
        </span>
        <span className="font-semibold text-fg">{steps[current]?.label}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3 md:hidden">
        <div className="h-full rounded-full bg-gradient-to-l from-accent to-violet transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ol className="hidden items-center md:flex">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const reachable = i <= maxReachable && !!onSelect;
          return (
            <li key={s.id} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect?.(i)}
                aria-current={active ? 'step' : undefined}
                className={cn('group flex items-center gap-2.5 rounded-lg p-1 text-start transition', reachable && !active && 'hover:bg-surface-2', !reachable && 'cursor-default')}
              >
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold transition',
                    done && 'border-accent/50 bg-accent/15 text-accent',
                    active && 'border-transparent bg-gradient-to-br from-accent to-accent-2 text-on-accent shadow-[0_0_0_4px_rgb(var(--glow)/0.15)]',
                    !done && !active && 'border-line-strong bg-surface-2 text-subtle',
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span className={cn('hidden text-xs font-medium lg:block', active ? 'text-fg' : 'text-muted')}>{s.label}</span>
              </button>
              {i < steps.length - 1 && <span className={cn('mx-2 h-px flex-1 transition', done ? 'bg-accent/50' : 'bg-line-strong')} aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
