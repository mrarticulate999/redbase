import { useState } from 'react';
import { PageHeader } from '../components/ui';

const SWARMS = [
  {
    id: 'marketing', name: 'Marketing', status: 'idle',
    ceo: 'Marketing CEO', workers: ['Content Writer', 'SEO Analyst', 'Brand Voice'],
    lastAction: 'Drafted LinkedIn post on LLM security trends',
    kpi: { label: 'Content pieces this week', value: 3 },
  },
  {
    id: 'sales', name: 'Sales & Outreach', status: 'waiting',
    ceo: 'Sales CEO', workers: ['Lead Generator', 'Qualifier', 'Draft Writer'],
    lastAction: 'Queued: draft outreach to 2 fintech prospects [PENDING APPROVAL]',
    kpi: { label: 'Leads in pipeline', value: 7 },
  },
  {
    id: 'intel', name: 'Threat Intelligence', status: 'running',
    ceo: 'Intel CEO', workers: ['Competitor Monitor', 'Technique Tracker'],
    lastAction: 'Scanning: new prompt injection vectors — CVE-2026-3341',
    kpi: { label: 'Threats tracked', value: 12 },
  },
  {
    id: 'bizdev', name: 'Investor & BizDev', status: 'idle',
    ceo: 'BizDev CEO', workers: ['Pipeline Tracker', 'Update Drafter'],
    lastAction: 'Queued: investor update email [PENDING APPROVAL]',
    kpi: { label: 'Active relationships', value: 4 },
  },
];

const META_AGENTS = [
  { name: 'Reflection / Learning', role: 'Observes outcomes, updates agent strategies', status: 'active', icon: '🔄' },
  { name: 'Swarm Optimizer', role: 'Monitors KPIs, cost, drift detection', status: 'active', icon: '📊' },
  { name: 'Agent Engineer', role: 'Adds/removes agents within caps', status: 'standby', icon: '⚙️' },
  { name: 'Coordinator', role: 'Shared company brief + inter-swarm routing', status: 'active', icon: '📡' },
  { name: 'Governor', role: 'Budget ceilings, loop breakers, human gates', status: 'active', icon: '🛡️' },
];

const APPROVAL_QUEUE = [
  { id: 1, swarm: 'Sales & Outreach', action: 'Send outreach email to FinTech startup X (CEO: Jordan Walsh)', type: 'External Communication', risk: 'Low' },
  { id: 2, swarm: 'Investor & BizDev', action: 'Send monthly investor update to 3 angel investors', type: 'External Communication', risk: 'Low' },
  { id: 3, swarm: 'Marketing', action: 'Publish LinkedIn article: "Top 5 LLM Vulnerabilities in 2026"', type: 'Public Content', risk: 'Medium' },
];

const COMMS_FEED = [
  { time: '14:32', from: 'Intel CEO', to: 'Coordinator', msg: 'New prompt injection pattern detected in GPT-based chatbots. Flagging for Marketing content angle.' },
  { time: '14:28', from: 'Coordinator', to: 'All Swarms', msg: 'Company brief updated: Priority this week is client delivery for Acme Corp engagement.' },
  { time: '14:15', from: 'Sales CEO', to: 'Governor', msg: 'Requesting approval for 2 outreach drafts. Awaiting human gate.' },
  { time: '14:02', from: 'Reflection Agent', to: 'Sales CEO', msg: 'Lesson applied: subject lines with "AI security" outperform "cybersecurity" by 23% in open rates.' },
  { time: '13:47', from: 'Optimizer', to: 'Intel CEO', msg: 'Swarm running efficiently. Cost burn: $0.84 today. Within budget.' },
  { time: '13:30', from: 'Marketing CEO', to: 'Content Writer', msg: 'Draft LinkedIn post on LLM Top 10 — use OWASP framing, target CISOs.' },
];

const LESSONS = [
  { agent: 'Reflection Agent', lesson: 'Cold outreach with case study references converts 3x better than generic security pitches.', date: 'Jun 6' },
  { agent: 'Reflection Agent', lesson: 'LinkedIn posts mentioning "prompt injection" get 40% more impressions than generic AI content.', date: 'Jun 4' },
  { agent: 'Optimizer', lesson: 'Routing competitor analysis to Haiku instead of Sonnet saves $0.30/day with equivalent output quality.', date: 'Jun 3' },
];

const STATUS_STYLES = {
  running: 'bg-accent/10 text-accent-dim border-accent/30',
  waiting: 'bg-amber-50 text-amber-700 border-amber-200',
  idle: 'bg-gray-100 text-gray-500 border-gray-200',
  active: 'text-accent-dim',
  standby: 'text-gray-400',
};

const STATUS_DOT = {
  running: 'bg-accent animate-pulse',
  waiting: 'bg-amber-400',
  idle: 'bg-gray-300',
  active: 'bg-accent',
  standby: 'bg-gray-300',
};

