import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/ui';
import { ScoreChip, Spinner } from '../../components/crm/bits';
import { crmApi, toCSV, downloadCSV } from '../../lib/crm';

const STATES = ['DC', 'MD', 'VA', 'PA', 'DE', 'NJ', 'NC', 'NY', 'CA', 'TX', 'FL'];
const PRACTICE = ['IP/patent', 'corporate/M&A', 'litigation', 'healthcare/life-sciences', 'immigration', 'personal injury', 'family'];

function matches(c, f) {
  if (f.states?.length && !f.states.includes(c.state)) return false;
  if (f.excludeDisqualified && c.disqualified) return false;
  if (f.minScore != null && c.priorityScore < f.minScore) return false;
  if (f.practiceAreas?.length) {
    const areas = (c.practiceAreas || []).map((a) => a.toLowerCase());
    if (!f.practiceAreas.some((p) => areas.some((a) => a.includes(p.toLowerCase())))) return false;
  }
  return true;
}

export default function Segments() {
  const [companies, setCompanies] = useState([]);
  const [segments, setSegments] = useState([]);
  const [weights, setWeights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalcMsg, setRecalcMsg] = useState('');
  const [filter, setFilter] = useState({ states: ['DC', 'MD', 'VA'], minScore: 60, excludeDisqualified: true, practiceAreas: [] });
  const [name, setName] = useState('');

  async function load() {
    const [c, s, cfg] = await Promise.all([crmApi.listCompanies(), crmApi.listSegments(), crmApi.getScoringConfig()]);
    setCompanies(c.companies); setSegments(s.segments); setWeights(cfg.config?.weights || null); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const preview = useMemo(() => companies.filter((c) => matches(c, filter)), [companies, filter]);

  const toggle = (key, val) => setFilter((f) => {
    const cur = f[key] || []; return { ...f, [key]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] };
  });
  async function save() { await crmApi.createSegment({ name: name || 'Untitled segment', filterJson: filter }); setName(''); load(); }
  async function remove(id) { await crmApi.deleteSegment(id); load(); }
  function exportSeg(rows, label) {
    downloadCSV(label, toCSV(rows.map((c) => ({ name: c.name, state: c.state, county: c.county, attorneys: c.attorneyCount, score: c.priorityScore, geoTier: c.geoTier, practiceAreas: c.practiceAreas, website: c.website }))));
  }
  async function recalc() {
    setRecalcMsg('Recalculating…');
    const r = await crmApi.recalcCompanies(); await load();
    setRecalcMsg(`Updated ${r.updated} of ${r.total}.`);
  }
  async function saveWeights() { await crmApi.updateScoringConfig(weights); setRecalcMsg('Weights saved — run Recalculate to apply.'); }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="eyebrow-accent mb-1">04 / SEGMENTS</div>
      <PageHeader title="Segments & Scoring" subtitle="Build an ICP filter, preview matches, export the target list, and tune the lead-score weights." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Filter builder</span></div>
          <div className="p-4 space-y-4">
            <div>
              <div className="eyebrow mb-1.5">States</div>
              <div className="flex flex-wrap gap-1.5">
                {STATES.map((s) => <button key={s} onClick={() => toggle('states', s)} className={`badge ${(filter.states || []).includes(s) ? 'badge-green' : 'badge-gray'}`}>{s}</button>)}
              </div>
            </div>
            <div>
              <div className="eyebrow mb-1.5">Practice areas</div>
              <div className="flex flex-wrap gap-1.5">
                {PRACTICE.map((p) => <button key={p} onClick={() => toggle('practiceAreas', p)} className={`badge ${(filter.practiceAreas || []).includes(p) ? 'badge-green' : 'badge-gray'}`}>{p}</button>)}
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600">min score
              <input type="range" min={0} max={100} step={5} value={filter.minScore} onChange={(e) => setFilter({ ...filter, minScore: +e.target.value })} className="accent-accent" />
              <span className="font-mono text-ink">{filter.minScore}</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={filter.excludeDisqualified} onChange={(e) => setFilter({ ...filter, excludeDisqualified: e.target.checked })} className="accent-accent" /> Exclude disqualified
            </label>
            <div className="border-t border-base-800 pt-3 flex gap-2">
              <input className="input" placeholder="Segment name" value={name} onChange={(e) => setName(e.target.value)} />
              <button className="btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>

        <div className="panel lg:col-span-2">
          <div className="panel-head"><span className="panel-title">Preview · {preview.length} firms</span>
            <button className="btn-ghost" onClick={() => exportSeg(preview, name || 'segment')}>Export CSV</button>
          </div>
          <div className="p-2 max-h-[440px] overflow-y-auto">
            <table className="dt">
              <thead><tr><th>Firm</th><th>Territory</th><th>Practice</th><th>Score</th></tr></thead>
              <tbody>
                {preview.map((c) => (
                  <tr key={c.id}><td className="font-medium text-ink">{c.name}</td>
                    <td className="text-gray-500">{c.county}, {c.state}</td>
                    <td className="text-gray-500"><span className="line-clamp-1">{(c.practiceAreas || []).join(', ')}</span></td>
                    <td><ScoreChip score={c.priorityScore} disqualified={c.disqualified} /></td></tr>
                ))}
              </tbody>
            </table>
            {preview.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No firms match.</p>}
          </div>
        </div>
      </div>

      {/* Saved segments */}
      <h2 className="eyebrow mt-6 mb-2">Saved segments</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {segments.map((s) => {
          const rows = companies.filter((c) => matches(c, s.filterJson));
          return (
            <div key={s.id} className="panel p-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-ink">{s.name}</span>
                <button onClick={() => remove(s.id)} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="badge badge-gray">{rows.length} firms</span>
                <button className="btn-ghost !py-1" onClick={() => exportSeg(rows, s.name)}>CSV</button>
              </div>
            </div>
          );
        })}
        {segments.length === 0 && <p className="text-sm text-gray-400">No saved segments yet.</p>}
      </div>

      {/* Lead-score weights */}
      {weights && (
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Lead-score weights</span>
            <div className="flex items-center gap-2">
              {recalcMsg && <span className="text-xs text-accent-dim">{recalcMsg}</span>}
              <button className="btn-ghost" onClick={recalc}>Recalculate all</button>
              <button className="btn-primary" onClick={saveWeights}>Save weights</button>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
            <WeightRow label="DMV core" value={weights.geography.dmv_core} onChange={(v) => setWeights({ ...weights, geography: { ...weights.geography, dmv_core: v } })} />
            <WeightRow label="DMV state" value={weights.geography.dmv_state} onChange={(v) => setWeights({ ...weights, geography: { ...weights.geography, dmv_state: v } })} />
            <WeightRow label="Near DMV" value={weights.geography.adjacent} onChange={(v) => setWeights({ ...weights, geography: { ...weights.geography, adjacent: v } })} />
            <WeightRow label="Size in range" value={weights.firmographic.size_in_range} onChange={(v) => setWeights({ ...weights, firmographic: { ...weights.firmographic, size_in_range: v } })} />
            <WeightRow label="Independent" value={weights.firmographic.independent} onChange={(v) => setWeights({ ...weights, firmographic: { ...weights.firmographic, independent: v } })} />
            <WeightRow label="High-security practice" value={weights.practice_area.high_security} onChange={(v) => setWeights({ ...weights, practice_area: { ...weights.practice_area, high_security: v } })} />
            <WeightRow label="Automation upsell" value={weights.practice_area.automation_upsell} onChange={(v) => setWeights({ ...weights, practice_area: { ...weights.practice_area, automation_upsell: v } })} />
            <WeightRow label="AI signal (each)" value={weights.ai_signal_each} onChange={(v) => setWeights({ ...weights, ai_signal_each: v })} />
          </div>
        </div>
      )}
    </div>
  );
}

function WeightRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-gray-600">{label}</span>
      <input type="number" className="input w-16 text-right" value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}
