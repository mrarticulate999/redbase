import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, ErrorBanner, EmptyState, initials, colorFor } from '../components/ui';

const TAGS = ['General', 'Urgent', 'Client', 'Technical'];
const TAG_STYLE = {
  General: 'bg-gray-100 text-gray-600',
  Urgent: 'bg-red-50 text-red-700',
  Client: 'bg-blue-50 text-blue-700',
  Technical: 'bg-green-50 text-green-700',
};

function renderContent(text, usernames) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((p, i) => {
    if (p.startsWith('@') && usernames.has(p.slice(1).toLowerCase())) {
      return <span key={i} className="font-semibold text-accent-dim bg-accent-light px-1 rounded">{p}</span>;
    }
    return <span key={i}>{p}</span>;
  });
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Communications() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('General');
  const [posting, setPosting] = useState(false);
  const [filterTag, setFilterTag] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const firstLoad = useRef(true);
  const bottomRef = useRef(null);

  const usernameSet = new Set(users.map(u => u.username.toLowerCase()));

  const load = useCallback(async () => {
    try {
      const [{ messages }, { users }] = await Promise.all([api.get('/messages'), api.get('/users')]);
      setMessages(messages);
      setUsers(users);
      setError(null);
      if (firstLoad.current && messages.length) setSelectedId(messages[0].id);
    } catch (err) {
      if (firstLoad.current) setError(err);
    } finally {
      firstLoad.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [load]);

  async function post(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      const { message } = await api.post('/messages', { content: content.trim(), tag });
      setContent('');
      setTag('General');
      await load();
      setSelectedId(message?.id || null);
    } catch (err) { setError(err); }
    finally { setPosting(false); }
  }

  async function remove(id) {
    if (selectedId === id) setSelectedId(null);
    await api.del(`/messages/${id}`);
    load();
  }

  const filtered = filterTag ? messages.filter(m => m.tag === filterTag) : messages;
  const selected = messages.find(m => m.id === selectedId);

  if (loading) return <div className="p-8"><Spinner label="Loading…" /></div>;

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Left: thread list */}
      <div className="w-72 shrink-0 border-r border-base-700 flex flex-col bg-white">
        {/* Header + compose button */}
        <div className="p-4 border-b border-base-700">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-bold text-gray-900 text-base">Team Comms</h1>
            <button onClick={() => setSelectedId(null)} className="text-xs font-medium text-accent hover:text-accent-dim">+ New</button>
          </div>
          {/* Tag filters */}
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFilterTag('')}
              className={`badge text-[11px] ${!filterTag ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              All
            </button>
            {TAGS.map(t => (
              <button key={t} onClick={() => setFilterTag(f => f === t ? '' : t)}
                className={`badge text-[11px] ${filterTag === t ? TAG_STYLE[t] + ' border border-current/30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No messages</p>
          ) : (
            filtered.map(m => {
              const c = colorFor(m.author.username);
              const isSelected = selectedId === m.id;
              return (
                <button key={m.id} onClick={() => setSelectedId(m.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 border-b border-base-700/60 text-left transition-colors
                    ${isSelected ? 'bg-accent-light border-l-2 border-l-accent' : 'hover:bg-base-850'}`}>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: c + '22', color: c }}>
                    {initials(m.author.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-gray-800 truncate">{m.author.username}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(m.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`badge text-[10px] ${TAG_STYLE[m.tag]}`}>{m.tag}</span>
                      {m.replies?.length > 0 && <span className="text-[10px] text-gray-400">{m.replies.length} replies</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{m.content}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: selected thread or compose */}
      <div className="flex-1 flex flex-col bg-base-900 min-w-0">
        {!selectedId ? (
          // Compose new message
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-lg">
              <h2 className="text-lg font-bold text-gray-900 mb-1">New Message</h2>
              <p className="text-sm text-gray-400 mb-5">Post an update to the team board.</p>
              <ErrorBanner error={error} onRetry={load} />
              <form onSubmit={post} className="card p-5 space-y-4">
                <div>
                  <label className="label">Tag</label>
                  <div className="flex gap-2 flex-wrap">
                    {TAGS.map(t => (
                      <button type="button" key={t} onClick={() => setTag(t)}
                        className={`badge cursor-pointer text-xs border ${tag === t ? TAG_STYLE[t] + ' border-current/40 shadow-sm' : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea className="input min-h-[120px] resize-y"
                    placeholder={`Share an update… use @${users[0]?.username || 'username'} to mention a teammate`}
                    value={content} onChange={e => setContent(e.target.value)} autoFocus />
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary" disabled={posting || !content.trim()}>
                    {posting ? 'Posting…' : 'Post to Board'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : selected ? (
          // Thread view
          <ThreadView
            message={selected}
            usernameSet={usernameSet}
            currentUser={user}
            onDelete={() => remove(selected.id)}
            onReply={load}
          />
        ) : null}
      </div>
    </div>
  );
}

function ThreadView({ message, usernameSet, currentUser, onDelete, onReply }) {
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const canDelete = currentUser?.id === message.author.id || currentUser?.role === 'admin';
  const c = colorFor(message.author.username);

  async function submitReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await api.post(`/messages/${message.id}/replies`, { content: reply.trim() });
      setReply('');
      onReply();
    } finally { setBusy(false); }
  }

  const isMe = id => currentUser?.id === id;

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="border-b border-base-700 px-6 py-4 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: c + '22', color: c }}>
            {initials(message.author.username)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{message.author.username}</p>
            <p className="text-xs text-gray-400">{timeAgo(message.createdAt)}</p>
          </div>
          <span className={`badge ${TAG_STYLE[message.tag]} ml-2`}>{message.tag}</span>
        </div>
        {canDelete && (
          <button onClick={onDelete} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Delete thread</button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Original message */}
        <div className={`flex gap-3 ${isMe(message.author.id) ? 'flex-row-reverse' : ''}`}>
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: c + '22', color: c }}>
            {initials(message.author.username)}
          </div>
          <div className={`max-w-[70%] ${isMe(message.author.id) ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${isMe(message.author.id) ? 'bg-accent text-white rounded-tr-sm' : 'bg-white border border-base-700 text-gray-800 rounded-tl-sm'}`}>
              {renderContent(message.content, usernameSet)}
            </div>
          </div>
        </div>

        {/* Replies */}
        {message.replies?.map(r => {
          const rc = colorFor(r.author.username);
          const mine = isMe(r.author.id);
          return (
            <div key={r.id} className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: rc + '22', color: rc }}>
                {initials(r.author.username)}
              </div>
              <div className={`max-w-[70%] flex flex-col gap-0.5 ${mine ? 'items-end' : ''}`}>
                <span className="text-[11px] text-gray-400 px-1">{r.author.username} · {timeAgo(r.createdAt)}</span>
                <div className={`rounded-2xl px-4 py-2.5 text-sm
                  ${mine ? 'bg-accent text-white rounded-tr-sm' : 'bg-white border border-base-700 text-gray-800 rounded-tl-sm'}`}>
                  {renderContent(r.content, usernameSet)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      <div className="border-t border-base-700 px-6 py-4 bg-white">
        <form onSubmit={submitReply} className="flex gap-2">
          <input className="input flex-1" placeholder="Reply to thread…"
            value={reply} onChange={e => setReply(e.target.value)} />
          <button className="btn-primary px-4" disabled={busy || !reply.trim()}>
            {busy ? '…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
