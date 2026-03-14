const features = [
  {
    icon: '🤖',
    color: 'blue',
    title: 'Agentic Negotiation',
    desc: 'AI agents autonomously negotiate prices using game theory — gap analysis, counter-offers, and acceptance logic powered by Groq LLMs with rule-based fallbacks.',
  },
  {
    icon: '🔐',
    color: 'green',
    title: 'Encrypted P2P Mesh',
    desc: 'AES-256-CBC encrypted UDP mesh network for decentralized peer discovery and message broadcasting. No central server required.',
  },
  {
    icon: '💳',
    color: 'purple',
    title: 'HTTP 402 Payments',
    desc: 'Standards-based payment challenges using RFC 7231 HTTP 402 status codes. Challenge-response verification with automatic expiration.',
  },
  {
    icon: '⛓️',
    color: 'amber',
    title: 'Blockchain Settlement',
    desc: 'Trustless on-chain settlement via Ethereum (Base, Sepolia, Mainnet). Transaction signing with ethers.js and permanent audit trails.',
  },
  {
    icon: '🌐',
    color: 'cyan',
    title: 'Multi-Chain Support',
    desc: 'Supports Base, Ethereum, Arbitrum, Optimism, Polygon, BSC, Avalanche, and zkSync. Switch chains with a single config flag.',
  },
  {
    icon: '💬',
    color: 'red',
    title: 'Natural Language Commands',
    desc: 'Axylos NLP interface — type "Check price of WETH" or "Show my portfolio" and the agent routes to the correct ELSA API endpoint.',
  },
];

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="features-inner">
        <div className="features-header">
          <span className="section-label">⚡ Core Features</span>
          <h2 className="section-title">
            Everything you need for<br />
            <span className="gradient-text">autonomous trading</span>
          </h2>
          <p className="section-subtitle">
            A complete protocol stack for decentralized AI-powered service negotiation, 
            payment, and on-chain settlement.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="glass-card feature-card">
              <div className={`feature-icon ${f.color}`}>{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
