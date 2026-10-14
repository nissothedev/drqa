import { useId } from 'react';

/**
 * Decorative "diagnostic scan" illustration for the dashboard hero:
 * a request trace travelling through components with a heartbeat monitor line.
 * Purely visual – it shows no data.
 */
export function HeroVisual({ className }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const nodes = [
    { x: 46, y: 70, label: 'UI' },
    { x: 140, y: 70, label: 'API' },
    { x: 234, y: 70, label: 'GW' },
    { x: 328, y: 70, label: 'SVC' },
    { x: 328, y: 168, label: 'DB' },
  ];
  return (
    <svg viewBox="0 0 380 240" className={className} role="img" aria-label="איור: מעקב אבחוני אחרי בקשת API דרך רכיבי המערכת" style={{ direction: 'ltr' }}>
      <defs>
        <linearGradient id={`${id}-line`} x1="0" x2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--violet)" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-scan`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0.18" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="0" y="0" width="380" height="240" rx="18" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        <rect width="380" height="240" fill="var(--surface)" opacity="0.55" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 32} y1="0" x2={i * 32} y2="240" stroke="var(--line)" strokeWidth="0.6" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 32} x2="380" y2={i * 32} stroke="var(--line)" strokeWidth="0.6" />
        ))}
        <rect x="0" y="0" width="380" height="60" fill={`url(#${id}-scan)`} className="animate-scan" />
      </g>

      {/* connections */}
      <path d="M46 70 H328 V168" fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="4 5" />
      <path d="M46 70 H328 V168" fill="none" stroke={`url(#${id}-line)`} strokeWidth="2.5" strokeDasharray="400" className="animate-pulse-line" />

      {nodes.map((n, i) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r="26" fill={`url(#${id}-glow)`} opacity={i === 3 ? 1 : 0.4} />
          <rect x={n.x - 20} y={n.y - 16} width="40" height="32" rx="9" fill="var(--surface-2)" stroke={i === 3 ? 'var(--warning)' : 'var(--line-strong)'} strokeWidth="1.4" />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={i === 3 ? 'var(--warning)' : 'var(--fg-muted)'} fontFamily="var(--font-mono)">
            {n.label}
          </text>
        </g>
      ))}
      <g>
        <circle cx="352" cy="50" r="5" fill="var(--warning)" className="animate-ping-slow" style={{ transformOrigin: '352px 50px' }} />
        <circle cx="352" cy="50" r="4" fill="var(--warning)" />
      </g>

      {/* heartbeat monitor */}
      <rect x="22" y="132" width="250" height="84" rx="12" fill="var(--code-bg)" stroke="var(--line)" />
      <text x="36" y="152" fontSize="9" fill="#64748b" fontFamily="var(--font-mono)">trace · req-7f3a (simulated)</text>
      <path
        d="M34 190 H90 L100 172 L112 206 L124 160 L136 196 L146 190 H178 L186 182 L194 190 H258"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="400"
        className="animate-pulse-line"
      />
      <text x="200" y="152" fontSize="9" fill="#fcd34d" fontFamily="var(--font-mono)">504 ?</text>
    </svg>
  );
}
