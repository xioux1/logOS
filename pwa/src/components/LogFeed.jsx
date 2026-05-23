import { useState } from 'react';

const TYPE_COLORS = {
  task: '#60a5fa',
  note: '#a78bfa',
  event: '#fb923c',
  session_log: '#4ade80',
  reminder: '#facc15',
};

const PRIORITY_COLORS = {
  high: '#f87171',
  medium: '#fb923c',
  low: '#6b7280',
};

function EntryBadges({ entry }) {
  return (
    <div style={styles.badgeRow}>
      {entry.type && (
        <span style={{ ...styles.badge, color: TYPE_COLORS[entry.type] || '#e8e8e8', borderColor: TYPE_COLORS[entry.type] || '#333' }}>
          {entry.type}
        </span>
      )}
      {entry.priority && (
        <span style={{ ...styles.badge, color: PRIORITY_COLORS[entry.priority] || '#e8e8e8', borderColor: PRIORITY_COLORS[entry.priority] || '#333' }}>
          {entry.priority}
        </span>
      )}
      {(entry.tags || []).map((tag) => (
        <span key={tag} style={styles.tagBadge}>#{tag}</span>
      ))}
    </div>
  );
}

function LogItem({ log }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(log.created_at);

  return (
    <div style={styles.logItem}>
      <div style={styles.logHeader}>
        <span style={styles.rawText}>{log.raw_text}</span>
        <span style={styles.timestamp}>
          {date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}{' '}
          {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {log.structured_entries?.length > 0 && (
        <div style={styles.entries}>
          {log.structured_entries.map((entry) => (
            <div key={entry.id} style={styles.entry}>
              <div style={styles.entryTitle}>{entry.title}</div>
              <EntryBadges entry={entry} />
              {entry.scheduled_at && (
                <div style={styles.scheduled}>
                  {new Date(entry.scheduled_at).toLocaleString('es-AR')}
                </div>
              )}
              <button
                style={styles.expandBtn}
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? '▲ menos' : '▼ metadata'}
              </button>
              {expanded && (
                <pre style={styles.metadata}>
                  {JSON.stringify(entry.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LogFeed({ logs, loading }) {
  if (loading) {
    return <div style={styles.empty}>cargando...</div>;
  }
  if (!logs || logs.length === 0) {
    return <div style={styles.empty}>sin entradas todavía</div>;
  }
  return (
    <div style={styles.feed}>
      {logs.map((log) => (
        <LogItem key={log.id} log={log} />
      ))}
    </div>
  );
}

const styles = {
  feed: { display: 'flex', flexDirection: 'column', gap: 1 },
  logItem: {
    padding: '14px 0',
    borderBottom: '1px solid #1a1a1a',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  rawText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#e8e8e8',
    flex: 1,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  timestamp: { fontSize: 11, color: '#444', whiteSpace: 'nowrap', marginTop: 2 },
  entries: { display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12 },
  entry: {
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 3,
    padding: '8px 12px',
  },
  entryTitle: { fontSize: 13, color: '#c8c8c8', marginBottom: 4, fontWeight: 500 },
  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  badge: {
    fontSize: 11,
    padding: '1px 6px',
    border: '1px solid',
    borderRadius: 2,
    fontFamily: 'monospace',
  },
  tagBadge: {
    fontSize: 11,
    color: '#888',
    padding: '1px 4px',
    fontFamily: 'monospace',
  },
  scheduled: { fontSize: 11, color: '#fb923c', marginBottom: 4 },
  expandBtn: {
    background: 'transparent',
    border: 'none',
    color: '#555',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'monospace',
    padding: 0,
  },
  metadata: {
    marginTop: 6,
    background: '#0d0d0d',
    color: '#666',
    fontSize: 11,
    padding: 8,
    borderRadius: 2,
    overflowX: 'auto',
  },
  empty: { color: '#444', fontFamily: 'monospace', fontSize: 13, padding: '24px 0' },
};
