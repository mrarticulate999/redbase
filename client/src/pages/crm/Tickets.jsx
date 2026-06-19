import { useEffect, useState } from 'react';
import { Modal, PageHeader } from '../../components/ui';
import { Spinner } from '../../components/crm/bits';
import { crmApi, timeSince } from '../../lib/crm';

const STATUSES = ['open', 'pending', 'resolved', 'closed'];
const PRIO = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-amber', urgent: 'badge-red' };

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ status: 'open', priority: 'medium', assignee: 'Grant Johnson' });

  async function load() {
    const [t, c] = await Promise.all([crmApi.listTickets(), crmApi.listCompanies()]);
    setTickets(t.tickets); setCompanies(c.companies); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function drop(status) {
    const id = dragId; setDragId(null);
    const t = tickets.find((x) => x.id === id);
    if (!t || t.status === status) return;
    setTickets((prev) => prev.map((x) => x.id === id ? { ...x, status } : x));
    await crmApi.updateTicket(id, { status });
    load();
  }
  async function create(e) {
    e.preventDefault();
    await crmApi.createTicket(form);
    setOpen(false); setForm({ status: 'open', priority: 'medium', assignee: 'Grant Johnson' }); load();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="eyebrow-accent mb-1">03 / SUPPORT</div>
      <PageHeader title="Support" subtitle="Ticket board with time-since-opened SLA timers. Drag to change status.">
        <button className="btn-primary" onClick={() => setOpen(true)}>New ticket</button>
      </PageHeader>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUSES.map((st) => {
          const col = tickets.filter((t) => t.status === st);
          return (
            <div key={st} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(st)}
              className="w-72 shrink-0 rounded-lg border border-base-700 bg-base-900 p-2">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="eyebrow">{st}</span><span className="badge badge-gray">{col.length}</span>
              </div>
              <div className="space-y-2 min-h-[40px]">
                {col.map((t) => {
                  const live = t.status === 'open' || t.status === 'pending';
                  return (
                    <div key={t.id} draggable onDragStart={() => setDragId(t.id)} className="card p-2.5 cursor-grab active:cursor-grabbing">
                      <div className="text-sm font-medium text-ink">{t.subject}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{t.company?.name || '—'} · {t.assignee || 'Unassigned'}</div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className={`badge ${PRIO[t.priority]}`}>{t.priority}</span>
                        {live && <span className="font-mono text-[11px] text-gray-400">{timeSince(t.openedAt)} open</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New ticket">
        <form onSubmit={create} className="space-y-3">
          <div><label className="label">Subject</label><input className="input" required value={form.subject || ''} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          <div><label className="label">Firm</label>
            <select className="input" value={form.companyId || ''} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
              <option value="">—</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {Object.keys(PRIO).map((p) => <option key={p} value={p}>{p}</option>)}
              </select></div>
            <div><label className="label">Assignee</label><input className="input" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></div>
          </div>
          <div className="flex justify-end border-t border-base-800 pt-3"><button className="btn-primary" disabled={!form.subject}>Create ticket</button></div>
        </form>
      </Modal>
    </div>
  );
}
