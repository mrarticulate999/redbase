// Small shared CRM presentational bits — the "Operative Console" signature pieces.
import { scoreTier, GEO_LABELS } from '../../lib/crm';

const TIER_BG = {
  A: '#15924B', B: '#D97706', C: '#2563EB', D: '#94A3B8',
};

export function ScoreChip({ score, disqualified }) {
  if (disqualified) {
    return <span className="score-chip bg-red-50 text-red-700">DQ·{score}</span>;
  }
  const t = scoreTier(score);
  return (
    <span className="score-chip" style={{ background: `${TIER_BG[t.label]}1A`, color: TIER_BG[t.label] }}>
      <span className="tabular-nums">{score}</span>
      <span className="opacity-60">·{t.label}</span>
    </span>
  );
}

export function GeoBadge({ tier }) {
  const tones = {
    dmv_core: 'bg-accent-light text-accent-dim',
    dmv_state: 'bg-emerald-50 text-emerald-700',
    adjacent: 'bg-base-850 text-gray-600',
    us: 'bg-base-850 text-gray-400',
  };
  return <span className={`badge ${tones[tier] || 'badge-gray'}`}>{GEO_LABELS[tier] || tier}</span>;
}

const RULE = { A: '#15924B', B: '#D97706', C: '#2563EB', D: '#94A3B8' };

export function Kpi({ label, value, sub, accent = '#15924B', code }) {
  return (
    <div className="kpi">
      <span className="kpi-rule" style={{ background: accent }} />
      {code && <div className="eyebrow mb-1.5 text-gray-300">{code}</div>}
      <div className="kpi-num">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="mt-1 text-[11px] text-gray-400">{sub}</div>}
    </div>
  );
}

export function Eyebrow({ code, children }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="eyebrow-accent">{code}</span>
      <span className="h-px flex-1 bg-base-800" />
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <span className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}

export { RULE };
