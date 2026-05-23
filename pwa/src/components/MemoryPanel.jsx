import { useState, useEffect } from 'react';
import { getMemory, deleteMemory } from '../api/logos.js';

export default function MemoryPanel() {
  const [open, setOpen] = useState(false);
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (open) fetchMemory();
  }, [open]);

  async function fetchMemory() {
    setLoading(true);
    try {
      const data = await getMemory();
      setMemory(data);
    } catch {
      setMemory(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!confirm('¿Borrar toda la memoria del asistente?')) return;
    setResetting(true);
    try {
      await deleteMemory();
      setMemory({ summary: null, raw_history: [] });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div style={styles.container}>
      <button style={styles.toggle} onClick={() => setOpen((v) => !v)}>
        🧠 memoria {open ? '▲' : '▼'}
      </button>

      {open && (
        <div style={styles.panel}>
          {loading ? (
            <div style={styles.text}>cargando...</div>
          ) : memory?.summary ? (
            <div style={styles.text}>{memory.summary}</div>
          ) : (
            <div style={{ ...styles.text, color: '#444' }}>sin resumen todavía</div>
          )}

          <button style={styles.resetBtn} onClick={handleReset} disabled={resetting}>
            {resetting ? 'borrando...' : 'reset memoria'}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { marginBottom: 24 },
  toggle: {
    background: 'transparent',
    border: '1px solid #222',
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 12,
    padding: '4px 10px',
    cursor: 'pointer',
    borderRadius: 2,
    letterSpacing: 0.5,
  },
  panel: {
    marginTop: 8,
    background: '#0f0f0f',
    border: '1px solid #1e1e1e',
    borderRadius: 3,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  text: {
    fontFamily: 'sans-serif',
    fontSize: 13,
    color: '#aaa',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  resetBtn: {
    alignSelf: 'flex-start',
    background: 'transparent',
    border: '1px solid #3a1a1a',
    color: '#f87171',
    fontFamily: 'monospace',
    fontSize: 11,
    padding: '3px 10px',
    cursor: 'pointer',
    borderRadius: 2,
  },
};
