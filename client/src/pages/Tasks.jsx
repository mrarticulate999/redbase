import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorBanner, Modal, initials, colorFor } from '../components/ui';

const COLUMNS = [
  { key: 'Backlog', label: 'Backlog', color: 'text-gray-500', dot: 'bg-gray-300' },
  { key: 'InProgress', label: 'In Progress', color: 'text-blue-600', dot: 'bg-blue-400' },
  { key: 'Review', label: 'Review', color: 'text-amber-600', dot: 'bg-amber-400' },
  { key: 'Done', label: 'Done', color: 'text-accent-dim', dot: 'bg-accent' },
];
const PRIORITY_STYLE = {
  High: 'bg-red-50 text-red-700 border-red-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ tasks }, { users }, { clients }] = await Promise.all([
        api.get('/tasks'), api.get('/users'), api.get('/clients'),
      ]);
      setTasks(tasks); setUsers(users); setClients(clients); setError(null);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = tasks.filter(t =>
    (!filterAssignee || t.assigneeId === filterAssignee) &&
    (!filterClient || t.clientId === filterClient)
  );

  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done');

  async function moveTask(id, status) {
    const task = tasks.find(t => t.id === id);
    if (!task || task.status === status) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    try { await api.patch(`/tasks/${id}`, { status }); }
    catch (err) { setError(err); load(); }
  }

  async function remove(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await api.del(`/tasks/${id}`); } catch (err) { setError(err); load(); }
  }

  if (loading) return <div className="p-8"><Spinner label="Loading board…" /></div>;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kanban board · drag cards between columns</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          + New Task
        </button>
      </div>

      {/* Overdue banner */}
      {overdueTasks.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span><strong>{overdueTasks.length}</strong> overdue task{overdueTasks.length !== 1 ? 's' : ''} need attention</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select className="input max-w-[180px] py-1.5 text-sm" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
          <option value="">All assignees</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
        </select>
        <select className="input max-w-[180px] py-1.5 text-sm" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
          <option value="">All clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(filterAssignee || filterClient) && (
          <button className="btn-ghost py-1.5 text-sm" onClick={() => { setFilterAssignee(''); setFilterClient(''); }}>Clear filters</button>
        )}
      </div>

      <ErrorBanner error={error} onRetry={load} />

      {/* Kanban */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map(col => {
          const colTasks = visible.filter(t => t.status === col.key);
          const isDropTarget = dragOver === col.key;
          return (
            <div key={col.key}
              onDragOver={e => { e.preventDefault(); setDragOver(col.key); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => { if (dragId) moveTask(dragId, col.key); setDragId(null); setDragOver(null); }}
              className={`rounded-xl border-2 transition-all ${isDropTarget ? 'border-accent/40 bg-accent-light/30' : 'border-base-700 bg-base-900/50'}`}>
              {/* Column header */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                <span className="ml-auto badge bg-white border border-base-700 text-gray-500 text-[11px]">{colTasks.length}</span>
              </div>

              <div className="px-2 pb-3 space-y-2 min-h-[80px]">
                {colTasks.map(t => (
                  <TaskCard key={t.id} task={t}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => { setDragId(null); setDragOver(null); }}
                    onEdit={() => { setEditing(t); setModalOpen(true); }}
                    onDelete={() => remove(t.id)}
                  />
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-5">
                    {isDropTarget ? 'Drop here' : 'No tasks'}
                  </p>
                )}
                {/* Quick add */}
                <button onClick={() => { setEditing({ status: col.key }); setModalOpen(true); }}
                  className="w-full text-xs text-gray-400 hover:text-accent hover:bg-white rounded-lg px-3 py-1.5 transition-colors text-left">
                  + Add task
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)}
        users={users} clients={clients} editing={editing}
        onSaved={() => { setModalOpen(false); load(); }} />
    </div>
  );
}

function TaskCard({ task, onDragStart, onDragEnd, onEdit, onDelete }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
  const c = task.assignee ? colorFor(task.assignee.username) : '#9CA3AF';

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      className="bg-white rounded-xl border border-base-700 p-3 cursor-grab active:cursor-grabbing hover:shadow-card-hover hover:border-base-600 transition-all group">
      <div className="flex items-start gap-2 mb-2">
        <p className="flex-1 text-sm font-semibold text-gray-900 leading-snug">{task.title}</p>
        <span className={`badge text-[10px] border shrink-0 ${PRIORITY_STYLE[task.priority]}`}>{task.priority}</span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        {task.client && (
          <span className="badge bg-brand-blue-light text-brand-blue-dim text-[10px]">{task.client.name}</span>
        )}
        {task.dueDate && (
          <span className={`text-[11px] font-medium ${overdue ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded' : 'text-gray-400'}`}>
            {overdue ? '⚠ ' : ''}{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-base-700 pt-2 mt-1">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: c + '22', color: c }}>
              {initials(task.assignee.username)}
            </div>
            <span className="text-[11px] text-gray-400">{task.assignee.username}</span>
          </div>
        ) : <span className="text-[11px] text-gray-300">Unassigned</span>}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="text-[11px] text-gray-400 hover:text-brand-blue font-medium">Edit</button>
          <button onClick={onDelete} className="text-[11px] text-gray-400 hover:text-red-500 font-medium">Delete</button>
        </div>
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
      setForm(editing ? {
        title: editing.title || '',
        description: editing.description || '',
        assigneeId: editing.assigneeId || '',
        clientId: editing.clientId || '',
        status: editing.status || 'Backlog',
        priority: editing.priority || 'Medium',
        dueDate: editing.dueDate ? editing.dueDate.slice(0, 10) : '',
      } : blank);
    }
  }, [open, editing]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErr(null);
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
      if (editing?.id) await api.patch(`/tasks/${editing.id}`, payload);
      else await api.post('/tasks', payload);
      onSaved();
    } catch (e2) { setErr(e2); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing?.id ? 'Edit Task' : 'New Task'}>
      <form onSubmit={save} className="space-y-4">
        {err && <ErrorBanner error={err} />}
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[70px]" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional details…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Assignee</label>
            <select className="input" value={form.assigneeId} onChange={e => set('assigneeId', e.target.value)}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Client</label>
            <select className="input" value={form.clientId} onChange={e => set('clientId', e.target.value)}>
              <option value="">None</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="Backlog">Backlog</option>
              <option value="InProgress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Due Date</label>
            <input type="date" className="input" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Task'}</button>
        </div>
      </form>
    </Modal>
  );
}
