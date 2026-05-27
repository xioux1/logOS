import { useState, useEffect, useCallback } from 'react';
import LogInput from './components/LogInput.jsx';
import LogFeed from './components/LogFeed.jsx';
import MemoryPanel from './components/MemoryPanel.jsx';
import IntegrationStatus from './components/IntegrationStatus.jsx';
import { getLogs, setToken, getToken } from './api/logos.js';

export default function App() {
  const [logs, setLogs] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [token, setTokenState] = useState(getToken() || '');
  const [tokenInput, setTokenInput] = useState('');

  const fetchLogs = useCallback(async () => {
    if (!getToken()) return;
    setFeedLoading(true);
    try {
      const data = await getLogs({ limit: 30 });
      setLogs(data.logs || []);
    } catch {
      // silently fail — user may not be authenticated yet
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleLogCreated(result) {
    // Prepend the new log to the feed without a full reload
    const newLog = {
      id: result.log_id,
      raw_text: result.raw_text,
      created_at: new Date().toISOString(),
      structured_entries: result.structured_entries || [],
    };
    setLogs((prev) => [newLog, ...prev]);
  }

  function handleSetToken(e) {
    e.preventDefault();
    setToken(tokenInput.trim());
    setTokenState(tokenInput.trim());
    fetchLogs();
  }

  if (!token) {
    return (
      <div style={styles.tokenScreen}>
        <div style={styles.tokenBox}>
          <div style={styles.logo}>LogOS</div>
          <p style={styles.tokenHint}>
            Ingresá tu API key para conectarte
          </p>
          <form onSubmit={handleSetToken} style={styles.tokenForm}>
            <input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="API key..."
              style={styles.tokenInput}
              type="password"
              autoFocus
            />
            <button type="submit" style={styles.tokenBtn}>
              conectar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <span style={styles.logo}>LogOS</span>
        <IntegrationStatus />
      </header>

      <main style={styles.main}>
        <MemoryPanel />
        <LogInput onLogCreated={handleLogCreated} />
        <div style={styles.feedSection}>
          <div style={styles.feedLabel}>entradas recientes</div>
          <LogFeed logs={logs} loading={feedLoading} />
        </div>
      </main>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#e8e8e8',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    borderBottom: '1px solid #111',
  },
  logo: {
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: 18,
    color: '#4ade80',
    letterSpacing: 2,
  },
  main: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  feedSection: { display: 'flex', flexDirection: 'column', gap: 8 },
  feedLabel: { fontSize: 11, color: '#444', fontFamily: 'monospace', letterSpacing: 1 },

  // Token screen
  tokenScreen: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenBox: {
    width: 400,
    padding: 32,
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  tokenHint: { fontSize: 13, color: '#666', margin: 0 },
  tokenForm: { display: 'flex', gap: 8 },
  tokenInput: {
    flex: 1,
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: 2,
    color: '#e8e8e8',
    fontFamily: 'monospace',
    fontSize: 13,
    padding: '7px 10px',
    outline: 'none',
  },
  tokenBtn: {
    background: 'transparent',
    border: '1px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    fontSize: 12,
    padding: '6px 14px',
    cursor: 'pointer',
    borderRadius: 2,
  },
};
