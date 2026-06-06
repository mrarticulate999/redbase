import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Spinner, ErrorBanner, EmptyState, PageHeader, colorFor } from '../components/ui';

function fmtTime(iso, allDay) {
  if (!iso) return '';
  if (allDay) return 'All day';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function dayKey(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Calendar() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(null); // { configured, connected }
  const [events, setEvents] = useState([]);
  const [weekStart, setWeekStart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const st = await api.get('/calendar/status');
      setStatus(st);
      if (st.connected) {
        const { events, weekStart } = await api.get('/calendar/events');
        setEvents(events);
        setWeekStart(weekStart);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Surface the OAuth redirect result, then clean the URL.
  const googleParam = params.get('google');
  useEffect(() => {
    if (googleParam) {
      setParams({}, { replace: true });
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleParam]);

  async function connect() {
    try {
      const { url } = await api.get('/calendar/oauth/url');
      window.location.href = url;
    } catch (err) {
      setError(err);
    }
  }

  async function disconnect() {
    await api.del('/calendar/disconnect');
    setEvents([]);
    load();
  }

  // Group events by day, split into this week / next week.
  const grouped = {};
  for (const e of events) {
    if (!e.start) continue;
    const key = dayKey(e.start);
    (grouped[key] ||= []).push(e);
  }
  const splitIndex = weekStart ? new Date(weekStart).getTime() + 7 * 86400000 : null;
  const thisWeek = [];
  const nextWeek = [];
  for (const e of events) {
    if (!e.start) continue;
    if (splitIndex && new Date(e.start).getTime() >= splitIndex) nextWeek.push(e);
    else thisWeek.push(e);
  }

  return (
    <div>
      <PageHeader title="Team Calendar" subtitle="This week & next week across the team">
        {status?.connected && (
          <>
            <a className="btn-ghost" href="https://calendar.google.com/calendar/u/0/r/eventedit" target="_blank" rel="noreferrer">
              + New event
            </a>
            <button className="btn-ghost" onClick={disconnect}>Disconnect</button>
          </>
        )}
      </PageHeader>

      {loading && <Spinner label="Loading calendar…" />}
      {!loading && error && <ErrorBanner error={error} onRetry={load} />}

      {!loading && !error && status && !status.configured && (
        <EmptyState
          title="Google Calendar not configured"
          hint="Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET on the server (see README) to enable this module."
        />
      )}

      {!loading && !error && status?.configured && !status.connected && (
        <div className="card p-10 text-center">
          <p className="text-gray-300 mb-1 font-medium">Connect your Google Calendar</p>
          <p className="text-sm text-gray-500 mb-5">
            Authorize read-only access to display this week and next week's events.
          </p>
          <button className="btn-primary" onClick={connect}>Connect Google Calendar</button>
          {googleParam === 'error' && (
            <p className="mt-4 text-sm text-accent-glow">Authorization failed — please try again.</p>
          )}
        </div>
      )}

      {!loading && !error && status?.connected && (
        <div className="space-y-8">
          <CalendarWeek title="This week" events={thisWeek} />
          <CalendarWeek title="Next week" events={nextWeek} />
        </div>
      )}
    </div>
  );
}

function CalendarWeek({ title, events }) {
  const byDay = {};
  for (const e of events) (byDay[dayKey(e.start)] ||= []).push(e);
  const days = Object.keys(byDay);

  return (
    <section>
      <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-3">{title}</h2>
      {days.length === 0 ? (
        <EmptyState title="No events scheduled" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {days.map((day) => (
            <div key={day} className="card p-4">
              <p className="text-sm font-semibold text-gray-200 mb-3">{day}</p>
              <ul className="space-y-2">
                {byDay[day].map((e) => {
                  const c = colorFor(e.organizer);
                  return (
                    <li key={e.id} className="rounded-lg bg-base-900 border border-base-700 p-2.5"
                      style={{ borderLeft: `3px solid ${c}` }}>
                      <p className="text-sm text-gray-100 font-medium leading-snug">{e.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmtTime(e.start, e.allDay)}
                        {e.end && !e.allDay ? ` – ${fmtTime(e.end)}` : ''}
                      </p>
                      <p className="text-xs mt-1" style={{ color: c }}>{e.organizer}</p>
                      {e.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{e.description}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
