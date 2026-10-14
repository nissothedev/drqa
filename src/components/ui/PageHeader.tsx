import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ icon: Icon, eyebrow, title, description, actions, children }: Props) {
  return (
    <header className="relative mb-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="relative grid size-12 shrink-0 place-items-center rounded-2xl gradient-border">
            <Icon className="size-6 text-accent" aria-hidden />
            <span className="pointer-events-none absolute inset-0 rounded-2xl bg-accent/5" aria-hidden />
          </div>
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow mb-1" dir="ltr" style={{ textAlign: 'right' }}>{eyebrow}</div>}
            <h1 className="text-2xl font-bold tracking-tight text-fg md:text-[1.7rem]">{title}</h1>
            {description && <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
