import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBanner, EmptyState, PageHeader, Modal } from '../components/ui';

const STATUSES = ['Lead', 'Active', 'Completed'];
const STATUS_STYLE = {
  Lead: 'bg-amber-500/20 text-amber-300',
  Active: 'bg-emerald-500/20 text-emerald-300',
  Completed: 'bg-base-700 text-gray-400',
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
      setClients(clients);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, industryFilter]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0); // debounce search
    return () => clearTimeout(id);
  }, [load, search]);

  const industries = [...new Set(clients.map((c) => c.industry).filter(Boolean))];

  return (
    <div>
      <PageHeader title="Clients" subtitle="CRM & engagement pipeline">
        <button className="btn-primary" onClick={() => setAddOpen(true)}>+ Quick add</button>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          className="input max-w-xs"
          placeholder="Search name, contact, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input max-w-[160px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input max-w-[180px]" value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}>
          <option value="">All industries</option>
          {industries.map((i) => <option key={i}>{i}</option>)}
        </select>
      </div>

      <ErrorBanner error={error} onRetry={load} />
      {loading ? (
        <Spinner label="Loading clients…" />
      ) : clients.length === 0 ? (
        <EmptyState title="No clients found" hint="Adjust your filters or add a new client." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {STATUSES.map((status) => {
            const col = clients.filter((c) => c.status === status);
            return (
              <div key={status} className="bg-base-900/60 rounded-xl border border-base-700 p-3">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className={`badge ${STATUS_STYLE[status]}`}>{status}</span>
                  <span className="text-xs text-gray-500">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className="card bg-base-850 p-3 w-full text-left hover:border-base-600"
                    >
                      <p className="text-sm font-medium text-gray-100">{c.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.contactName || '—'}</p>
                      {c.industry && <span className="badge bg-base-700 text-gray-400 mt-2">{c.industry}</span>}
                      {c.aiSystemType && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{c.aiSystemType}</p>}
                    </button>
                  ))}
                  {col.length === 0 && <p className="text-xs text-gray-600 text-center py-3">No clients</p>}
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

  useEffect(() => { if (open) { setForm(blank); setErr(null); } /* eslint-disable-next-line */ }, [open]);
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await api.post('/clients', { ...form, email: form.email || undefined });
      onSaved();
    } catch (e2) {
      setErr(e2);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add client" wide>
      <form onSubmit={save} className="space-y-4">
        {err && <ErrorBanner error={err} />}
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Company name</label><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required /></div>
          <div><label className="label">Contact name</label><input className="input" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          <div><label className="label">Industry</label><input className="input" value={form.industry} onChange={(e) => set('industry', e.target.value)} /></div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div><label className="label">AI system type</label><input className="input" value={form.aiSystemType} onChange={(e) => set('aiSystemType', e.target.value)} placeholder="e.g. Customer-facing RAG chatbot" /></div>
        <div><label className="label">Notes</label><textarea className="input min-h-[70px]" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add client'}</button>
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
    if (!id) return;
    setLoading(true);
    try {
      const { client } = await api.get(`/clients/${id}`);
      setClient(client);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(status) {
    setSavingStatus(true);
    try {
      await api.patch(`/clients/${id}`, { status });
      await load();
      onChanged();
    } finally {
      setSavingStatus(false);
    }
  }

  async function addHistory(e) {
    e.preventDefault();
    if (!historyEntry.trim()) return;
    await api.post(`/clients/${id}/history`, { entry: historyEntry.trim() });
    setHistoryEntry('');
    load();
  }

  return (
    <Modal open={Boolean(id)} onClose={onClose} title={client?.name || 'Client'} wide>
      {loading || !client ? (
        <Spinner />
      ) : (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Field label="Contact" value={client.contactName} />
            <Field label="Email" value={client.email} />
            <Field label="Phone" value={client.phone} />
            <Field label="Industry" value={client.industry} />
            <Field label="AI system" value={client.aiSystemType} />
            <div>
              <p className="label">Status</p>
              <select
                className="input max-w-[180px]"
                value={client.status}
                disabled={savingStatus}
                onChange={(e) => changeStatus(e.target.value)}
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {client.notes && (
            <div>
              <p className="label">Notes</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <p className="label">Files</p>
              {client.files?.length ? (
                <ul className="text-sm text-gray-300 space-y-1">
                  {client.files.map((f, i) => <li key={i} className="flex items-center gap-2">📄 {f}</li>)}
                </ul>
              ) : <p className="text-sm text-gray-600">No files listed.</p>}
            </div>
            <div>
              <p className="label">Linked tasks</p>
              {client.tasks?.length ? (
                <ul className="text-sm text-gray-300 space-y-1">
                  {client.tasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{t.title}</span>
                      <span className="badge bg-base-700 text-gray-400">{t.status}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-600">No linked tasks.</p>}
            </div>
          </div>

          <div>
            <p className="label">Engagement history</p>
            <ul className="text-xs text-gray-400 space-y-1 max-h-40 overflow-y-auto mb-2">
              {[...client.history].reverse().map((h, i) => (
                <li key={i} className="border-l-2 border-base-700 pl-2">{h}</li>
              ))}
            </ul>
            <form onSubmit={addHistory} className="flex gap-2">
              <input className="input" placeholder="Log a note (e.g. 'Sent SOW draft')"
                value={historyEntry} onChange={(e) => setHistoryEntry(e.target.value)} />
              <button className="btn-primary px-3">Log</button>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="text-gray-200">{value || '—'}</p>
    </div>
  );
}
