import type { ReactNode } from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function GlassCard({
  children,
  className = '',
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`glass ${hover ? 'glass-hover' : ''} ${className}`}>{children}</div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <span className="chip bg-brand-500/15 text-brand-300 border border-brand-500/20 mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-slate-400 text-lg">{subtitle}</p>}
    </div>
  );
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  const color = value >= 60 ? '#34d399' : value >= 40 ? '#fbbf24' : '#fb7185';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-white">{Math.round(value)}%</span>
        {label && <span className="text-xs text-slate-400 mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

export function StatBadge({
  value,
  label,
  tone = 'brand',
}: {
  value: ReactNode;
  label: string;
  tone?: 'brand' | 'emerald' | 'amber' | 'rose';
}) {
  const tones: Record<string, string> = {
    brand: 'text-brand-300 bg-brand-500/10 border-brand-500/20',
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
  };
  return (
    <div className={`chip ${tones[tone]} border`}>
      <span className="font-semibold">{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

export function LoadingScreen({ label = 'Loading\u2026' }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-brand-500/30 border-t-brand-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
        </div>
      </div>
      <p className="text-slate-400 text-sm animate-pulse">{label}</p>
    </div>
  );
}
