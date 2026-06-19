// Tiny zero-dependency markdown renderer. Handles the subset our roadmap docs
// use: headings, bold, inline code, links, unordered/ordered lists (with one
// level of nesting), blockquotes, horizontal rules, and paragraphs.

function renderInline(text, keyPrefix) {
  // Split on **bold**, `code`, and [label](url) while keeping delimiters.
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return tokens.filter(Boolean).map((tok, i) => {
    const key = `${keyPrefix}-${i}`;
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return <strong key={key} className="font-semibold text-gray-900">{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return <code key={key} className="font-mono text-[12px] bg-base-850 text-accent-dim rounded px-1 py-0.5">{tok.slice(1, -1)}</code>;
    }
    const link = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return <a key={key} href={link[2]} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline">{link[1]}</a>;
    }
    return <span key={key}>{tok}</span>;
  });
}

export default function Markdown({ source = '', className = '' }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let list = null; // { ordered, items: [{ text, indent }] }

  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={`l-${blocks.length}`} className={`my-2 space-y-1 ${list.ordered ? 'list-decimal' : 'list-disc'} pl-5 text-sm text-gray-600`}>
        {list.items.map((it, i) => (
          <li key={i} className={it.indent ? 'ml-5' : ''}>{renderInline(it.text, `li-${blocks.length}-${i}`)}</li>
        ))}
      </Tag>
    );
    list = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (!line.trim()) { flushList(); return; }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) { flushList(); blocks.push(<hr key={`hr-${idx}`} className="my-4 border-base-700" />); return; }

    // Headings
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      const cls = {
        1: 'text-lg font-bold text-gray-900 mt-5 mb-2',
        2: 'text-base font-bold text-gray-900 mt-5 mb-2',
        3: 'text-sm font-semibold text-gray-900 mt-4 mb-1.5',
        4: 'text-[13px] font-semibold text-gray-700 mt-3 mb-1',
      }[level];
      const Tag = `h${Math.min(level + 1, 6)}`;
      blocks.push(<Tag key={`h-${idx}`} className={cls}>{renderInline(h[2], `h-${idx}`)}</Tag>);
      return;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      flushList();
      blocks.push(
        <blockquote key={`q-${idx}`} className="my-2 border-l-2 border-accent/50 bg-accent-light/40 pl-3 py-1.5 text-sm text-gray-600 italic">
          {renderInline(line.trim().replace(/^>\s?/, ''), `q-${idx}`)}
        </blockquote>
      );
      return;
    }

    // List items (-, *, or 1.)  — detect nesting by leading spaces
    const indent = raw.length - raw.trimStart().length;
    const ul = line.trim().match(/^[-*]\s+(.*)$/);
    const ol = line.trim().match(/^\d+\.\s+(.*)$/);
    if (ul || ol) {
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; }
      list.items.push({ text: (ul ? ul[1] : ol[1]), indent: indent >= 2 });
      return;
    }

    // Paragraph
    flushList();
    blocks.push(<p key={`p-${idx}`} className="my-2 text-sm leading-relaxed text-gray-600">{renderInline(line, `p-${idx}`)}</p>);
  });
  flushList();

  return <div className={className}>{blocks}</div>;
}
