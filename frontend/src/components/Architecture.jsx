const DIAGRAM = `
┌─────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN LAYER                       │
│                  (Base · Ethereum · Polygon)                │
│             Settlement Contracts + Verification             │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
┌─────────┴─────────┐  ┌─┴──────────┐  ┌─┴───────────────────┐
│   SELLER AGENT    │  │   HTTP     │  │    BUYER AGENT      │
│   (Port 8080)     │  │   402      │  │    (Port 8081)      │
│                   │◄─┤  Handler   ├──►                     │
│ • AI Negotiator   │  └─┬──────────┘  │ • AI Negotiator     │
│ • AES-256 Crypto  │    │             │ • AES-256 Crypto    │
│ • Blockchain TX   │  ┌─┴──────────┐  │ • Blockchain TX     │
│ • ELSA X402 API   │  │   UDP      │  │ • ELSA X402 API     │
└───────────────────┘  │   Mesh     │  └─────────────────────┘
                       │  Network   │
                       └────────────┘
`;

const layers = [
  {
    title: 'Presentation',
    items: ['React Landing Page', 'REST API (Express)', 'CLI Interface'],
  },
  {
    title: 'Logic',
    items: ['Axylos Agent', 'ELSA X402 Client', 'Negotiation Engine'],
  },
  {
    title: 'Infrastructure',
    items: ['AES-256 Encryption', 'UDP Mesh Network', 'ethers.js / viem'],
  },
];

export default function Architecture() {
  return (
    <section className="architecture" id="architecture">
      <div className="arch-inner">
        <div className="arch-header">
          <span className="section-label">🏗️ Architecture</span>
          <h2 className="section-title">
            Built for <span className="gradient-text">decentralization</span>
          </h2>
          <p className="section-subtitle">
            A layered architecture connecting AI negotiation, encrypted networking, 
            and blockchain settlement into a single cohesive protocol.
          </p>
        </div>

        <div className="glass-card arch-diagram">
          <pre>{DIAGRAM}</pre>
        </div>

        <div className="arch-stack">
          {layers.map((l, i) => (
            <div key={i} className="glass-card arch-layer">
              <div className="arch-layer-title">{l.title}</div>
              <div className="arch-layer-items">
                {l.items.map((item, j) => (
                  <div key={j}>{item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
