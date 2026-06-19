import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, ErrorBanner } from '../components/ui';
import Markdown from '../components/Markdown';
import {
  TRACK_PROSE, accent, pct, trackItems, countDone, goalStatus, fmtDate,
} from '../lib/learning';

// ── Small progress ring ───────────────────────────────────────────────────────
function Ring({ value, size = 56, stroke = 6, color = '#10B981' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x="50%" y="50%" dy="0.35em" textAnchor="middle" fontSize={size * 0.26} fontWeight="700" fill="#0B1220" className="tabular-nums">
        {value}%
      </text>
    </svg>
  );
}

function Bar({ value, className = 'bg-emerald-500' }) {
  return (
    <div className="h-2 rounded-full bg-base-800 overflow-hidden">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${value}%`, transition: 'width 0.6s ease' }} />
    </div>
  );
}

const GOAL_PILL = {
  done: 'bg-emerald-50 text-emerald-700',
  'on-track': 'bg-emerald-50 text-emerald-700',
  behind: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-700',
};

export default function Learning() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [memberId, setMemberId] = useState(null);
  const [trackId, setTrackId] = useState(null);
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [showProse, setShowProse] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/learning');
      setData(res);
      setError(null);
      setMemberId((prev) => prev || res.me);
      setTrackId((prev) => prev || res.tracks[0]?.id);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Per-member completed-item Sets.
  const completedSets = useMemo(() => {
    const out = {};
    if (data) for (const [uid, ids] of Object.entries(data.progressByMember)) out[uid] = new Set(ids);
    return out;
  }, [data]);

  const allItemIds = useMemo(
    () => (data ? data.tracks.flatMap((t) => trackItems(t)).map((i) => i.id) : []),
    [data]
  );

  if (loading) return <div className="p-8"><Spinner label="Loading learning tracks…" /></div>;
  if (!data) return <div className="p-6"><ErrorBanner error={error} onRetry={load} /></div>;

  const isMe = memberId === data.me;
  const track = data.tracks.find((t) => t.id === trackId) || data.tracks[0];
  const a = accent(track?.accentColor);

  // Overall % per member across all items.
  const overall = (uid) => {
    const set = completedSets[uid] || new Set();
    const done = allItemIds.reduce((n, id) => n + (set.has(id) ? 1 : 0), 0);
    return pct(done, allItemIds.length);
  };

  // Track % for a member.
  const trackPct = (t, uid) => {
    const items = trackItems(t);
    return pct(countDone(items, completedSets[uid] || new Set()), items.length);
  };

  // Next-up: most-progressed (but <100%) track for the selected member, first unchecked item.
  const nextUp = (() => {
    const set = completedSets[memberId] || new Set();
    let best = null;
    for (const t of data.tracks) {
      const p = trackPct(t, memberId);
      if (p >= 100) continue;
      if (!best || p > best.p) best = { t, p };
    }
    if (!best) return null;
    for (const m of best.t.modules) {
      for (const it of m.items) if (!set.has(it.id)) return { track: best.t, module: m, item: it };
    }
    return null;
  })();

  async function toggle(item) {
    if (!isMe) return; // read-only for other members
    const next = !(completedSets[data.me]?.has(item.id));
    // optimistic
    setData((prev) => {
      const ids = new Set(prev.progressByMember[prev.me] || []);
      next ? ids.add(item.id) : ids.delete(item.id);
      return { ...prev, progressByMember: { ...prev.progressByMember, [prev.me]: [...ids] } };
    });
    try { await api.put(`/learning/items/${item.id}/progress`, { completed: next }); }
    catch (err) { setError(err); load(); }
  }

  const members = data.members;
  const selectedSet = completedSets[memberId] || new Set();
  const tPct = trackPct(track, memberId);
  const tItems = trackItems(track);
  const tDone = countDone(tItems, selectedSet);

  const myGoal = data.goals.find((g) => g.userId === memberId && g.trackId === track.id);
  const gStatus = goalStatus(myGoal, tPct);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <p className="eyebrow mb-1">FOUNDERS // SKILL TRACKS</p>
        <h1 className="text-xl font-bold text-gray-900">Learning</h1>
        <p className="text-sm text-gray-500 mt-0.5">Four roadmaps to take CloudGuard from idea to credentialed, revenue-generating firm.</p>
      </div>

      <ErrorBanner error={error} onRetry={load} />

      {/* Team overview */}
      <div className="panel p-4 mb-5">
        <p className="eyebrow mb-3">TEAM PROGRESS</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {members.map((m) => {
            const ov = overall(m.id);
            const active = m.id === memberId;
            return (
              <button key={m.id} onClick={() => setMemberId(m.id)}
                className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all
                  ${active ? 'border-accent bg-accent-light/40 shadow-btn' : 'border-base-700 hover:border-base-600/60 bg-white'}`}>
                <Ring value={ov} size={52} color={active ? a.ring : '#64748B'} />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                  <p className="text-xs text-gray-500">{ov}% overall{m.id === data.me && ' · you'}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Next-up hint */}
        {nextUp && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span className="eyebrow">NEXT UP</span>
            <span className="text-gray-700">
              <span className={accent(nextUp.track.accentColor).text + ' font-medium'}>{nextUp.track.title}</span>
              {' · '}{nextUp.item.title}
            </span>
          </div>
        )}
      </div>

      {/* Read-only banner for other members */}
      {!isMe && (
        <div className="mb-4 text-xs text-gray-500 bg-base-850 border border-base-700 rounded-md px-3 py-2">
          Viewing <span className="font-semibold text-gray-700">{members.find((m) => m.id === memberId)?.name}</span>’s progress (read-only). Switch to yourself to edit.
        </div>
      )}

      {/* Track tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {data.tracks.map((t) => {
          const ta = accent(t.accentColor);
          const tp = trackPct(t, memberId);
          const on = t.id === track.id;
          return (
            <button key={t.id} onClick={() => { setTrackId(t.id); setShowProse(false); }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all
                ${on ? `${ta.border} ${ta.soft} text-gray-900` : 'border-base-700 bg-white text-gray-600 hover:border-base-600/60'}`}>
              <span className={`h-2 w-2 rounded-full ${ta.dot}`} />
              {t.title}
              <span className="tabular-nums text-xs text-gray-400">{tp}%</span>
            </button>
          );
        })}
      </div>

      {/* Selected track */}
      <div className="panel overflow-hidden">
        {/* Track header */}
        <div className={`px-5 py-4 border-b border-base-800 ${a.soft}`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{track.title}</h2>
                <span className="badge badge-gray text-[10px]">{track.estDuration}</span>
                {tPct === 100 && <span className="badge badge-green text-[10px]">✓ COMPLETE</span>}
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{track.subtitle}</p>
            </div>
            <Ring value={tPct} size={56} color={a.ring} />
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{tDone}/{tItems.length} milestones</span>
              <span className={a.text + ' font-semibold'}>{tPct}%</span>
            </div>
            <Bar value={tPct} className={a.bar} />
          </div>

          {/* Goal setter + status */}
          <GoalRow track={track} goal={myGoal} status={gStatus} editable={isMe} accentObj={a}
            onSaved={(g) => setData((p) => ({ ...p, goals: upsertGoal(p.goals, g) }))} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-base-800 bg-white">
          <button onClick={() => setShowProse((s) => !s)} className="text-xs font-medium text-brand-blue hover:underline">
            {showProse ? 'Hide' : 'Show'} full roadmap
          </button>
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
            <input type="checkbox" checked={incompleteOnly} onChange={(e) => setIncompleteOnly(e.target.checked)} className="accent-current" />
            Incomplete only
          </label>
        </div>

        {/* Prose */}
        {showProse && (
          <div className="px-5 py-4 border-b border-base-800 bg-base-900/30">
            <Markdown source={TRACK_PROSE[track.slug] || ''} />
          </div>
        )}

        {/* Modules + items */}
        <div>
          {track.modules.map((mod) => {
            const mItems = mod.items;
            const mDone = countDone(mItems, selectedSet);
            const mPct = pct(mDone, mItems.length);
            const visible = incompleteOnly ? mItems.filter((it) => !selectedSet.has(it.id)) : mItems;
            if (incompleteOnly && visible.length === 0) return null;
            return (
              <div key={mod.id} className="border-b border-base-800 last:border-0">
                <div className="flex items-center gap-3 px-5 pt-3.5 pb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{mod.title}</p>
                    {mod.summary && <p className="text-xs text-gray-400 mt-0.5">{mod.summary}</p>}
                  </div>
                  <span className="text-xs text-gray-400 tabular-nums shrink-0">{mDone}/{mItems.length}</span>
                  <div className="w-20 shrink-0"><Bar value={mPct} className={a.bar} /></div>
                </div>
                <ul className="pb-2">
                  {visible.map((it) => {
                    const done = selectedSet.has(it.id);
                    return (
                      <li key={it.id}>
                        <button onClick={() => toggle(it)} disabled={!isMe}
                          className={`w-full flex items-start gap-3 px-5 py-2 text-left transition-colors
                            ${isMe ? 'hover:bg-base-850/60 cursor-pointer' : 'cursor-default'}`}>
                          <span className={`mt-0.5 h-4.5 w-4.5 shrink-0 rounded-md border flex items-center justify-center transition-all
                            ${done ? `${a.bar} border-transparent` : 'border-base-600 bg-white'}`} style={{ height: 18, width: 18 }}>
                            {done && (
                              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <span className={`text-sm ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{it.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Celebration */}
        {tPct === 100 && (
          <div className={`px-5 py-4 text-center ${a.soft} border-t border-base-800`}>
            <p className="text-sm font-semibold text-gray-900">🎉 {track.title} complete</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {members.find((m) => m.id === memberId)?.name} cleared every milestone in this track.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function upsertGoal(goals, g) {
  const rest = goals.filter((x) => !(x.userId === g.userId && x.trackId === g.trackId));
  return [...rest, g];
}

// ── Goal setter row ───────────────────────────────────────────────────────────
function GoalRow({ track, goal, status, editable, accentObj, onSaved }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(goal?.targetDate ? goal.targetDate.slice(0, 10) : '');
  const [note, setNote] = useState(goal?.note || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDate(goal?.targetDate ? goal.targetDate.slice(0, 10) : '');
    setNote(goal?.note || '');
  }, [goal, track.id]);

  async function save() {
    setSaving(true);
    try {
      const { goal: saved } = await api.put(`/learning/goals/${track.id}`, {
        targetDate: date ? new Date(date).toISOString() : null,
        note,
      });
      onSaved({ userId: saved.userId, trackId: saved.trackId, targetDate: saved.targetDate, note: saved.note });
      setEditing(false);
    } finally { setSaving(false); }
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {goal?.targetDate ? (
          <>
            <span className="eyebrow">TARGET</span>
            <span className="font-medium text-gray-700">{fmtDate(goal.targetDate)}</span>
            {status && (
              <span className={`badge ${GOAL_PILL[status.state]} text-[10px]`}>
                {status.state === 'done' ? 'Goal met'
                  : status.state === 'overdue' ? `${Math.abs(status.daysRemaining)}d overdue`
                  : `${status.daysRemaining}d left · ${status.state === 'on-track' ? 'on track' : 'behind'}`}
              </span>
            )}
            {goal.note && <span className="text-gray-400 italic">“{goal.note}”</span>}
          </>
        ) : (
          <span className="text-gray-400">No target date set</span>
        )}
      </div>
      {editable && !editing && (
        <button onClick={() => setEditing(true)} className="text-xs font-medium text-brand-blue hover:underline">
          {goal?.targetDate ? 'Edit goal' : 'Set goal'}
        </button>
      )}
      {editable && editing && (
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input !w-auto !py-1 text-xs" />
          <input type="text" placeholder="note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="input !w-40 !py-1 text-xs" />
          <button onClick={save} disabled={saving} className="btn-primary !py-1 !px-2.5 text-xs">{saving ? '…' : 'Save'}</button>
          <button onClick={() => setEditing(false)} className="btn-ghost !py-1 !px-2.5 text-xs">Cancel</button>
        </div>
      )}
    </div>
  );
}
