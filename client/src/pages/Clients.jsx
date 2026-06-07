import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBanner, EmptyState, Modal, initials, colorFor } from '../components/ui';

const STATUSES = ['Lead', 'Active', 'Completed'];
const STATUS_STYLE = {
  Lead: 'bg-amber-50 text-amber-700 border-amber-200',
  Active: 'bg-accent-light text-accent-dim border-accent/30',
  Completed: 'bg-gray-100 text-gray-500 border-gray-200',
};
const STATUS_DOT = {
  Lead: 'bg-amber-400',
  Active: 'bg-accent',
  Completed: 'bg-gray-300',
};

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (industryFilter) params.set('industry', industryFilter);
      const { clients } = await api.get(`/clients?${params.toString()}`);
      setClients(clients); setError(null);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }, [search, statusFilter, industryFilter]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  const industries = [...new Set(clients.map(c => c.industry).filter(Boolean))];

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">CRM pipeline — {clients.length} total</p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>+ Add Client</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input className="input pl-9 w-56" placeholder="Search name, contact, email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40 py-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-44 py-2" value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}>
          <option value="">All industries</option>
          {industries.map(i => <option key={i}>{i}</option>)}
        </select>
        {(search || statusFilter || industryFilter) && (
          <button className="btn-ghost py-2 text-sm" onClick={() => { setSearch(''); setStatusFilter(''); setIndustryFilter(''); }}>
            Clear
          </button>
        )}
      </div>

      <ErrorBanner error={error} onRetry={load} />

      {loading ? <Spinner label="Loading clients…" /> : clients.length === 0 ? (
        <EmptyState title="No clients found" hint="Adjust your filters or add a new client." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {STATUSES.map(status => {
            const col = clients.filter(c => c.status === status);
            return (
              <div key={status}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
                  <span className="text-sm font-semibold text-gray-700">{status}</span>
                  <span className="ml-auto badge bg-base-850 text-gray-500 text-[11px]">{col.length}</span>
                </div>

                <div className="space-y-2.5">
                  {col.map(c => {
                    const color = colorFor(c.name);
                    return (
                      <button key={c.id} onClick={() => setSelectedId(c.id)}
                        className="card w-full text-left p-4 hover:shadow-card-hover transition-all group">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                            style={{ backgroundColor: color }}>
                            {initials(c.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm">{c.name}</p>
                            <p className="text-xs text-gray-400 truncate">{c.contactName || '—'}</p>
                          </div>
                        </div>
                        {c.industry && (
                          <span className="badge badge-blue mt-2.5 text-[11px]">{c.industry}</span>
                        )}
                        {c.aiSystemType && (
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2">{c.aiSystemType}</p>
                        )}
                      </button>
                    );
                  })}
                  {col.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-base-700 p-6 text-center">
                      <p className="text-xs text-gray-400">No {status.toLowerCase()} clients</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddClientModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load(); }} />
      <ClientDetail id={selectedId} onClose={() => setSelectedId(null)} onChanged={load} />
    </div>
  );
}

function AddClientModal({ open, onClose, onSaved }) {
  const blank = { name: '', contactName: '', email: '', phone: '', industry: '', aiSystemType: '', status: 'Lead', notes: '' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { if (open) { setForm(blank); setErr(null); } }, [open]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save(e) {
    e.preventDefault(); setSaving(true); setErr(null);
    try {
      await api.post('/clients', { ...form, email: form.email || undefined });
      onSaved();
    } catch (e2) { setErr(e2); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Client" wide>
      <form onSubmit={save} className="space-y-4">
        {err && <ErrorBanner error={err} />}
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Company Name</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
          <div><label className="label">Contact Name</label><input className="input" value={form.contactName} onChange={e => set('contactName', e.target.value)} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div><label className="label">Industry</label><input className="input" value={form.industry} onChange={e => set('industry', e.target.value)} /></div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div><label className="label">AI System Type</label><input className="input" value={form.aiSystemType} onChange={e => set('aiSystemType', e.target.value)} placeholder="e.g. Customer-facing RAG chatbot" /></div>
        <div><label className="label">Notes</label><textarea className="input min-h-[70px]" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Client'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ClientDetail({ id, onClose, onChanged }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyEntry, setHistoryEntry] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const load = useCallback(async () => {
    if (!id) return; setLoading(true);
    try { const { client } = await api.get(`/clients/${id}`); setClient(client); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(status) {
    setSavingStatus(true);
    try { await api.patch(`/clients/${id}`, { status }); await load(); onChanged(); }
    finally { setSavingStatus(false); }
  }

  async function addHistory(e) {
    e.preventDefault();
    if (!historyEntry.trim()) return;
    await api.post(`/clients/${id}/history`, { entry: historyEntry.trim() });
    setHistoryEntry(''); load();
  }

  const color = client ? colorFor(client.name) : '#9CA3AF';

  return (
    <Modal open={Boolean(id)} onClose={onClose} title="" wide>
      {loading || !client ? <Spinner /> : (
        <div className="space-y-5 -mt-5">
          {/* Client hero */}
          <div className="flex items-center gap-4 pb-4 border-b border-base-700">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
              style={{ backgroundColor: color }}>
              {initials(client.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
              <p className="text-sm text-gray-400">{client.contactName}</p>
              <div className="mt-1">
                <span className={`badge text-[11px] border ${STATUS_STYLE[client.status]}`}>{client.status}</span>
              </div>
            </div>
            <select className="input max-w-[140px] py-1.5 text-sm" value={client.status}
              disabled={savingStatus} onChange={e => changeStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <Field label="Email" value={client.email} link={client.email ? `mailto:${client.email}` : null} />
            <Field label="Phone" value={client.phone} />
            <Field label="Industry" value={client.industry} />
            <Field label="AI System Type" value={client.aiSystemType} />
          </div>

          {client.notes && (
            <div>
              <p className="label">Notes</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-base-900 rounded-lg px-3 py-2">{client.notes}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="label">Linked Tasks</p>
              {client.tasks?.length ? (
                <div className="space-y-1.5">
                  {client.tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg bg-base-900 px-3 py-2">
                      <span className="text-xs text-gray-700 truncate flex-1">{t.title}</span>
                      <span className="badge badge-gray text-[10px] ml-2 shrink-0">{t.status}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">No linked tasks.</p>}
            </div>
            <div>
              <p className="label">Files</p>
              {client.files?.length ? (
                <div className="space-y-1">
                  {client.files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-base-900 rounded px-2 py-1.5">
                      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                      {f}
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">No files listed.</p>}
            </div>
          </div>

          {/* History */}
          <div>
            <p className="label">Engagement History</p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto mb-3">
              {[...(client.history || [])].reverse().map((h, i) => (
                <div key={i} className="flex gap-2 text-xs text-gray-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-base-700 shrink-0 mt-1.5" />
                  {h}
                </div>
              ))}
              {!client.history?.length && <p className="text-xs text-gray-400">No history yet.</p>}
            </div>
            <form onSubmit={addHistory} className="flex gap-2">
              <input className="input flex-1 text-sm" placeholder="Log a note (e.g. 'Sent SOW draft')"
                value={historyEntry} onChange={e => setHistoryEntry(e.target.value)} />
              <button className="btn-primary px-3 py-2 text-sm">Log</button>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value, link }) {
  return (
    <div>
      <p className="label">{label}</p>
      {link && value ? (
        <a href={link} className="text-sm text-brand-blue hover:underline">{value}</a>
      ) : (
        <p className="text-sm text-gray-700">{value || <span className="text-gray-300">—</span>}</p>
      )}
    </div>
  );
}
