import type { ReactNode } from 'react';
import { Eye, Lightbulb, HelpCircle, BadgeCheck } from 'lucide-react';
import { statusReason, statusTone, type StatusTone } from '../../data/http';
import { cn } from '../../utils/cn';

const toneClass: Record<StatusTone, string> = {
  success: 'border-success/35 bg-success/12 text-success',
  info: 'border-info/35 bg-info/12 text-info',
  warning: 'border-warning/35 bg-warning/12 text-warning',
  danger: 'border-danger/35 bg-danger/12 text-danger',
  neutral: 'border-line-strong bg-surface-2 text-muted',
};

export function StatusBadge({ code, showReason = true, size = 'md', className }: { code: number; showReason?: boolean; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const tone = statusTone(code);
  return (
    <span
      dir="ltr"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border font-mono font-semibold',
        size === 'sm' && 'px-1.5 py-0.5 text-[11px]',
        size === 'md' && 'px-2 py-0.5 text-xs',
        size === 'lg' && 'px-3 py-1 text-sm',
        toneClass[tone],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full bg-current', tone === 'danger' && 'animate-pulse')} aria-hidden />
      {code === 0 ? 'NO RESPONSE' : code}
      {showReason && code !== 0 && <span className="font-sans font-medium opacity-80">{statusReason(code)}</span>}
    </span>
  );
}

const methodClass: Record<string, string> = {
  GET: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  POST: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  PUT: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  PATCH: 'text-violet-400 border-violet-400/30 bg-violet-400/10',
  DELETE: 'text-rose-400 border-rose-400/30 bg-rose-400/10',
  HEAD: 'text-slate-400 border-slate-400/30 bg-slate-400/10',
  OPTIONS: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
};

export function MethodBadge({ method, className }: { method: string; className?: string }) {
  return (
    <span dir="ltr" className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-bold', methodClass[method] ?? methodClass.HEAD, className)}>
      {method}
    </span>
  );
}

export type EvidenceKind = 'observed' | 'hypothesis' | 'assumption' | 'confirmed';

export const EVIDENCE_META: Record<EvidenceKind, { label: string; en: string; icon: typeof Eye; cls: string; desc: string }> = {
  observed: {
    label: 'עובדות שנצפו',
    en: 'OBSERVED FACTS',
    icon: Eye,
    cls: 'text-accent border-accent/30 bg-accent/10',
    desc: 'מה שנראה ישירות: קוד סטטוס, גוף תגובה, כותרות, זמנים. עובדה אינה הסבר.',
  },
  hypothesis: {
    label: 'השערות',
    en: 'HYPOTHESES',
    icon: Lightbulb,
    cls: 'text-violet border-violet/30 bg-violet/10',
    desc: 'הסברים אפשריים שעדיין דורשים בדיקה. הדירוג משקף את הראיות שנאספו – לא ודאות.',
  },
  assumption: {
    label: 'הנחות לא מאומתות',
    en: 'UNVERIFIED ASSUMPTIONS',
    icon: HelpCircle,
    cls: 'text-warning border-warning/30 bg-warning/10',
    desc: 'דברים שהחקירה נשענת עליהם בלי שאומתו. כל אחת מהן עלולה להפיל את המסקנה.',
  },
  confirmed: {
    label: 'ממצאים מאומתים',
    en: 'CONFIRMED FINDINGS',
    icon: BadgeCheck,
    cls: 'text-success border-success/30 bg-success/10',
    desc: 'רק מה שאומת בראיה ישירה (לוג, השוואה, שחזור מבוקר). ריק כברירת מחדל – וזה בסדר.',
  },
};

export function EvidenceBadge({ kind, className }: { kind: EvidenceKind; className?: string }) {
  const m = EVIDENCE_META[kind];
  const Icon = m.icon;
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-2xs font-bold tracking-wider', m.cls, className)}>
      <Icon className="size-3" aria-hidden />
      <span dir="ltr">{m.en}</span>
    </span>
  );
}

export function Pill({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'violet' | 'success' | 'warning' | 'danger'; className?: string }) {
  return <span className={cn('badge', `badge-${tone}`, className)}>{children}</span>;
}
