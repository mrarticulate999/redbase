import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBanner, PageHeader, Modal } from '../components/ui';

export default function Learning() {
  const [tracks, setTracks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { tracks, stats } = await api.get('/learning');
      setTracks(tracks);
      setStats(stats);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(item) {
    const next = !item.completedByMe;
    // Optimistic
    setTracks((prev) =>
      prev.map((t) => ({
        ...t,
        items: t.items.map((i) =>
          i.id === item.id
            ? { ...i, completedByMe: next, completedByCount: i.completedByCount + (next ? 1 : -1) }
            : i
        ),
      }))
    );
    try {
      await api.put(`/learning/${item.id}/progress`, { completed: next });
      load();
    } catch (err) {
      setError(err);
      load();
    }
  }

  if (loading) return <Spinner label="Loading pathway…" />;

  return (
    <div>
      <PageHeader title="Security Learning Pathway" subtitle="AI red teaming skill development tracker">
        <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Add resource</button>
      </PageHeader>

      <ErrorBanner error={error} onRetry={load} />

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ProgressCard label="Your completion" pct={stats?.individualPct ?? 0} />
        <ProgressCard label={`Team completion (${stats?.userCount ?? 0} members)`} pct={stats?.teamPct ?? 0} team />
      </div>

      <div className="space-y-6">
        {tracks.map((track) => {
          const done = track.items.filter((i) => i.completedByMe).length;
          const hours = track.items.reduce((s, i) => s + (i.estimatedHours || 0), 0);
          return (
            <section key={track.track} className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-base-700">
                <div>
                  <h2 className="font-semibold text-gray-100">{track.track}</h2>
                  <p className="text-xs text-gray-500">{hours}h total · {done}/{track.items.length} done by you</p>
                </div>
                <span className="badge bg-base-700 text-gray-300">
                  {Math.round((done / track.items.length) * 100)}%
                </span>
              </div>
              <ul className="divide-y divide-base-800">
                {track.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-base-800/40">
                    <button
                      onClick={() => toggle(item)}
                      className={`mt-0.5 h-5 w-5 shrink-0 rounded border grid place-items-center transition-colors
                        ${item.completedByMe ? 'bg-accent border-accent' : 'border-base-600 hover:border-accent'}`}
                      aria-label="Toggle complete"
                    >
                      {item.completedByMe && (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${item.completedByMe ? 'text-gray-400 line-through' : 'text-gray-100'}`}>
                          {item.title}
                        </span>
                        <span className="text-xs text-gray-600">~{item.estimatedHours}h</span>
                      </div>
                      {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                      {item.resourceUrl && (
                        <a href={item.resourceUrl} target="_blank" rel="noreferrer"
                          className="text-xs text-accent-glow hover:underline mt-1 inline-block break-all">
                          {item.resourceUrl}
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 shrink-0" title="Team members who completed this">
                      {item.completedByCount}/{stats?.userCount ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <AddResourceModal
        open={modalOpen}
        tracks={tracks.map((t) => t.track)}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
      />
    </div>
  );
}

function ProgressCard({ label, pct, team }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
        <span className={`text-lg font-bold ${team ? 'text-blue-300' : 'text-accent-glow'}`}>{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-base-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${team ? 'bg-blue-400' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AddResourceModal({ open, tracks, onClose, onSaved }) {
  const blank = { track: tracks[0] || '', title: '', description: '', resourceUrl: '', estimatedHours: '1' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { if (open) { setForm({ ...blank, track: tracks[0] || '' }); setErr(null); } /* eslint-disable-next-line */ }, [open]);
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await api.post('/learning', {
        track: form.track,
        title: form.title,
        description: form.description,
        resourceUrl: form.resourceUrl,
        estimatedHours: parseFloat(form.estimatedHours) || 1,
      });
      onSaved();
    } catch (e2) {
      setErr(e2);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add learning resource">
      <form onSubmit={save} className="space-y-4">
        {err && <ErrorBanner error={err} />}
        <div>
          <label className="label">Track</label>
          <input className="input" list="tracklist" value={form.track} onChange={(e) => set('track', e.target.value)} required />
          <datalist id="tracklist">
            {tracks.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[60px]" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="label">Resource URL</label>
            <input className="input" type="url" value={form.resourceUrl} onChange={(e) => set('resourceUrl', e.target.value)} />
          </div>
          <div>
            <label className="label">Est. hours</label>
            <input className="input" type="number" min="0" step="0.5" value={form.estimatedHours} onChange={(e) => set('estimatedHours', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add resource'}</button>
        </div>
      </form>
    </Modal>
  );
}