export default function SwarmOS() {
  const [approved, setApproved] = useState(new Set());
  const [rejected, setRejected] = useState(new Set());
  const [activeSection, setActiveSection] = useState('org');

  const pending = APPROVAL_QUEUE.filter(a => !approved.has(a.id) && !rejected.has(a.id));

  const SECTIONS = [
    { id: 'org', label: 'Org View' },
    { id: 'approvals', label: `Approvals${pending.length ? ` (${pending.length})` : ''}` },
    { id: 'comms', label: 'Comms Feed' },
    { id: 'lessons', label: 'Lessons' },
  ];

  return (
    <div className="p-4 lg:p-6">
      <PageHeader title="Swarm OS" subtitle="Agentic operations system — departmental AI swarms">
        <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1">
          ⚡ Phase 2 — Backend Coming Soon
        </span>
      </PageHeader>

      {/* Coming soon banner */}
      <div className="rounded-xl border border-brand-blue/30 bg-brand-blue-light p-4 mb-6 flex items-start gap-3">
        <svg className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-brand-blue-dim">Live backend not yet connected</p>
          <p className="text-sm text-brand-blue/80 mt-0.5">
            This interface shows the design and structure of your Swarm OS. The live LangGraph orchestration backend — agents, durable state, real-time feeds — is Phase 2. This shell is ready to wire up.
          </p>
        </div>
      </div>

      {/* Executive summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active Swarms', value: '4', sub: '1 running', color: 'text-accent' },
          { label: 'Pending Approvals', value: pending.length.toString(), sub: 'awaiting you', color: 'text-amber-600' },
          { label: 'Cost Today', value: '$0.84', sub: 'under budget', color: 'text-gray-900' },
          { label: 'Agent Actions', value: '23', sub: 'last 24h', color: 'text-brand-blue' },
        ].map(stat => (
          <div key={stat.label} className="card p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs font-semibold text-gray-700 mt-1">{stat.label}</p>
            <p className="text-xs text-gray-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-base-850 p-1 rounded-xl mb-6 w-fit">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
              ${activeSection === s.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Org View */}
      {activeSection === 'org' && (
        <div className="space-y-6">
          {/* Meta-agents */}
          <div>
            <p className="section-header mb-3">Cross-Cutting Meta-Agents</p>
            <div className="card overflow-hidden">
              <div className="divide-y divide-base-700">
                {META_AGENTS.map(a => (
                  <div key={a.name} className="flex items-center gap-4 px-5 py-3">
                    <span className="text-lg w-7 text-center">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                      <p className="text-xs text-gray-400 truncate">{a.role}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[a.status]}`} />
                      <span className={`text-xs font-medium capitalize ${STATUS_STYLES[a.status]}`}>{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Departmental swarms */}
          <div>
            <p className="section-header mb-3">Departmental Swarms</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SWARMS.map(swarm => (
                <div key={swarm.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{swarm.name}</h3>
                    <span className={`badge text-[10px] border ${STATUS_STYLES[swarm.status]} capitalize`}>{swarm.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[swarm.status]}`} />
                    <p className="text-xs text-gray-500 font-medium">{swarm.ceo}</p>
                  </div>
                  <div className="space-y-1 mb-3">
                    {swarm.workers.map(w => (
                      <div key={w} className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="h-px w-3 bg-gray-200" />
                        {w}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-base-850 p-2.5 border border-base-700 mb-3">
                    <p className="text-[11px] text-gray-500 leading-relaxed">{swarm.lastAction}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-900">{swarm.kpi.value}</span>
                    <span className="text-[11px] text-gray-400">{swarm.kpi.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approvals */}
      {activeSection === 'approvals' && (
        <div>
          <p className="section-header mb-3">Pending Human Approvals</p>
          {pending.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="font-semibold text-gray-700">Queue is clear</p>
              <p className="text-sm text-gray-400">No actions awaiting your approval.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(item => (
                <div key={item.id} className="card p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500">{item.swarm}</span>
                      <span className="badge badge-gray">{item.type}</span>
                      {item.risk === 'Medium' && <span className="badge badge-amber">Medium risk</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setRejected(r => new Set([...r, item.id]))} className="btn-ghost py-1.5 text-xs">Reject</button>
                    <button onClick={() => setApproved(a => new Set([...a, item.id]))} className="btn-primary py-1.5 text-xs">Approve</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(approved.size > 0 || rejected.size > 0) && (
            <div className="mt-4 space-y-2">
              {[...approved].map(id => {
                const item = APPROVAL_QUEUE.find(a => a.id === id);
                return item && (
                  <div key={id} className="card p-3 flex items-center gap-3 opacity-60">
                    <span className="badge badge-green">Approved</span>
                    <p className="text-xs text-gray-500 truncate">{item.action}</p>
                  </div>
                );
              })}
              {[...rejected].map(id => {
                const item = APPROVAL_QUEUE.find(a => a.id === id);
                return item && (
                  <div key={id} className="card p-3 flex items-center gap-3 opacity-60">
                    <span className="badge badge-red">Rejected</span>
                    <p className="text-xs text-gray-500 truncate">{item.action}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Comms Feed */}
      {activeSection === 'comms' && (
        <div>
          <p className="section-header mb-3">Inter-Agent Communications</p>
          <div className="card overflow-hidden">
            <div className="divide-y divide-base-700">
              {COMMS_FEED.map((msg, i) => (
                <div key={i} className="px-5 py-3 font-mono text-xs">
                  <span className="text-gray-400">[{msg.time}]</span>{' '}
                  <span className="text-accent-dim font-semibold">{msg.from}</span>
                  <span className="text-gray-400"> → </span>
                  <span className="text-brand-blue font-semibold">{msg.to}</span>
                  <p className="text-gray-600 mt-1 pl-12 font-sans">{msg.msg}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lessons */}
      {activeSection === 'lessons' && (
        <div>
          <p className="section-header mb-3">Reflection Agent — Lessons Learned</p>
          <div className="space-y-3">
            {LESSONS.map((l, i) => (
              <div key={i} className="card p-4 flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-base">💡</span>
                </div>
                <div>
                  <p className="text-sm text-gray-800">{l.lesson}</p>
                  <p className="text-xs text-gray-400 mt-1">{l.agent} · {l.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
