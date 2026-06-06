import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, ErrorBanner, EmptyState, PageHeader, initials, colorFor } from '../components/ui';

const TAGS = ['General', 'Urgent', 'Client', 'Technical'];
const TAG_STYLE = {
  General: 'bg-base-700 text-gray-300',
  Urgent: 'bg-accent/20 text-accent-glow',
  Client: 'bg-blue-500/20 text-blue-300',
  Technical: 'bg-emerald-500/20 text-emerald-300',
};

// Highlight @mentions of known usernames.
function renderContent(text, usernames) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((p, i) => {
    if (p.startsWith('@') && usernames.has(p.slice(1).toLowerCase())) {
      return <span key={i} className="text-accent-glow font-medium">{p}</span>;
    }
    return <span key={i}>{p}</span>;
  });
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
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
  const firstLoad = useRef(true);

  const usernameSet = new Set(users.map((u) => u.username.toLowerCase()));

  const load = useCallback(async () => {
    try {
      const [{ messages }, { users }] = await Promise.all([
        api.get('/messages'),
        api.get('/users'),
      ]);
      setMessages(messages);
      setUsers(users);
      setError(null);
    } catch (err) {
      if (firstLoad.current) setError(err);
    } finally {
      firstLoad.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(id);
  }, [load]);

  async function post(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      await api.post('/messages', { content: content.trim(), tag });
      setContent('');
      setTag('General');
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setPosting(false);
    }
  }

  async function remove(id) {
    await api.del(`/messages/${id}`);
    load();
  }

  if (loading) return <Spinner label="Loading board…" />;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Team Communications" subtitle="Internal board · refreshes every 30s" />

      <form onSubmit={post} className="card p-4 mb-6 space-y-3">
        <textarea
          className="input min-h-[80px] resize-y"
          placeholder="Share an update… use @username to mention a teammate"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {TAGS.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTag(t)}
                className={`badge border ${tag === t ? 'border-accent ' + TAG_STYLE[t] : 'border-base-700 text-gray-500'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="btn-primary" disabled={posting || !content.trim()}>
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>

      <ErrorBanner error={error} onRetry={load} />

      {messages.length === 0 ? (
        <EmptyState title="No messages yet" hint="Be the first to post an update." />
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <MessageCard
              key={m.id}
              message={m}
              usernames={usernameSet}
              currentUser={user}
              onReply={load}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageCard({ message, usernames, currentUser, onReply, onDelete }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const canDelete = currentUser?.id === message.author.id || currentUser?.role === 'admin';

  async function submitReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await api.post(`/messages/${message.id}/replies`, { content: reply.trim() });
      setReply('');
      setReplyOpen(false);
      onReply();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4">
      <Header m={message} usernames={usernames} canDelete={canDelete} onDelete={() => onDelete(message.id)} />

      {message.replies?.length > 0 && (
        <div className="mt-3 ml-4 pl-4 border-l border-base-700 space-y-3">
          {message.replies.map((r) => (
            <Header key={r.id} m={r} usernames={usernames} small />
          ))}
        </div>
      )}

      <div className="mt-3">
        {replyOpen ? (
          <form onSubmit={submitReply} className="flex gap-2">
            <input
              className="input"
              placeholder="Write a reply…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              autoFocus
            />
            <button className="btn-primary px-3" disabled={busy}>Send</button>
            <button type="button" className="btn-ghost px-3" onClick={() => setReplyOpen(false)}>Cancel</button>
          </form>
        ) : (
          <button onClick={() => setReplyOpen(true)} className="text-xs text-gray-500 hover:text-accent-glow">
            Reply
          </button>
        )}
      </div>
    </div>
  );
}

function Header({ m, usernames, small, canDelete, onDelete }) {
  const c = colorFor(m.author.username);
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full grid place-items-center text-xs font-semibold"
          style={{ background: `${c}33`, color: c }}>
          {initials(m.author.username)}
        </div>
        <span className="text-sm text-gray-200">{m.author.username}</span>
        {!small && (
          <span className={`badge ${TAG_STYLE[m.tag]}`}>{m.tag}</span>
        )}
        <span className="text-xs text-gray-600">{timeAgo(m.createdAt)}</span>
        {canDelete && (
          <button onClick={onDelete} className="ml-auto text-xs text-gray-600 hover:text-accent">delete</button>
        )}
      </div>
      <p className={`mt-1.5 whitespace-pre-wrap text-gray-200 ${small ? 'text-sm' : ''} ${small ? 'ml-9' : 'ml-9'}`}>
        {renderContent(m.content, usernames)}
      </p>
    </div>
  );
}
