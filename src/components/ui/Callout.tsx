import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn';

type Tone = 'info' | 'warning' | 'danger' | 'success' | 'privacy';

const META: Record<Tone, { icon: typeof Info; cls: string; iconCls: string }> = {
  info: { icon: Info, cls: 'border-info/25 bg-info/[0.06]', iconCls: 'text-info' },
  warning: { icon: AlertTriangle, cls: 'border-warning/25 bg-warning/[0.06]', iconCls: 'text-warning' },
  danger: { icon: OctagonAlert, cls: 'border-danger/25 bg-danger/[0.06]', iconCls: 'text-danger' },
  success: { icon: CheckCircle2, cls: 'border-success/25 bg-success/[0.06]', iconCls: 'text-success' },
  privacy: { icon: ShieldCheck, cls: 'border-violet/25 bg-violet/[0.06]', iconCls: 'text-violet' },
};

export function Callout({ tone = 'info', title, children, className, icon }: { tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string; icon?: typeof Info }) {
  const m = META[tone];
  const Icon = icon ?? m.icon;
  return (
    <div role={tone === 'danger' ? 'alert' : 'note'} className={cn('flex gap-3 rounded-xl border p-3.5 text-sm', m.cls, className)}>
      <Icon className={cn('mt-0.5 size-4.5 shrink-0', m.iconCls)} aria-hidden />
      <div className="min-w-0 space-y-1">
        {title && <div className="font-semibold text-fg">{title}</div>}
        {children && <div className="leading-6 text-muted">{children}</div>}
      </div>
    </div>
  );
}
