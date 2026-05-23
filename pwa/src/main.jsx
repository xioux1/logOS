import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Global reset — minimal, intentional
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; color: #e8e8e8; }
  button:focus-visible, textarea:focus-visible, input:focus-visible {
    outline: 1px solid #4ade80;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
