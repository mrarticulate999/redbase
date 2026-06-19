import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { PageHeader } from '../../components/ui';
import { ScoreChip, GeoBadge, Kpi, Spinner } from '../../components/crm/bits';
import { crmApi, fmtMoney, fmtDate, GEO_LABELS } from '../../lib/crm';

const VIZ = ['#15924B', '#2563EB', '#0891B2', '#D97706', '#7C3AED', '#DB2777'];

export default function CrmDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { crmApi.dashboard().then(setD); }, []);
  if (!d) return <Spinner />;
  const m = d.metrics;

  return (
    <div>
      <div className="eyebrow-accent mb-1">00 / REVENUE OVERVIEW</div>
      <PageHeader title="CRM Overview" subtitle="Pipeline health, lead supply, and top DMV targets." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi code="FORECAST" label="Weighted forecast" value={fmtMoney(m.weightedForecast)} accent="#15924B" />
        <Kpi code="LEADS" label="Active leads" value={`${m.activeLeads}/${m.leadTarget}`} sub={m.activeLeads >= m.leadTarget ? 'at target' : `${m.leadTarget - m.activeLeads} to target`} accent={m.activeLeads >= m.leadTarget ? '#15924B' : '#D97706'} />
        <Kpi code="WINRATE" label="Win rate" value={`${m.winRate}%`} accent="#2563EB" />
        <Kpi code="SUPPORT" label="Open tickets" value={`${m.openTickets}`} accent="#0891B2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel lg:col-span-2">
          <div className="panel-head"><span className="panel-title">Pipeline value by stage</span><span className="eyebrow">USD</span></div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={d.byStage} margin={{ top: 6, right: 6, left: 6, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={0} angle={-12} textAnchor="end" height={42} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v) => fmtMoney(v)} cursor={{ fill: '#F1F4F8' }} />
                <Bar dataKey="value" fill="#15924B" radius={[3, 3, 0, 0]} maxBarSize={46} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><span className="panel-title">Lead geography</span></div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={d.byGeo.map((g) => ({ ...g, name: GEO_LABELS[g.name] || g.name }))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={2}>
                  {d.byGeo.map((_, i) => <Cell key={i} fill={VIZ[i % VIZ.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
              {d.byGeo.map((g, i) => (
                <span key={g.name} className="flex items-center gap-1 text-[11px] text-gray-500">
                  <span className="h-2 w-2 rounded-sm" style={{ background: VIZ[i % VIZ.length] }} />{GEO_LABELS[g.name] || g.name} · {g.value}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><span className="panel-title">Follow-up tasks</span><span className="badge badge-gray">{d.tasks.length}</span></div>
          <div className="p-3 space-y-2">
            {d.tasks.length === 0 ? <p className="text-sm text-gray-400 px-1">No open tasks.</p> : d.tasks.map((t) => (
              <div key={t.id} className="rounded border border-base-800 px-2.5 py-2">
                <div className="text-sm text-gray-700">{t.body}</div>
                {t.dueAt && <div className="text-[11px] text-amber-600 mt-0.5">due {fmtDate(t.dueAt)}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><span className="panel-title">High-priority leads</span><Link to="/crm/leads" className="eyebrow-accent hover:underline">VIEW ALL</Link></div>
          <div className="p-3 space-y-1.5">
            {d.hotLeads.map((c) => (
              <Link key={c.id} to="/crm/leads" className="flex items-center justify-between rounded border border-base-800 px-2.5 py-2 hover:bg-base-850">
                <div><div className="text-sm font-medium text-ink">{c.name}</div><div className="text-[11px] text-gray-400">{c.city}, {c.state}</div></div>
                <div className="flex items-center gap-1.5"><GeoBadge tier={c.geoTier} /><ScoreChip score={c.priorityScore} disqualified={c.disqualified} /></div>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><span className="panel-title">Support & activity</span></div>
          <div className="p-3">
            <div className="space-y-1.5">
              {d.ticketsByStatus.map((t) => (
                <div key={t.name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 capitalize">{t.name}</span><span className="badge badge-gray">{t.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-base-800 pt-2.5">
              <div className="eyebrow mb-1.5">Activity volume</div>
              {d.byActivity.length === 0 ? <p className="text-sm text-gray-400">No activity.</p> : d.byActivity.map((a) => (
                <div key={a.name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 capitalize">{a.name}</span><span className="font-mono tabular-nums text-ink">{a.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
