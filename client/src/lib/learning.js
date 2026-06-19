// Learning section helpers: bundled roadmap prose, per-track accent palettes,
// and goal status math. Prose is imported raw and rendered by <Markdown>.
import aiEngineering from '../content/ai-engineering.md?raw';
import cloudSecurity from '../content/cloud-security.md?raw';
import aiRedTeaming from '../content/ai-red-teaming.md?raw';
import consultingBusiness from '../content/consulting-business.md?raw';

// Keyed by track slug — matches LearningTrack.slug from the seed.
export const TRACK_PROSE = {
  'ai-engineering': aiEngineering,
  'cloud-security': cloudSecurity,
  'ai-red-teaming': aiRedTeaming,
  'consulting-business': consultingBusiness,
};

// Full static class strings (Tailwind JIT can't see dynamic `bg-${x}` names).
export const ACCENTS = {
  emerald: { ring: '#10B981', bar: 'bg-emerald-500', text: 'text-emerald-600', soft: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', glow: 'shadow-[0_0_0_3px_rgba(16,185,129,0.15)]' },
  sky: { ring: '#0EA5E9', bar: 'bg-sky-500', text: 'text-sky-600', soft: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-500', glow: 'shadow-[0_0_0_3px_rgba(14,165,233,0.15)]' },
  rose: { ring: '#F43F5E', bar: 'bg-rose-500', text: 'text-rose-600', soft: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500', glow: 'shadow-[0_0_0_3px_rgba(244,63,94,0.15)]' },
  amber: { ring: '#F59E0B', bar: 'bg-amber-500', text: 'text-amber-600', soft: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', glow: 'shadow-[0_0_0_3px_rgba(245,158,11,0.15)]' },
};
export const accent = (name) => ACCENTS[name] || ACCENTS.emerald;

export const pct = (done, total) => (total > 0 ? Math.round((done / total) * 100) : 0);

// All items across a track's modules.
export const trackItems = (track) => (track.modules || []).flatMap((m) => m.items || []);

// Count a member's completed items in a given list.
export const countDone = (items, completedSet) => items.reduce((n, it) => n + (completedSet.has(it.id) ? 1 : 0), 0);

// Goal status pill: days remaining + on-track/behind vs. time elapsed.
// Returns null when no target date is set.
export function goalStatus(goal, completePct, createdAt) {
  if (!goal || !goal.targetDate) return null;
  const now = Date.now();
  const target = new Date(goal.targetDate).getTime();
  const start = createdAt ? new Date(createdAt).getTime() : now;
  const msDay = 86400000;
  const daysRemaining = Math.ceil((target - now) / msDay);

  // Expected progress = fraction of the start→target window elapsed.
  const span = Math.max(target - start, msDay);
  const elapsed = Math.min(Math.max(now - start, 0), span);
  const expectedPct = Math.round((elapsed / span) * 100);

  let state;
  if (completePct >= 100) state = 'done';
  else if (daysRemaining < 0) state = 'overdue';
  else if (completePct + 5 >= expectedPct) state = 'on-track';
  else state = 'behind';

  return { daysRemaining, expectedPct, state };
}

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
