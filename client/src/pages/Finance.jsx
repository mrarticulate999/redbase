import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { api, getToken } from '../lib/api';
import { Spinner, ErrorBanner, PageHeader, Modal } from '../components/ui';

const usd = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const STATUS_STYLE = {
  Paid: 'bg-emerald-500/20 text-emerald-300',
  Pending: 'bg-amber-500/20 text-amber-300',
  Overdue: 'bg-accent/20 text-accent-glow',
};

export default function Finance() {
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // 'income' | 'expense' | null
  const [clients, setClients] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ summary, monthly }, { entries }, { clients }] = await Promise.all([
        api.get('/finance/summary'),
        api.get('/finance'),
        api.get('/clients'),
      ]);
      setSummary(summary);
      setMonthly(monthly);
      setEntries(entries);
      setClients(clients);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function exportCsv() {
    const res = await fetch(`${api.baseUrl}/finance/export`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'redbase-finance.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function remove(id) {
    await api.del(`/finance/${id}`);
    load();
  }

  if (loading) return <Spinner label="Loading finance…" />;

  return (
    <div>
      <PageHeader title="Finance" subtitle="Revenue, invoices, expenses & margin (USD)">
        <button className="btn-ghost" onClick={() => setModal('expense')}>+ Expense</button>
        <button className="btn-ghost" onClick={() => setModal('income')}>+ Income</button>
        <button className="btn-ghost" onClick={exportCsv}>Export CSV</button>
      </PageHeader>

      <ErrorBanner error={error} onRetry={load} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi label="Monthly revenue" value={usd(summary?.monthlyRevenue)} accent />
        <Kpi label="Outstanding invoices" value={usd(summary?.outstandingInvoices)} />
        <Kpi label="Total expenses" value={usd(summary?.totalExpenses)} />
        <Kpi label="Profit margin" value={`${summary?.profitMargin ?? 0}%`}
          sub={`${usd(summary?.profit)} profit`} />
      </div>

      <div className="card p-4 mb-6">
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">Monthly income vs. expense</h2>
        {monthly.length === 0 ? (
          <p className="text-sm text-gray-600 py-10 text-center">No data yet — add entries to populate the chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262f" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: '#16161c', border: '1px solid #33333f', borderRadius: 8 }}
                formatter={(v) => usd(v)}
              />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-base-700">
          <h2 className="text-sm uppercase tracking-wide text-gray-500">Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b border-base-700">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Client / Category</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium">Invoice</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Amount</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-600">No entries yet.</td></tr>
              )}
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-base-800 hover:bg-base-800/50">
                  <td className="px-4 py-2 text-gray-400">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <span className={`badge ${e.type === 'income' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-accent/20 text-accent-glow'}`}>
                      {e.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-300">{e.client?.name || e.category}</td>
                  <td className="px-4 py-2 text-gray-400">{e.description}</td>
                  <td className="px-4 py-2 text-gray-500">{e.invoiceNumber || '—'}</td>
                  <td className="px-4 py-2">
                    {e.status ? <span className={`badge ${STATUS_STYLE[e.status]}`}>{e.status}</span> : '—'}
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${e.type === 'income' ? 'text-emerald-300' : 'text-accent-glow'}`}>
                    {e.type === 'income' ? '+' : '−'}{usd(e.amount)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => remove(e.id)} className="text-xs text-gray-600 hover:text-accent">delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EntryModal
        type={modal}
        clients={clients}
        onClose={() => setModal(null)}
        onSaved={() => { setModal(null); load(); }}
      />
    </div>
  );
}

function Kpi({ label, value, sub, accent }) {
  return (
    <div className={`card p-4 ${accent ? 'border-accent/40' : ''}`}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent ? 'text-accent-glow' : 'text-gray-100'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function EntryModal({ type, clients, onClose, onSaved }) {
  const open = Boolean(type);
  const isIncome = type === 'income';
  const blank = {
    amount: '', date: new Date().toISOString().slice(0, 10), clientId: '',
    category: '', description: '', invoiceNumber: '', status: 'Pending',
  };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { if (open) { setForm(blank); setErr(null); } /* eslint-disable-next-line */ }, [open, type]);
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await api.post('/finance', {
        type,
        amount: parseFloat(form.amount),
        date: new Date(form.date).toISOString(),
        clientId: form.clientId || null,
        category: form.category || undefined,
        description: form.description,
        invoiceNumber: isIncome ? form.invoiceNumber : undefined,
        status: isIncome ? form.status : undefined,
      });
      onSaved();
    } catch (e2) {
      setErr(e2);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isIncome ? 'Add income' : 'Add expense'}>
      <form onSubmit={save} className="space-y-4">
        {err && <ErrorBanner error={err} />}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount (USD)</label>
            <input type="number" step="0.01" min="0" className="input" value={form.amount}
              onChange={(e) => set('amount', e.target.value)} required />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </div>
        </div>

        {isIncome ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Client</label>
                <select className="input" value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
                  <option value="">None</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Invoice #</label>
                <input className="input" value={form.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option>Paid</option><option>Pending</option><option>Overdue</option>
              </select>
            </div>
          </>
        ) : (
          <div>
            <label className="label">Category</label>
            <input className="input" placeholder="Tooling, Travel, Software…" value={form.category}
              onChange={(e) => set('category', e.target.value)} />
          </div>
        )}

        <div>
          <label className="label">Description</label>
          <input className="input" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save entry'}</button>
        </div>
      </form>
    </Modal>
  );
}
