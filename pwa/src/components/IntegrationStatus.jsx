import { useState, useEffect } from 'react';
import { getIntegrationStatus } from '../api/logos.js';

export default function IntegrationStatus() {
  const [integrations, setIntegrations] = useState(null);

  useEffect(() => {
    getIntegrationStatus()
      .then((data) => setIntegrations(data.integrations))
      .catch(() => setIntegrations(null));
  }, []);

  if (!integrations) return null;

  return (
    <div style={styles.container}>
      {Object.entries(integrations).map(([key, info]) => (
        <span key={key} style={styles.item}>
          <span
            style={{
              ...styles.dot,
              background: info.connected ? '#4ade80' : '#555',
              boxShadow: info.connected ? '0 0 4px #4ade80' : 'none',
            }}
          />
          <span style={styles.label}>{info.label}</span>
        </span>
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    display: 'inline-block',
  },
  label: {
    fontSize: 11,
    color: '#555',
    fontFamily: 'monospace',
  },
};
