import { useEffect, useMemo, useState } from 'react';
import { Modal, PageHeader } from '../../components/ui';
import { Kpi, Spinner } from '../../components/crm/bits';
import { crmApi, SERVICE_LABELS, SERVICE_LADDER, fmtMoney } from '../../lib/crm';

export default function Pipeline() {
  const [deals, setDeals] = useState([]);
  const [stages, setStages] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ serviceType: 'posture_assessment', stage: 'new', amount: 0, source: 'outbound' });

  async function load() {
    const [d, s, c] = await Promise.all([crmApi.listDeals(), crmApi.listStages(), crmApi.listCompanies()]);
    setDeals(d.deals); setStages(s.stages); setCompanies(c.companies); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function drop(stageKey) {
    const id = dragId; setDragId(null);
    const deal = deals.find((x) => x.id === id);
    if (!deal || deal.stage === stageKey) return;
    setDeals((prev) => prev.map((x) => x.id === id ? { ...x, stage: stageKey } : x)); // optimistic
    await crmApi.updateDeal(id, { stage: stageKey });
    load();
  }

  async function create(e) {
    e.preventDefault();
    const name = form.name || `${companies.find((c) => c.id === form.companyId)?.name || 'Deal'} — ${SERVICE_LABELS[form.serviceType]}`;
    await crmApi.createDeal({ ...form, name });
    setOpen(false); setForm({ serviceType: 'posture_assessment', stage: 'new', amount: 0, source: 'outbound' }); load();
  }

  const { openValue, weighted, won } = useMemo(() => {
    const open_ = deals.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost');
    return {
      openValue: open_.reduce((s, d) => s + d.amount, 0),
      weighted: open_.reduce((s, d) => s + d.amount * (d.probability / 100), 0),
      won: deals.filter((d) => d.stage === 'closed_won').reduce((s, d) => s + d.amount, 0),
    };
  }, [deals]);

  const byService = SERVICE_LADDER.map((svc) => ({
    svc, w: deals.filter((d) => d.serviceType === svc && d.stage !== 'closed_won' && d.stage !== 'closed_lost').reduce((s, d) => s + d.amount * (d.probability / 100), 0),
  })).filter((x) => x.w > 0);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="eyebrow-accent mb-1">02 / PIPELINE</div>
      <PageHeader title="Pipeline" subtitle="Drag deals across stages. Forecast is weighted by stage probability.">
        <button className="btn-primary" onClick={() => setOpen(true)}>New deal</button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi code="OPEN" label="Open pipeline" value={fmtMoney(openValue)} accent="#94A3B8" />
        <Kpi code="WEIGHTED" label="Weighted forecast" value={fmtMoney(weighted)} accent="#15924B" />
        <Kpi code="WON" label="Closed won" value={fmtMoney(won)} accent="#2563EB" />
        <Kpi code="DEALS" label="Open deals" value={`${deals.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length}`} accent="#0891B2" />
      </div>

      {byService.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span className="eyebrow">weighted by service</span>
          {byService.map((x) => <span key={x.svc} className="badge badge-gray">{SERVICE_LABELS[x.svc]}: {fmtMoney(x.w)}</span>)}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((s) => {
          const col = deals.filter((d) => d.stage === s.key);
          const total = col.reduce((a, d) => a + d.amount, 0);
          return (
            <div key={s.key} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(s.key)}
              className="w-64 shrink-0 rounded-lg border border-base-700 bg-base-900 p-2">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="eyebrow">{s.label}</span>
                <span className="badge badge-gray">{s.probability}%</span>
              </div>
              <div className="px-1 mb-2 text-[11px] text-gray-400 tabular-nums">{col.length} · {fmtMoney(total)}</div>
              <div className="space-y-2 min-h-[40px]">
                {col.map((d) => (
                  <div key={d.id} draggable onDragStart={() => setDragId(d.id)}
                    className="card p-2.5 cursor-grab active:cursor-grabbing">
                    <div className="text-sm font-medium text-ink">{d.company?.name || d.name}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="badge badge-green">{SERVICE_LABELS[d.serviceType]}</span>
                      <span className="text-sm font-semibold tabular-nums">{fmtMoney(d.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New deal">
        <form onSubmit={create} className="space-y-3">
          <div><label className="label">Firm</label>
            <select className="input" required value={form.companyId || ''} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
              <option value="">Select firm…</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className="label">Deal name (optional)</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Auto-generated if blank" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Service</label>
              <select className="input" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
                {SERVICE_LADDER.map((s) => <option key={s} value={s}>{SERVICE_LABELS[s]}</option>)}
              </select></div>
            <div><label className="label">Stage</label>
              <select className="input" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                {stages.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Amount ($)</label><input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></div>
            <div><label className="label">Expected close</label><input type="date" className="input" value={form.expectedClose || ''} onChange={(e) => setForm({ ...form, expectedClose: e.target.value })} /></div>
          </div>
          <div className="flex justify-end border-t border-base-800 pt-3"><button className="btn-primary" disabled={!form.companyId}>Create deal</button></div>
        </form>
      </Modal>
    </div>
  );
}
