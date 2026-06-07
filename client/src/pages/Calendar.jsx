import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Spinner, ErrorBanner, EmptyState, Modal, colorFor } from '../components/ui';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TIMEFRAME_LABELS = { short: 'Short-term (0–3 mo)', mid: 'Mid-term (3–12 mo)', long: 'Long-term (1–3 yr)' };
const TIMEFRAME_COLORS = { short: 'bg-accent-light text-accent-dim border-accent/30', mid: 'bg-brand-blue-light text-brand-blue-dim border-brand-blue/30', long: 'bg-purple-50 text-purple-700 border-purple-200' };
const STATUS_COLORS = { planned: 'bg-gray-100 text-gray-600', 'in-progress': 'bg-blue-50 text-blue-700', done: 'bg-green-50 text-green-700' };
const PRIORITY_COLORS = { High: 'bg-red-500', Medium: 'bg-amber-400', Low: 'bg-green-500' };

function fmtTime(iso, allDay) {
  if (!iso || allDay) return 'All day';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Returns array of 35 or 42 cells for the month grid
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ── Events sub-tab ─────────────────────────────────────────────────────────
function EventsCalendar({ status, onConnect, onDisconnect }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connected = status?.connected;

  // Fetch events for the month currently in view (not a fixed 2-week window).
  const loadMonth = useCallback(async () => {
    if (!connected) return;
    setLoading(true); setError(null);
    try {
      const timeMin = new Date(year, month, 1).toISOString();
      const timeMax = new Date(year, month + 1, 1).toISOString();
      const { events } = await api.get(
        `/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`
      );
      setEvents(events);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }, [connected, year, month]);

  useEffect(() => { loadMonth(); }, [loadMonth]);

  const cells = buildMonthGrid(year, month);

  function eventsForDay(day) {
    if (!day) return [];
    return events.filter(e => e.start && isSameDay(new Date(e.start), day));
  }

  const selectedEvents = eventsForDay(selected);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  if (!status?.configured) return (
    <EmptyState title="Google Calendar not configured" hint="Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment to enable this module." />
  );

  if (!status?.connected) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-16 w-16 rounded-2xl bg-base-850 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Connect Google Calendar</h3>
      <p className="text-gray-400 text-sm mb-6 text-center max-w-xs">
        Authorize read-only access to display your team's events.
      </p>
      <button className="btn-primary" onClick={onConnect}>Connect Google Calendar</button>
    </div>
  );

  return (
    <div className="flex gap-5 h-full">
      {/* Grid */}
      <div className="flex-1 card overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-base-700">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-base-850 text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
          </button>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            {MONTHS[month]} {year}
            {loading && <span className="text-[10px] font-normal text-gray-400 animate-pulse">loading…</span>}
          </h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-base-850 text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
          </button>
        </div>
        {error && <div className="px-5 pt-3"><ErrorBanner error={error} onRetry={loadMonth} /></div>}

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-base-700">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 flex-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="border-r border-b border-base-700 bg-base-900/40 min-h-[80px]" />;
            const dayEvents = eventsForDay(day);
            const isToday = isSameDay(day, today);
            const isSel = isSameDay(day, selected);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelected(day)}
                className={`text-left border-r border-b border-base-700 min-h-[80px] p-1.5 transition-colors
                  ${isSel ? 'bg-accent-light' : 'hover:bg-base-850'}`}
              >
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1
                  ${isToday ? 'bg-accent text-white' : isSel ? 'text-accent-dim' : 'text-gray-600'}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} className="rounded text-[10px] px-1 py-0.5 truncate font-medium"
                      style={{ backgroundColor: colorFor(e.organizer) + '22', color: colorFor(e.organizer) }}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-gray-400 px-1">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <div className="card p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">
              {selected.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <a href="https://calendar.google.com/calendar/u/0/r/eventedit" target="_blank" rel="noreferrer"
              className="text-xs text-accent hover:text-accent-dim font-medium">+ New</a>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No events</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(e => {
                const c = colorFor(e.organizer);
                return (
                  <div key={e.id} className="rounded-lg border border-base-700 bg-base-900 p-3"
                    style={{ borderLeftWidth: 3, borderLeftColor: c }}>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{e.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtTime(e.start, e.allDay)}{!e.allDay && e.end ? ` – ${fmtTime(e.end, false)}` : ''}
                    </p>
                    <p className="text-xs mt-1 font-medium" style={{ color: c }}>{e.organizer}</p>
                    {e.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{e.description}</p>}
                    {e.htmlLink && (
                      <a href={e.htmlLink} target="_blank" rel="noreferrer"
                        className="text-xs text-brand-blue hover:underline mt-1 block">View in Google →</a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={onDisconnect} className="btn-ghost text-xs py-1.5 text-gray-400">
          Disconnect Google Calendar
        </button>
      </div>
    </div>
  );
}

// ── Tasks Calendar sub-tab ──────────────────────────────────────────────────
function TasksCalendar() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today);

  useEffect(() => {
    api.get('/tasks').then(setTasks).catch(setError).finally(() => setLoading(false));
  }, []);

  const cells = buildMonthGrid(year, month);

  function tasksForDay(day) {
    if (!day) return [];
    return tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day) && t.status !== 'Done');
  }

  const selectedTasks = tasksForDay(selected);

  if (loading) return <Spinner label="Loading tasks…" />;
  if (error) return <ErrorBanner error={error} />;

  return (
    <div className="flex gap-5">
      <div className="flex-1 card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-base-700">
          <button onClick={() => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); }}
            className="p-1.5 rounded-lg hover:bg-base-850 text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
          </button>
          <h2 className="text-sm font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
          <button onClick={() => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); }}
            className="p-1.5 rounded-lg hover:bg-base-850 text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-7 border-b border-base-700">
          {WEEKDAYS.map(d => <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="border-r border-b border-base-700 bg-base-900/40 min-h-[80px]" />;
            const dayTasks = tasksForDay(day);
            const isToday = isSameDay(day, today);
            const isSel = isSameDay(day, selected);
            const hasOverdue = dayTasks.some(t => t.priority === 'High');
            return (
              <button key={day.toISOString()} onClick={() => setSelected(day)}
                className={`text-left border-r border-b border-base-700 min-h-[80px] p-1.5 transition-colors ${isSel ? 'bg-accent-light' : 'hover:bg-base-850'}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1
                  ${isToday ? 'bg-accent text-white' : isSel ? 'text-accent-dim' : 'text-gray-600'}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 2).map(t => (
                    <div key={t.id} className="flex items-center gap-1 rounded text-[10px] px-1 py-0.5 bg-base-850">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${PRIORITY_COLORS[t.priority]}`} />
                      <span className="truncate text-gray-700">{t.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 2 && <div className="text-[10px] text-gray-400 px-1">+{dayTasks.length - 2} more</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="w-72 shrink-0 card p-4 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">
          {selected.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        {selectedTasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No tasks due</p>
        ) : (
          <div className="space-y-2">
            {selectedTasks.map(t => (
              <div key={t.id} className="rounded-lg border border-base-700 bg-base-900 p-3">
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${PRIORITY_COLORS[t.priority]}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.status} · {t.priority} priority</p>
                    {t.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Planning Calendar sub-tab ───────────────────────────────────────────────
const MILESTONE_CATEGORIES = ['Client Delivery', 'Business Development', 'Internal', 'Revenue'];
const CAT_COLORS = {
  'Client Delivery': 'bg-blue-100 text-blue-700',
  'Business Development': 'bg-green-100 text-green-700',
  'Internal': 'bg-gray-100 text-gray-600',
  'Revenue': 'bg-amber-100 text-amber-700',
};

function PlanningCalendar() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', date: '', category: 'Client Delivery', timeframe: 'short', description: '', status: 'planned' });

  const load = useCallback(() => {
    setLoading(true);
    api.get('/milestones').then(setMilestones).catch(setError).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm({ title: '', date: '', category: 'Client Delivery', timeframe: 'short', description: '', status: 'planned' }); setShowModal(true); }
  function openEdit(m) { setEditing(m); setForm({ title: m.title, date: m.date?.split('T')[0] || '', category: m.category, timeframe: m.timeframe, description: m.description || '', status: m.status }); setShowModal(true); }

  async function save() {
    try {
      if (editing) await api.patch(`/milestones/${editing.id}`, form);
      else await api.post('/milestones', form);
      setShowModal(false); load();
    } catch (err) { setError(err); }
  }
  async function remove(id) {
    if (!confirm('Delete this milestone?')) return;
    await api.del(`/milestones/${id}`); load();
  }

  if (loading) return <Spinner label="Loading milestones…" />;
  if (error) return <ErrorBanner error={error} onRetry={load} />;

  const byTimeframe = { short: [], mid: [], long: [] };
  milestones.forEach(m => (byTimeframe[m.timeframe] ||= []).push(m));

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="btn-primary">+ Add Milestone</button>
      </div>
      <div className="space-y-6">
        {Object.entries(byTimeframe).map(([tf, items]) => (
          <div key={tf}>
            <div className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border mb-3 ${TIMEFRAME_COLORS[tf]}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {TIMEFRAME_LABELS[tf]}
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 px-2">No milestones — <button onClick={openNew} className="text-accent hover:underline">add one</button></p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.sort((a, b) => new Date(a.date) - new Date(b.date)).map(m => (
                  <div key={m.id} className="card p-4 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge text-[11px] ${CAT_COLORS[m.category] || 'bg-gray-100 text-gray-600'}`}>{m.category}</span>
                          <span className={`badge text-[11px] ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm leading-snug">{m.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        {m.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{m.description}</p>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => openEdit(m)} className="p-1 rounded hover:bg-base-850 text-gray-400 hover:text-gray-700">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                        <button onClick={() => remove(m.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Milestone' : 'New Milestone'}>
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Milestone title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Timeframe</label>
              <select className="input" value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))}>
                <option value="short">Short-term</option>
                <option value="mid">Mid-term</option>
                <option value="long">Long-term</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {MILESTONE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes…" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save Milestone</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Main Calendar page ──────────────────────────────────────────────────────
const TABS = [
  { id: 'events', label: 'Events' },
  { id: 'tasks', label: 'Task Due Dates' },
  { id: 'planning', label: 'Business Planning' },
];

export default function Calendar() {
  const [tab, setTab] = useState('events');
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState(null);

  const loadStatus = useCallback(async () => {
    setStatusError(null);
    try {
      const st = await api.get('/calendar/status');
      setStatus(st);
    } catch (err) { setStatusError(err); }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const googleParam = params.get('google');
  useEffect(() => {
    if (googleParam) { setParams({}, { replace: true }); loadStatus(); }
  }, [googleParam, setParams, loadStatus]);

  async function connect() {
    try { const { url } = await api.get('/calendar/oauth/url'); window.location.href = url; }
    catch (err) { setStatusError(err); }
  }
  async function disconnect() {
    await api.del('/calendar/disconnect'); loadStatus();
  }

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Events, deadlines, and business milestones</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-base-850 p-1 rounded-xl mb-5 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
              ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'events' && (
          statusError ? <ErrorBanner error={statusError} onRetry={loadStatus} />
          : status === null ? <Spinner label="Loading calendar…" />
          : <EventsCalendar status={status} onConnect={connect} onDisconnect={disconnect} />
        )}
        {tab === 'tasks' && <TasksCalendar />}
        {tab === 'planning' && <PlanningCalendar />}
      </div>
    </div>
  );
}
