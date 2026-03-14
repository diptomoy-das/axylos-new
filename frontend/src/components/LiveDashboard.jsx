import { useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { getHealth, getBudgetStatus, getTokenPrice } from '../api/client';

const ENDPOINTS = [
  { method: 'GET', path: '/health' },
  { method: 'GET', path: '/price/:token' },
  { method: 'GET', path: '/portfolio' },
  { method: 'GET', path: '/budget/status' },
  { method: 'POST', path: '/trade/propose' },
  { method: 'POST', path: '/negotiate' },
  { method: 'POST', path: '/openclaw/command' },
  { method: 'GET', path: '/yield/suggestions' },
];

export default function LiveDashboard() {
  const healthFetcher = useCallback(() => getHealth(), []);
  const budgetFetcher = useCallback(() => getBudgetStatus(), []);
  const wethFetcher = useCallback(() => getTokenPrice('WETH'), []);
  const usdcFetcher = useCallback(() => getTokenPrice('USDC'), []);

  const health = useApi(healthFetcher, 6000);
  const budget = useApi(budgetFetcher, 8000);
  const wethPrice = useApi(wethFetcher, 10000);
  const usdcPrice = useApi(usdcFetcher, 10000);

  const isOnline = !health.error && health.data?.status === 'healthy';

  const formatPrice = (priceData) => {
    if (!priceData || priceData.error) return '—';
    const p = priceData.price;
    if (!p) return '—';
    const n = typeof p === 'string' ? parseFloat(p) : p;
    if (isNaN(n)) return '—';
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (!isOnline && !health.loading) {
    return (
      <section className="dashboard" id="dashboard">
        <div className="dashboard-inner">
          <div className="dashboard-header">
            <span className="section-label">📡 Live Dashboard</span>
            <h2 className="section-title">
              Real-time <span className="gradient-text">agent monitoring</span>
            </h2>
          </div>
          <div className="glass-card dashboard-offline">
            <div className="dashboard-offline-icon">📡</div>
            <h3 className="dashboard-offline-title">Backend Offline</h3>
            <p className="dashboard-offline-desc">
              The Axylos agent server is not running. Start it to see live data here.
            </p>
            <div className="dashboard-offline-cmd">npm run dev</div>
          </div>
        </div>
      </section>
    );
  }

  const sessionData = budget.data?.session;

  return (
    <section className="dashboard" id="dashboard">
      <div className="dashboard-inner">
        <div className="dashboard-header">
          <span className="section-label">📡 Live Dashboard</span>
          <h2 className="section-title">
            Real-time <span className="gradient-text">agent monitoring</span>
          </h2>
          <p className="section-subtitle">
            Connected to the running Axylos agent. Data refreshes automatically every few seconds.
          </p>
        </div>

        {/* Stat cards */}
        <div className="dashboard-grid">
          <div className="glass-card stat-card">
            <div className="stat-label">Status</div>
            <div className="stat-value green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
              Online
            </div>
            <div className="stat-detail">
              {health.data?.agentType?.toUpperCase()} · {health.data?.chain}
            </div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-label">Uptime</div>
            <div className="stat-value blue">
              {formatUptime(health.data?.uptime)}
            </div>
            <div className="stat-detail">Since server start</div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-label">API Calls</div>
            <div className="stat-value purple">
              {sessionData?.api_calls ?? '—'}
            </div>
            <div className="stat-detail">
              ${(sessionData?.spent_today_usd ?? 0).toFixed(4)} spent
            </div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-label">Budget Left</div>
            <div className="stat-value amber">
              ${(sessionData?.remaining_usd ?? 2).toFixed(2)}
            </div>
            <div className="stat-detail">Daily limit $2.00</div>
          </div>
        </div>

        {/* Panels */}
        <div className="dashboard-panels">
          {/* Token Prices */}
          <div className="glass-card panel">
            <div className="panel-title">
              <span className="live-dot" />
              Live Token Prices
            </div>
            <div className="price-row">
              <span className="price-token">🔷 WETH</span>
              <span className="price-value">{formatPrice(wethPrice.data)}</span>
            </div>
            <div className="price-row">
              <span className="price-token">🟢 USDC</span>
              <span className="price-value">{formatPrice(usdcPrice.data)}</span>
            </div>
            <div className="price-row">
              <span className="price-token">👛 Wallet</span>
              <span className="price-value" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                {health.data?.walletAddress
                  ? `${health.data.walletAddress.slice(0, 6)}…${health.data.walletAddress.slice(-4)}`
                  : '—'}
              </span>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="glass-card panel">
            <div className="panel-title">🔌 API Endpoints</div>
            <div className="endpoint-list">
              {ENDPOINTS.map((ep, i) => (
                <div key={i} className="endpoint-row">
                  <span className={`endpoint-method ${ep.method.toLowerCase()}`}>
                    {ep.method}
                  </span>
                  <span className="endpoint-path">{ep.path}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
