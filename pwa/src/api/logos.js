import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({ baseURL: BASE_URL });

// Attach stored token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('logos_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export function setToken(token) {
  localStorage.setItem('logos_token', token);
}

export function getToken() {
  return localStorage.getItem('logos_token');
}

export async function postLog(text) {
  const res = await api.post('/api/logs', { text });
  return res.data;
}

export async function getLogs(params = {}) {
  const res = await api.get('/api/logs', { params });
  return res.data;
}

export async function getMemory() {
  const res = await api.get('/api/memory');
  return res.data;
}

export async function deleteMemory() {
  const res = await api.delete('/api/memory');
  return res.data;
}

export async function getIntegrationStatus() {
  const res = await api.get('/api/integrations/status');
  return res.data;
}
