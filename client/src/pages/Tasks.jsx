import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBanner, PageHeader, Modal, initials, colorFor } from '../components/ui';

const COLUMNS = [
  { key: 'Backlog', label: 'Backlog' },
  { key: 'InProgress', label: 'In Progress' },
  { key: 'Review', label: 'Review' },
  { key: 'Done', label: 'Done' },
];
const PRIORITY_STYLE = {
  High: 'bg-accent/20 text-accent-glow',
  Medium: 'bg-amber-500/20 text-amber-300',
  Low: 'bg-base-700 text-gray-400',
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ tasks }, { users }, { clients }] = await Promise.all([
        api.get('/tasks'),
        api.get('/users'),
        api.get('/clients'),
      ]);
      setTasks(tasks);
      setUsers(users);
      setClients(clients);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = tasks.filter(
    (t) =>
      (!filterAssignee || t.assigneeId === filterAssignee) &&
      (!filterClient || t.clientId === filterClient)
  );

  async function moveTask(id, status) {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    // Optimistic update.
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await api.patch(`/tasks/${id}`, { status });
    } catch (err) {
      setError(err);
      load();
    }
  }

  async function remove(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try { await api.del(`/tasks/${id}`); } catch (err) { setError(err); load(); }
  }

  if (loading) return <Spinner label="Loading board…" />;

  return (
    <div>
      <PageHeader title="Team Tasks" subtitle="Kanban board · drag cards between columns">
        <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          + New task
        </button>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-5">
        <select className="input max-w-[200px]" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
          <option value="">All assignees</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
        </select>
        <select className="input max-w-[200px]" value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
          <option value="">All clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(filterAssignee || filterClient) && (
          <button className="btn-ghost" onClick={() => { setFilterAssignee(''); setFilterClient(''); }}>Clear</button>
        )}
      </div>

      <ErrorBanner error={error} onRetry={load} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const colTasks = visible.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId) moveTask(dragId, col.key); setDragId(null); }}
              className="bg-base-900/60 rounded-xl border border-base-700 p-3 min-h-[120px]"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-sm font-semibold text-gray-200">{col.label}</span>
                <span className="badge bg-base-700 text-gray-400">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onDragStart={() => setDragId(t.id)}
                    onEdit={() => { setEditing(t); setModalOpen(true); }}
                    onDelete={() => remove(t.id)}
                  />
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-4">Drop tasks here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        users={users}
        clients={clients}
        editing={editing}
        onSaved={() => { setModalOpen(false); load(); }}
      />
    </div>
  );
}

function TaskCard({ task, onDragStart, onEdit, onDelete }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="card bg-base-850 p-3 cursor-grab active:cursor-grabbing hover:border-base-600"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-100 font-medium leading-snug">{task.title}</p>
        <span className={`badge ${PRIORITY_STYLE[task.priority]}`}>{task.priority}</span>
      </div>
      {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {task.client && <span className="badge bg-blue-500/15 text-blue-300">{task.client.name}</span>}
        {task.dueDate && (
          <span className={`text-xs ${overdue ? 'text-accent-glow' : 'text-gray-500'}`}>
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task.assignee && (
          <span className="ml-auto h-6 w-6 rounded-full grid place-items-center text-[10px] font-semibold"
            style={{ background: `${colorFor(task.assignee.username)}33`, color: colorFor(task.assignee.username) }}
            title={task.assignee.username}>
            {initials(task.assignee.username)}
          </span>
        )}
      </div>

      <div className="flex gap-3 mt-2 pt-2 border-t border-base-700">
        <button onClick={onEdit} className="text-xs text-gray-500 hover:text-gray-200">Edit</button>
        <button onClick={onDelete} className="text-xs text-gray-500 hover:text-accent">Delete</button>
      </div>
    </div>
  );
}

function TaskModal({ open, onClose, users, clients, editing, onSaved }) {
  const blank = { title: '', description: '', assigneeId: '', clientId: '', status: 'Backlog', priority: 'Medium', dueDate: '' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setErr(null);
      setForm(editing
        ? {
            title: editing.title,
            description: editing.description || '',
            assigneeId: editing.assigneeId || '',
            clientId: editing.clientId || '',
            status: editing.status,
            priority: editing.priority,
            dueDate: editing.dueDate ? editing.dueDate.slice(0, 10) : '',
          }
        : blank);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const payload = {
      title: form.title,
      description: form.description,
      assigneeId: form.assigneeId || null,
      clientId: form.clientId || null,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    };
    try {
      if (editing) await api.patch(`/tasks/${editing.id}`, payload);
      else await api.post('/tasks', payload);
      onSaved();
    } catch (e2) {
      setErr(e2);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit task' : 'New task'}>
      <form onSubmit={save} className="space-y-4">
        {err && <ErrorBanner error={err} />}
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[70px]" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Assignee</label>
            <select className="input" value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)}>
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Client</label>
            <select className="input" value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
              <option value="">None</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Due date</label>
            <input type="date" className="input" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save task'}</button>
        </div>
      </form>
    </Modal>
  );
}
