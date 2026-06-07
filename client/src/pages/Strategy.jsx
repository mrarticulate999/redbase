import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBanner, Modal, PageHeader, EmptyState } from '../components/ui';

const TIMEFRAME_LABELS = { short: 'Short-term', mid: 'Mid-term', long: 'Long-term' };
const TIMEFRAME_COLORS = {
  short: { bg: 'bg-accent-light', text: 'text-accent-dim', dot: 'bg-accent' },
  mid: { bg: 'bg-brand-blue-light', text: 'text-brand-blue-dim', dot: 'bg-brand-blue' },
  long: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

function progressColor(pct) {
  if (pct >= 70) return 'bg-accent';
  if (pct >= 30) return 'bg-amber-400';
  return 'bg-red-400';
}
function progressTextColor(pct) {
  if (pct >= 70) return 'text-accent-dim';
  if (pct >= 30) return 'text-amber-600';
  return 'text-red-600';
}

// ── OKR Section ─────────────────────────────────────────────────────────────
function OKRSection() {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [showObjModal, setShowObjModal] = useState(false);
  const [showKRModal, setShowKRModal] = useState(null); // objectiveId
  const [editingKR, setEditingKR] = useState(null);
  const [objForm, setObjForm] = useState({ title: '', timeframe: 'quarterly' });
  const [krForm, setKrForm] = useState({ title: '', target: 100, unit: '%', current: 0 });

  const load = useCallback(() => {
    api.get('/objectives').then(setObjectives).catch(setError).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  function toggleExpand(id) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function saveObj() {
    await api.post('/objectives', objForm);
    setShowObjModal(false); setObjForm({ title: '', timeframe: 'quarterly' }); load();
  }
  async function deleteObj(id) {
    if (!confirm('Delete this objective and all its key results?')) return;
    await api.del(`/objectives/${id}`); load();
  }
  async function saveKR() {
    if (editingKR) {
      await api.patch(`/objectives/results/${editingKR.id}`, krForm);
    } else {
      await api.post(`/objectives/${showKRModal}/results`, krForm);
    }
    setShowKRModal(null); setEditingKR(null); setKrForm({ title: '', target: 100, unit: '%', current: 0 }); load();
  }
  async function deleteKR(id) {
    await api.del(`/objectives/results/${id}`); load();
  }
  async function updateKRProgress(kr) {
    const current = parseFloat(prompt(`Update progress for "${kr.title}" (current: ${kr.current}/${kr.target} ${kr.unit}):`));
    if (isNaN(current)) return;
    await api.patch(`/objectives/results/${kr.id}`, { current }); load();
  }

  if (loading) return <Spinner label="Loading objectives…" />;
  if (error) return <ErrorBanner error={error} />;

  const quarterly = objectives.filter(o => o.timeframe === 'quarterly');
  const annual = objectives.filter(o => o.timeframe === 'annual');

  function ObjGroup({ title, items }) {
    if (items.length === 0) return null;
    return (
      <div>
        <p className="section-header mb-3">{title}</p>
        <div className="space-y-3 mb-6">
          {items.map(obj => {
            const krs = obj.keyResults || [];
            const avgProgress = krs.length ? Math.round(krs.reduce((s, kr) => s + (kr.target ? (kr.current / kr.target) * 100 : 0), 0) / krs.length) : 0;
            const isOpen = expanded.has(obj.id);
            return (
              <div key={obj.id} className="card overflow-hidden">
                <button onClick={() => toggleExpand(obj.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-base-900 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-gray-900 text-sm">{obj.title}</p>
                      <span className={`badge text-[11px] ${obj.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{obj.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-base-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${progressColor(avgProgress)}`} style={{ width: `${avgProgress}%` }} />
                      </div>
                      <span className={`text-xs font-semibold tabular-nums ${progressTextColor(avgProgress)}`}>{avgProgress}%</span>
                      <span className="text-xs text-gray-400">{krs.length} KR{krs.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={e => { e.stopPropagation(); deleteObj(obj.id); }}
                      className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                    <svg className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-base-700 px-4 pb-4 pt-3 bg-base-900">
                    <div className="space-y-2.5 mb-3">
                      {krs.map(kr => {
                        const pct = kr.target ? Math.round((kr.current / kr.target) * 100) : 0;
                        return (
                          <div key={kr.id} className="flex items-center gap-3 group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700 truncate">{kr.title}</span>
                                <span className="text-xs text-gray-500 tabular-nums ml-2 shrink-0">{kr.current}/{kr.target} {kr.unit}</span>
                              </div>
                              <div className="h-1.5 bg-base-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${progressColor(pct)}`} style={{ width: `${Math.min(100, pct)}%` }} />
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => updateKRProgress(kr)} className="text-xs text-brand-blue hover:underline">Update</button>
                              <button onClick={() => deleteKR(kr.id)} className="text-xs text-red-400 hover:text-red-600">×</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => { setShowKRModal(obj.id); setEditingKR(null); setKrForm({ title: '', target: 100, unit: '%', current: 0 }); }}
                      className="text-xs text-accent hover:text-accent-dim font-medium">+ Add key result</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {objectives.length} objective{objectives.length !== 1 ? 's' : ''} tracked
        </p>
        <button onClick={() => setShowObjModal(true)} className="btn-primary">+ New Objective</button>
      </div>

      {objectives.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No objectives yet"
            hint="Define quarterly and annual objectives with measurable key results, so the whole team knows what success looks like."
            icon={<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>}
            action={<button onClick={() => setShowObjModal(true)} className="btn-primary">+ Create your first objective</button>}
          />
        </div>
      ) : (
        <>
          <ObjGroup title="Quarterly" items={quarterly} />
          <ObjGroup title="Annual" items={annual} />
        </>
      )}

      <Modal open={showObjModal} onClose={() => setShowObjModal(false)} title="New Objective">
        <div className="space-y-4">
          <div>
            <label className="label">Objective</label>
            <input className="input" placeholder="What do you want to achieve?" value={objForm.title} onChange={e => setObjForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Timeframe</label>
            <select className="input" value={objForm.timeframe} onChange={e => setObjForm(f => ({ ...f, timeframe: e.target.value }))}>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowObjModal(false)} className="btn-ghost">Cancel</button>
            <button onClick={saveObj} className="btn-primary">Create Objective</button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(showKRModal)} onClose={() => { setShowKRModal(null); setEditingKR(null); }} title="Add Key Result">
        <div className="space-y-4">
          <div>
            <label className="label">Key Result</label>
            <input className="input" placeholder="Measurable outcome" value={krForm.title} onChange={e => setKrForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Target</label>
              <input type="number" className="input" value={krForm.target} onChange={e => setKrForm(f => ({ ...f, target: e.target.value }))} />
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" placeholder="%" value={krForm.unit} onChange={e => setKrForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowKRModal(null)} className="btn-ghost">Cancel</button>
            <button onClick={saveKR} className="btn-primary">Add Key Result</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Director Brief ───────────────────────────────────────────────────────────
function DirectorBrief() {
  const [brief, setBrief] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    setLoading(true); setError(null);
    try {
      const { brief, generatedAt } = await api.post('/strategy/brief', {});
      setBrief(brief); setGeneratedAt(generatedAt);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Director Intelligence Brief</h2>
          <p className="text-sm text-gray-400">AI-synthesized business analysis across all modules</p>
        </div>
        <button onClick={generate} disabled={loading} className="btn-primary shrink-0">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Generating…
            </span>
          ) : '⚡ Generate Brief'}
        </button>
      </div>

      {!process.env.VITE_HAS_ANTHROPIC && !brief && !loading && !error && (
        <div className="rounded-lg bg-base-850 border border-base-700 px-4 py-3 text-sm text-gray-500">
          <strong className="text-gray-700">Note:</strong> Requires <code className="text-xs bg-base-800 px-1 py-0.5 rounded">ANTHROPIC_API_KEY</code> in your Render environment variables. Rate-limited to once per hour.
        </div>
      )}

      {error && <ErrorBanner error={error} />}

      {brief && (
        <div className="space-y-4">
          {generatedAt && <p className="text-xs text-gray-400">Generated {new Date(generatedAt).toLocaleString()}</p>}

          <div className="rounded-xl bg-gradient-to-r from-accent/5 to-brand-blue/5 border border-accent/20 p-4">
            <p className="text-sm font-semibold text-gray-900">{brief.headline}</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <BriefSection title="Wins" items={brief.wins} color="text-accent-dim" dot="bg-accent" />
            <BriefSection title="Risks" items={brief.risks} color="text-red-600" dot="bg-red-500" />
            <BriefSection title="This Week's Priorities" items={brief.priorities} color="text-brand-blue-dim" dot="bg-brand-blue" />
          </div>

          {brief.insight && (
            <div className="rounded-lg border-l-2 border-brand-blue pl-4 py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Strategic Insight</p>
              <p className="text-sm text-gray-700">{brief.insight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BriefSection({ title, items = [], color, dot }) {
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${color}`}>{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Milestones Timeline (read-only view) ────────────────────────────────────
function MilestonesPreview() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/milestones').then(data => {
      setMilestones(data.filter(m => new Date(m.date) >= new Date()).slice(0, 9));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const byTimeframe = { short: [], mid: [], long: [] };
  milestones.forEach(m => (byTimeframe[m.timeframe] ||= []).push(m));

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Upcoming Milestones</h2>
          <p className="text-sm text-gray-400">Next planned milestones across all horizons</p>
        </div>
        <a href="/calendar" className="text-xs text-accent hover:underline font-medium">Manage →</a>
      </div>
      <div className="space-y-5">
        {Object.entries(byTimeframe).map(([tf, items]) => {
          if (!items.length) return null;
          const col = TIMEFRAME_COLORS[tf];
          return (
            <div key={tf}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className={`text-xs font-semibold uppercase tracking-wide ${col.text}`}>{TIMEFRAME_LABELS[tf]}</span>
              </div>
              <div className="space-y-1.5 pl-4">
                {items.sort((a,b) => new Date(a.date) - new Date(b.date)).map(m => (
                  <div key={m.id} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 text-xs tabular-nums shrink-0">
                      {new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-gray-700 truncate">{m.title}</span>
                    <span className="text-xs text-gray-400 ml-auto shrink-0">{m.category}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {milestones.length === 0 && (
          <p className="text-sm text-gray-400">No upcoming milestones. <a href="/calendar" className="text-accent hover:underline">Add some in the Calendar →</a></p>
        )}
      </div>
    </div>
  );
}

// ── Main Strategy page ───────────────────────────────────────────────────────
const TABS = [
  { id: 'okr', label: 'Objectives & Key Results' },
  { id: 'brief', label: 'Director Brief' },
  { id: 'timeline', label: 'Milestones' },
];

export default function Strategy() {
  const [tab, setTab] = useState('okr');

  return (
    <div className="p-4 lg:p-6">
      <PageHeader title="Strategy" subtitle="OKRs, AI business intelligence, and long-horizon planning" />

      <div className="flex gap-1 bg-base-800 border border-base-700 p-1 rounded-lg mb-6 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150
              ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'okr' && <OKRSection />}
      {tab === 'brief' && <DirectorBrief />}
      {tab === 'timeline' && <MilestonesPreview />}
    </div>
  );
}
