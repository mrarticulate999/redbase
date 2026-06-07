import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBanner, Modal } from '../components/ui';

function RingProgress({ pct, size = 64, color = '#16A34A', label }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize={13} fontWeight="700" fill="#111827">
          {pct}%
        </text>
      </svg>
      {label && <span className="text-xs text-gray-500 text-center">{label}</span>}
    </div>
  );
}

export default function Learning() {
  const [tracks, setTracks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { tracks, stats } = await api.get('/learning');
      setTracks(tracks); setStats(stats); setError(null);
      if (tracks.length > 0) setExpanded(new Set([tracks[0].track]));
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleTrack(track) {
    setExpanded(prev => { const n = new Set(prev); n.has(track) ? n.delete(track) : n.add(track); return n; });
  }

  async function toggle(item) {
    const next = !item.completedByMe;
    setTracks(prev => prev.map(t => ({
      ...t, items: t.items.map(i => i.id === item.id
        ? { ...i, completedByMe: next, completedByCount: i.completedByCount + (next ? 1 : -1) }
        : i)
    })));
    try { await api.put(`/learning/${item.id}/progress`, { completed: next }); load(); }
    catch (err) { setError(err); load(); }
  }

  if (loading) return <div className="p-8"><Spinner label="Loading pathway…" /></div>;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Learning Pathway</h1>
          <p className="text-sm text-gray-400 mt-0.5">AI red teaming skill development tracker</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Add Resource</button>
      </div>

      <ErrorBanner error={error} onRetry={load} />

      {/* Progress overview */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-8">
          <RingProgress pct={stats?.individualPct ?? 0} color="#16A34A" label="You" />
          <RingProgress pct={stats?.teamPct ?? 0} color="#2563EB" label="Team avg" />
          <div className="flex-1 space-y-2">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Your Progress</span>
                <span className="font-semibold text-accent-dim">{stats?.individualPct ?? 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-base-800 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${stats?.individualPct ?? 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Team Average ({stats?.userCount ?? 0} members)</span>
                <span className="font-semibold text-brand-blue">{stats?.teamPct ?? 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-base-800 overflow-hidden">
                <div className="h-full rounded-full bg-brand-blue transition-all" style={{ width: `${stats?.teamPct ?? 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="space-y-3">
        {tracks.map(track => {
          const done = track.items.filter(i => i.completedByMe).length;
          const total = track.items.length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          const hours = track.items.reduce((s, i) => s + (i.estimatedHours || 0), 0);
          const isOpen = expanded.has(track.track);

          return (
            <div key={track.track} className="card overflow-hidden">
              <button onClick={() => toggleTrack(track.track)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-base-900 transition-colors">
                {/* Ring */}
                <div className="shrink-0">
                  <RingProgress pct={pct} size={48} color={pct === 100 ? '#16A34A' : '#2563EB'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{track.track}</p>
                  <p className="text-xs text-gray-400">{hours}h total · {done}/{total} completed by you</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pct === 100 && <span className="badge badge-green text-[11px]">Complete</span>}
                  <svg className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-base-700">
                  {track.items.map(item => (
                    <div key={item.id} className={`flex items-start gap-4 px-5 py-3.5 border-b border-base-700/50 last:border-0 hover:bg-base-900/40 transition-colors
                      ${item.completedByMe ? 'opacity-60' : ''}`}>
                      <button onClick={() => toggle(item)}
                        className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all
                          ${item.completedByMe ? 'bg-accent border-accent' : 'border-base-700 hover:border-accent'}`}>
                        {item.completedByMe && (
                          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className={`text-sm font-medium ${item.completedByMe ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {item.title}
                            </p>
                            {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-gray-400 tabular-nums">~{item.estimatedHours}h</span>
                            <span className="badge bg-base-850 text-gray-500 text-[10px]" title="Team members completed">
                              {item.completedByCount}/{stats?.userCount ?? 0} team
                            </span>
                          </div>
                        </div>
                        {item.resourceUrl && (
                          <a href={item.resourceUrl} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline mt-1">
                            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>
                            View resource
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddResourceModal open={modalOpen} tracks={tracks.map(t => t.track)}
        onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />
    </div>
  );
}

function AddResourceModal({ open, tracks, onClose, onSaved }) {
  const blank = { track: tracks[0] || '', title: '', description: '', resourceUrl: '', estimatedHours: '1' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { if (open) { setForm({ ...blank, track: tracks[0] || '' }); setErr(null); } }, [open]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save(e) {
    e.preventDefault(); setSaving(true); setErr(null);
    try {
      await api.post('/learning', {
        track: form.track, title: form.title, description: form.description,
        resourceUrl: form.resourceUrl, estimatedHours: parseFloat(form.estimatedHours) || 1,
      });
      onSaved();
    } catch (e2) { setErr(e2); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Learning Resource">
      <form onSubmit={save} className="space-y-4">
        {err && <ErrorBanner error={err} />}
        <div>
          <label className="label">Track</label>
          <input className="input" list="tracklist" value={form.track} onChange={e => set('track', e.target.value)} required />
          <datalist id="tracklist">{tracks.map(t => <option key={t} value={t} />)}</datalist>
        </div>
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={e => set('title', e.target.value)} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[60px]" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="label">Resource URL</label>
            <input className="input" type="url" value={form.resourceUrl} onChange={e => set('resourceUrl', e.target.value)} />
          </div>
          <div>
            <label className="label">Est. hours</label>
            <input className="input" type="number" min="0" step="0.5" value={form.estimatedHours} onChange={e => set('estimatedHours', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Resource'}</button>
        </div>
      </form>
    </Modal>
  );
}
