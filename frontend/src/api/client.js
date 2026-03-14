import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

export async function getHealth() {
  const { data } = await api.get('/health');
  return data;
}

export async function getBudgetStatus() {
  const { data } = await api.get('/budget/status');
  return data;
}

export async function getAgentStatus() {
  const { data } = await api.get('/agent/status');
  return data;
}

export async function getTokenPrice(token) {
  const { data } = await api.get(`/price/${token}`);
  return data;
}

export async function getPortfolio() {
  const { data } = await api.get('/portfolio');
  return data;
}

export async function getTrades() {
  const { data } = await api.get('/trades');
  return data;
}

export async function sendCommand(command) {
  const { data } = await api.post('/openclaw/command', { command });
  return data;
}

export default api;
