import { useEffect, useMemo, useState } from 'react';
import { Modal, PageHeader, EmptyState } from '../../components/ui';
import { ScoreChip, GeoBadge, Kpi, Spinner } from '../../components/crm/bits';
import {
  crmApi, SERVICE_LABELS, SERVICE_LADDER, PERSONA_LABELS, LEAD_STATUS_LABELS,
  fmtMoney, fmtDate, toCSV, downloadCSV,
} from '../../lib/crm';

const US_STATES = ['DC', 'MD', 'VA', 'PA', 'DE', 'NJ', 'NC', 'OH', 'NY', 'CA', 'TX', 'IL', 'FL', 'WA', 'GA', 'MA'];

export default function Leads() {
  const [companies, setCompanies] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [source, setSource] = useState('auto');
  const [openId, setOpenId] = useState(null);

  // filters
  const [search, setSearch] = useState('');
  const [stateF, setStateF] = useState('');
  const [statusF, setStatusF] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [hideDQ, setHideDQ] = useState(true);

  async function load() {
    const [c, s] = await Promise.all([crmApi.listCompanies(), crmApi.prospectingStatus()]);
    setCompanies(c.companies);
    setStatus(s);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function runProspecting() {
    setRunning(true);
    try { await crmApi.runProspecting({ source }); await load(); }
    finally { setRunning(false); }
  }

  const filtered = useMemo(() => companies.filter((c) => {
    if (hideDQ && c.disqualified) return false;
    if (stateF && c.state !== stateF) return false;
    if (statusF && c.leadStatus !== statusF) return false;
    if (c.priorityScore < minScore) return false;
    if (search) {
      const h = `${c.name} ${c.city} ${c.county} ${(c.practiceAreas || []).join(' ')}`.toLowerCase();
      if (!h.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [companies, hideDQ, stateF, statusF, minScore, search]);

  const dmvCore = companies.filter((c) => c.geoTier === 'dmv_core' && !c.disqualified).length;
  const avgScore = filtered.length ? Math.round(filtered.reduce((s, c) => s + c.priorityScore, 0) / filtered.length) : 0;

  function exportView() {
    downloadCSV('leads', toCSV(filtered.map((c) => ({
      name: c.name, state: c.state, county: c.county, city: c.city, attorneys: c.attorneyCount,
      score: c.priorityScore, geoTier: c.geoTier, leadStatus: c.leadStatus, source: c.source,
      practiceAreas: c.practiceAreas, website: c.website,
    }))));
  }

  if (loading) return <Spinner />;
  const deficit = status?.deficit ?? 0;

  return (
    <div>
      <div className="eyebrow-accent mb-1">01 / LEAD ACQUISITION</div>
      <PageHeader title="Leads" subtitle="ICP-scored prospects, US-wide and DMV-weighted. The engine keeps the pipeline topped up to target.">
        <div className="seg mr-1">
          {['auto', 'clay', 'generated'].map((s) => (
            <button key={s} onClick={() => setSource(s)} className={`seg-item ${source === s ? 'seg-item-active' : ''}`}>{s}</button>
          ))}
        </div>
        <button onClick={exportView} className="btn-ghost">Export CSV</button>
        <button onClick={runProspecting} disabled={running} className="btn-primary">
          {running ? 'Prospecting…' : 'Run prospecting'}
        </button>
      </PageHeader>

      {/* Acquisition console */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi code="ACTIVE" label="Active leads" value={`${status?.active ?? 0}`} sub={`target ${status?.target ?? 100}`} accent="#15924B" />
        <Kpi code="DEFICIT" label="To target" value={deficit === 0 ? '✓ Full' : `+${deficit}`} sub={deficit === 0 ? 'pipeline at capacity' : 'run engine to fill'} accent={deficit === 0 ? '#15924B' : '#D97706'} />
        <Kpi code="DMV" label="DMV-core leads" value={`${dmvCore}`} sub="highest-priority territory" accent="#2563EB" />
        <Kpi code="SOURCE" label="Live source" value={status?.clayConfigured ? 'Clay' : 'Generator'} sub={status?.clayConfigured ? 'Clay webhook configured' : 'set CLAY_WEBHOOK_URL to go live'} accent="#0891B2" />
      </div>

      {/* last run note */}
      {status?.runs?.[0] && (
        <div className="panel px-4 py-2.5 mb-4 flex items-center gap-3 text-xs text-gray-500">
          <span className="status-dot" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-gray-400">last run</span>
          <span className="text-ink font-medium">{status.runs[0].source}</span>
          <span>· inserted {status.runs[0].inserted} · {status.runs[0].note}</span>
          <span className="ml-auto">{fmtDate(status.runs[0].createdAt)}</span>
        </div>
      )}

      {/* filters */}
      <div className="panel p-3 mb-3 flex flex-wrap items-center gap-2">
        <input className="input max-w-xs" placeholder="Search firm, city, practice…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input w-28" value={stateF} onChange={(e) => setStateF(e.target.value)}>
          <option value="">All states</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input w-36" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          min score
          <input type="range" min={0} max={100} step={5} value={minScore} onChange={(e) => setMinScore(+e.target.value)} className="accent-accent" />
          <span className="w-6 font-mono text-ink">{minScore}</span>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-auto">
          <input type="checkbox" checked={hideDQ} onChange={(e) => setHideDQ(e.target.checked)} className="accent-accent" /> Hide disqualified
        </label>
      </div>

      {/* table */}
      <div className="panel overflow-hidden">
        <table className="dt">
          <thead>
            <tr>
              <th>Firm</th><th>Territory</th><th>Attorneys</th><th>Practice</th><th>Source</th><th>Status</th><th>Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer">
                <td>
                  <div className="font-medium text-ink">{c.name}</div>
                  <div className="text-[11px] text-gray-400">{c.city}{c.county ? `, ${c.county}` : ''}</div>
                </td>
                <td><GeoBadge tier={c.geoTier} /> <span className="ml-1 text-xs text-gray-400">{c.state}</span></td>
                <td className="tabular-nums text-gray-600">{c.attorneyCount ?? '—'}</td>
                <td className="text-gray-500"><span className="line-clamp-1">{(c.practiceAreas || []).join(', ') || '—'}</span></td>
                <td><span className="font-mono text-[11px] uppercase tracking-wide text-gray-400">{c.source}</span></td>
                <td><span className="badge badge-gray">{LEAD_STATUS_LABELS[c.leadStatus]}</span></td>
                <td><ScoreChip score={c.priorityScore} disqualified={c.disqualified} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState title="No leads match" hint="Adjust filters or run the prospecting engine." />}
      </div>
      <p className="mt-2 text-xs text-gray-400">{filtered.length} of {companies.length} firms · avg score {avgScore} · scored live by the ICP engine.</p>

      {openId && <CompanyDrawer id={openId} onClose={() => setOpenId(null)} onChange={load} />}
    </div>
  );
}

// ── Company detail drawer ──────────────────────────────────────────────────
function CompanyDrawer({ id, onClose, onChange }) {
  const [company, setCompany] = useState(null);
  const [acts, setActs] = useState([]);
  const [note, setNote] = useState('');
  const [noteType, setNoteType] = useState('note');

  async function load() {
    const { company } = await crmApi.getCompany(id);
    setCompany(company);
    const { activities } = await crmApi.listActivities('company', id);
    setActs(activities);
  }
  useEffect(() => { load(); }, [id]);

  async function setStatus(leadStatus) {
    await crmApi.updateCompany(id, { leadStatus });
    await load(); onChange?.();
  }
  async function addNote() {
    if (!note) return;
    await crmApi.createActivity({ relatedType: 'company', relatedId: id, type: noteType, body: note });
    setNote(''); load();
  }

  const deals = company?.deals || [];
  const wonIdx = deals.filter((d) => d.stage === 'closed_won').map((d) => SERVICE_LADDER.indexOf(d.serviceType));
  const touched = deals.map((d) => SERVICE_LADDER.indexOf(d.serviceType));
  const curIdx = wonIdx.length ? Math.max(...wonIdx) : touched.length ? Math.max(...touched) : -1;
  const next = SERVICE_LADDER[curIdx + 1];

  return (
    <Modal open onClose={onClose} wide title={company?.name || 'Loading…'}>
      {!company ? <Spinner /> : (
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <ScoreChip score={company.priorityScore} disqualified={company.disqualified} />
              <GeoBadge tier={company.geoTier} />
              <span className="badge badge-gray">{company.attorneyCount ?? '—'} attorneys</span>
              {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="text-xs text-accent-dim hover:underline">Website ↗</a>}
            </div>

            <div>
              <div className="eyebrow mb-1.5">Lead status</div>
              <div className="seg">
                {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
                  <button key={k} onClick={() => setStatus(k)} className={`seg-item ${company.leadStatus === k ? 'seg-item-active' : ''}`}>{v}</button>
                ))}
              </div>
            </div>

            {/* expansion ladder */}
            <div>
              <div className="eyebrow mb-1.5">Expansion ladder</div>
              <div className="space-y-1">
                {SERVICE_LADDER.map((s, i) => (
                  <div key={s} className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${i === curIdx ? 'bg-accent-light text-accent-dim' : i < curIdx ? 'text-gray-300 line-through' : 'text-gray-600'}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${i <= curIdx ? 'bg-accent text-white' : 'bg-base-800 text-gray-400'}`}>{i + 1}</span>
                    {SERVICE_LABELS[s]}
                  </div>
                ))}
              </div>
              {next && <div className="mt-2 text-xs text-accent-dim">Next upsell → {SERVICE_LABELS[next]}</div>}
            </div>

            {/* contacts */}
            <div>
              <div className="eyebrow mb-1.5">Contacts ({company.contacts.length})</div>
              <div className="space-y-1.5">
                {company.contacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded border border-base-800 px-2 py-1.5">
                    <div><span className="text-sm font-medium text-ink">{c.firstName} {c.lastName}</span><span className="ml-2 text-xs text-gray-400">{c.title}</span></div>
                    <span className="badge badge-gray">{PERSONA_LABELS[c.personaRole]}</span>
                  </div>
                ))}
                {company.contacts.length === 0 && <p className="text-sm text-gray-400">No contacts.</p>}
              </div>
            </div>

            {/* deals */}
            <div>
              <div className="eyebrow mb-1.5">Deals ({deals.length})</div>
              {deals.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded border border-base-800 px-2 py-1.5 mb-1">
                  <span className="text-sm text-ink">{SERVICE_LABELS[d.serviceType]}</span>
                  <span className="text-sm font-semibold tabular-nums">{fmtMoney(d.amount)} · {d.stage.replace(/_/g, ' ')}</span>
                </div>
              ))}
              {deals.length === 0 && <p className="text-sm text-gray-400">No deals.</p>}
            </div>
          </div>

          {/* activity timeline */}
          <div>
            <div className="eyebrow mb-1.5">Activity & notes</div>
            <div className="rounded-lg border border-base-800 bg-base-900 p-2.5 mb-3">
              <div className="flex gap-2 mb-2">
                <select className="input w-28" value={noteType} onChange={(e) => setNoteType(e.target.value)}>
                  {['note', 'call', 'email', 'meeting', 'task'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={addNote} disabled={!note} className="btn-primary">Add</button>
              </div>
              <textarea className="input" rows={2} placeholder="Log a note, call, or task…" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {acts.map((a) => (
                <li key={a.id} className="rounded border border-base-800 px-2.5 py-2">
                  <div className="text-sm text-gray-700">{a.body}</div>
                  <div className="mt-0.5 text-[11px] text-gray-400 font-mono uppercase tracking-wide">{a.type} · {fmtDate(a.createdAt)}{a.dueAt ? ` · due ${fmtDate(a.dueAt)}` : ''}</div>
                </li>
              ))}
              {acts.length === 0 && <p className="text-sm text-gray-400">No activity yet.</p>}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}
