import { useId } from 'react';
import { cn } from '../../utils/cn';

export function LogoMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  const gid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${gid}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="0.55" stopColor="var(--accent-2)" />
          <stop offset="1" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="var(--surface-2)" stroke={`url(#${gid}-g)`} strokeWidth="1.5" />
      <path
        d="M8 26h7l3.5-8 6 16 4.5-12 3 4h8"
        fill="none"
        stroke={`url(#${gid}-g)`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={animated ? '400' : undefined}
        className={animated ? 'animate-pulse-line' : undefined}
      />
      <circle cx="40" cy="26" r="2.2" fill="var(--accent)" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="size-9 shrink-0 drop-shadow-[0_0_12px_rgb(var(--glow)/0.35)]" />
      {!compact && (
        <div className="leading-none" dir="ltr">
          <div className="text-lg font-extrabold tracking-[0.08em] text-fg">
            DR<span className="text-gradient">QA</span>
          </div>
          <div className="mt-1 text-[9.5px] font-medium tracking-[0.12em] text-subtle">DIAGNOSE · RESOLVE · QA</div>
        </div>
      )}
    </div>
  );
}
