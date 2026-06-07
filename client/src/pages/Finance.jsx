import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { api, getToken } from '../lib/api';
import { Spinner, ErrorBanner, Modal } from '../components/ui';

const usd = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const STATUS_STYLE = {
  Paid: 'badge-green',
  Pending: 'badge-amber',
  Overdue: 'badge-red',
};

export default function Finance() {
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [clients, setClients] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ summary, monthly }, { entries }, { clients }] = await Promise.all([
        api.get('/finance/summary'), api.get('/finance'), api.get('/clients'),
      ]);
      setSummary(summary); setMonthly(monthly); setEntries(entries); setClients(clients); setError(null);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function exportCsv() {
    const res = await fetch(`${api.baseUrl}/finance/export`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'redbase-finance.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  async function remove(id) { await api.del(`/finance/${id}`); load(); }

  if (loading) return <div className="p-8"><Spinner label="Loading finance…" /></div>;

  const margin = summary?.profitMargin ?? 0;
  const marginColor = margin > 0 ? 'text-accent-dim' : 'text-red-600';

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-400 mt-0.5">Revenue, expenses &amp; margin (USD)</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setModal('expense')}>+ Expense</button>
          <button className="btn-ghost" onClick={() => setModal('income')}>+ Income</button>
          <button className="btn-ghost" onClick={exportCsv}>↓ CSV</button>
        </div>
      </div>

      <ErrorBanner error={error} onRetry={load} />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard label="Monthly Revenue" value={usd(summary?.monthlyRevenue)}
          trend={summary?.monthlyRevenue > 0 ? 'up' : null} accent="green" />
        <KpiCard label="Outstanding" value={usd(summary?.outstandingInvoices)}
          sub="pending + overdue" accent={summary?.outstandingInvoices > 0 ? 'amber' : null} />
        <KpiCard label="Total Expenses" value={usd(summary?.totalExpenses)} accent="gray" />
        <KpiCard label="Profit Margin" value={`${margin}%`}
          sub={`${usd(summary?.profit)} profit`} accent={margin > 0 ? 'green' : 'red'} />
      </div>

      {/* Chart */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Income vs. Expense</h2>
        {monthly.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">Add income or expense entries to populate the chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgb(0 0 0/0.1)' }}
                formatter={v => usd(v)} labelStyle={{ fontWeight: 600, color: '#111827' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#6B7280' }} />
              <Bar dataKey="income" name="Income" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Entries table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-base-700">
          <h2 className="text-sm font-semibold text-gray-700">Entries</h2>
          <span className="text-xs text-gray-400">{entries.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 bg-base-900">
                {['Date','Type','Client / Category','Description','Invoice','Status','Amount',''].map(h => (
                  <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-gray-400 text-left ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-base-700">
              {entries.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">No entries yet. Add income or expense to get started.</td></tr>
              )}
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-base-900/40 transition-colors group">
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(e.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${e.type === 'income' ? 'badge-green' : 'badge-red'} text-[11px]`}>{e.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{e.client?.name || e.category || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{e.invoiceNumber || '—'}</td>
                  <td className="px-4 py-3">
                    {e.status ? <span className={`badge text-[11px] ${STATUS_STYLE[e.status]}`}>{e.status}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${e.type === 'income' ? 'text-accent-dim' : 'text-red-600'}`}>
                    {e.type === 'income' ? '+' : '−'}{usd(e.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(e.id)}
                      className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EntryModal type={modal} clients={clients} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
    </div>
  );
}

function KpiCard({ label, value, sub, accent }) {
  const accentClass = {
    green: 'text-accent-dim border-t-2 border-accent',
    amber: 'text-amber-600 border-t-2 border-amber-400',
    red: 'text-red-600 border-t-2 border-red-400',
    gray: 'text-gray-900',
  }[accent] || 'text-gray-900';

  return (
    <div className={`card p-4 ${accent === 'green' ? 'border-t-accent' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accentClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function EntryModal({ type, clients, onClose, onSaved }) {
  const open = Boolean(type);
  const isIncome = type === 'income';
  const blank = { amount: '', date: new Date().toISOString().slice(0, 10), clientId: '', category: '', description: '', invoiceNumber: '', status: 'Pending' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { if (open) { setForm(blank); setErr(null); } }, [open, type]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save(e) {
    e.preventDefault(); setSaving(true); setErr(null);
    try {
      await api.post('/finance', {
        type, amount: parseFloat(form.amount), date: new Date(form.date).toISOString(),
        clientId: form.clientId || null, category: form.category || undefined,
        description: form.description, invoiceNumber: isIncome ? form.invoiceNumber : undefined,
        status: isIncome ? form.status : undefined,
      });
      onSaved();
    } catch (e2) { setErr(e2); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={isIncome ? 'Add Income' : 'Add Expense'}>
      <form onSubmit={save} className="space-y-4">
        {err && <ErrorBanner error={err} />}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount (USD)</label>
            <input type="number" step="0.01" min="0" className="input" value={form.amount} onChange={e => set('amount', e.target.value)} required />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} required />
          </div>
        </div>
        {isIncome ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Client</label>
                <select className="input" value={form.clientId} onChange={e => set('clientId', e.target.value)}>
                  <option value="">None</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Invoice #</label>
                <input className="input" value={form.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)} placeholder="INV-001" />
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Paid</option><option>Pending</option><option>Overdue</option>
              </select>
            </div>
          </>
        ) : (
          <div>
            <label className="label">Category</label>
            <input className="input" placeholder="Tooling, Travel, Software…" value={form.category} onChange={e => set('category', e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Description</label>
          <input className="input" placeholder="Brief description" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Entry'}</button>
        </div>
      </form>
    </Modal>
  );
}
