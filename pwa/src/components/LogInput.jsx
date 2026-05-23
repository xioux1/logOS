import { useState, useRef } from 'react';

const TOOL_LABELS = {
  save_structured_entry: '💾 Entrada guardada',
  create_calendar_event: '📅 Evento en Calendar',
  log_to_discriminador: '📚 Sesión en Discriminador',
  update_memory: '🧠 Memoria actualizada',
};

export default function LogInput({ onLogCreated }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastTools, setLastTools] = useState([]);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setError(null);
    setLastTools([]);

    try {
      const { postLog } = await import('../api/logos.js');
      const result = await postLog(text.trim());
      setText('');
      setLastTools(result.tools_used || []);
      onLogCreated?.(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la entrada');
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="¿Qué querés registrar?"
          style={styles.textarea}
          rows={4}
          disabled={loading}
          autoFocus
        />
        <div style={styles.footer}>
          <span style={styles.hint}>Enter para enviar · Shift+Enter para nueva línea</span>
          <button type="submit" style={styles.button} disabled={loading || !text.trim()}>
            {loading ? 'procesando...' : 'enviar'}
          </button>
        </div>
      </form>

      {loading && (
        <div style={styles.thinking}>
          <span style={styles.thinkingDot}>●</span> pensando...
        </div>
      )}

      {lastTools.length > 0 && (
        <div style={styles.toolsRow}>
          {lastTools.map((t, i) => (
            <span key={i} style={styles.toolBadge}>
              {TOOL_LABELS[t.tool] || t.tool}
            </span>
          ))}
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

const styles = {
  container: { width: '100%' },
  form: { display: 'flex', flexDirection: 'column', gap: 8 },
  textarea: {
    width: '100%',
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: 4,
    color: '#e8e8e8',
    fontFamily: 'monospace',
    fontSize: 15,
    padding: '12px 14px',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    lineHeight: 1.6,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hint: { fontSize: 11, color: '#555' },
  button: {
    background: 'transparent',
    border: '1px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    fontSize: 13,
    padding: '6px 16px',
    cursor: 'pointer',
    borderRadius: 2,
    letterSpacing: 1,
  },
  thinking: {
    marginTop: 8,
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  thinkingDot: {
    color: '#4ade80',
    animation: 'pulse 1s infinite',
  },
  toolsRow: {
    marginTop: 8,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  toolBadge: {
    background: '#1a2a1a',
    border: '1px solid #2a4a2a',
    color: '#4ade80',
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 2,
    fontFamily: 'monospace',
  },
  error: {
    marginTop: 8,
    color: '#f87171',
    fontSize: 13,
    fontFamily: 'monospace',
  },
};
