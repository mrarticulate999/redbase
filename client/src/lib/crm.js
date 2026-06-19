// CRM client API + small display helpers. Wraps the shared `api` fetch client.
import { api } from './api';

export const crmApi = {
  // companies
  listCompanies: (params = '') => api.get(`/crm/companies${params}`),
  getCompany: (id) => api.get(`/crm/companies/${id}`),
  createCompany: (b) => api.post('/crm/companies', b),
  updateCompany: (id, b) => api.patch(`/crm/companies/${id}`, b),
  deleteCompany: (id) => api.del(`/crm/companies/${id}`),
  recalcCompanies: () => api.post('/crm/companies/recalculate', {}),
  // contacts
  listContacts: (params = '') => api.get(`/crm/contacts${params}`),
  createContact: (b) => api.post('/crm/contacts', b),
  // deals
  listDeals: () => api.get('/crm/deals'),
  createDeal: (b) => api.post('/crm/deals', b),
  updateDeal: (id, b) => api.patch(`/crm/deals/${id}`, b),
  // activities
  listActivities: (relatedType, relatedId) => api.get(`/crm/activities?relatedType=${relatedType}&relatedId=${relatedId}`),
  createActivity: (b) => api.post('/crm/activities', b),
  updateActivity: (id, b) => api.patch(`/crm/activities/${id}`, b),
  deleteActivity: (id) => api.del(`/crm/activities/${id}`),
  // tickets
  listTickets: () => api.get('/crm/tickets'),
  createTicket: (b) => api.post('/crm/tickets', b),
  updateTicket: (id, b) => api.patch(`/crm/tickets/${id}`, b),
  // control plane
  listStages: () => api.get('/crm/stages'),
  listSegments: () => api.get('/crm/segments'),
  createSegment: (b) => api.post('/crm/segments', b),
  deleteSegment: (id) => api.del(`/crm/segments/${id}`),
  getScoringConfig: () => api.get('/crm/scoring-config'),
  updateScoringConfig: (weights) => api.patch('/crm/scoring-config', { weights }),
  prospectingStatus: () => api.get('/crm/prospecting/status'),
  runProspecting: (b = {}) => api.post('/crm/prospecting/run', b),
  dashboard: () => api.get('/crm/dashboard'),
};

export const SERVICE_LABELS = {
  posture_assessment: 'Posture Assessment',
  red_teaming: 'Red Teaming',
  remediation: 'Remediation',
  ai_enablement: 'AI Enablement',
};
export const SERVICE_LADDER = ['posture_assessment', 'red_teaming', 'remediation', 'ai_enablement'];

export const PERSONA_LABELS = {
  economic_buyer: 'Economic Buyer',
  champion: 'Champion / Gatekeeper',
  it: 'IT',
  other: 'Other',
};

export const GEO_LABELS = {
  dmv_core: 'DMV Core',
  dmv_state: 'DMV State',
  adjacent: 'Near DMV',
  us: 'US-wide',
};

export const LEAD_STATUS_LABELS = {
  new: 'New', working: 'Working', nurture: 'Nurture', converted: 'Converted', disqualified: 'Disqualified',
};

export function scoreTier(score) {
  if (score >= 80) return { label: 'A', tone: 'badge-green', name: 'Hot' };
  if (score >= 60) return { label: 'B', tone: 'badge-amber', name: 'Warm' };
  if (score >= 40) return { label: 'C', tone: 'badge-blue', name: 'Cool' };
  return { label: 'D', tone: 'badge-gray', name: 'Cold' };
}

export function fmtMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
}
export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function timeSince(iso) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3.6e6);
  if (h < 1) return `${Math.max(0, Math.floor(ms / 6e4))}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// CSV helpers (dependency-free) — segment export.
export function toCSV(rows, cols) {
  if (!rows.length) return '';
  const c = cols || Object.keys(rows[0]);
  const esc = (v) => {
    if (v == null) return '';
    const s = Array.isArray(v) ? v.join('; ') : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [c.join(','), ...rows.map((r) => c.map((k) => esc(r[k])).join(','))].join('\n');
}
export function downloadCSV(name, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name.endsWith('.csv') ? name : `${name}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
