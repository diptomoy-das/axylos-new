const steps = [
  {
    number: '01',
    title: 'Discover',
    desc: 'Peers find each other on the encrypted UDP mesh network. Automatic broadcast-based discovery with instant handshakes and AES-256 encrypted channels.',
  },
  {
    number: '02',
    title: 'Negotiate',
    desc: 'AI agents autonomously negotiate the service price. Gap analysis drives counter-offers until both parties accept — typically in under 5 rounds.',
  },
  {
    number: '03',
    title: 'Settle',
    desc: 'Payment is requested via HTTP 402, verified against the blockchain, and permanently recorded on-chain. Trustless, instant, and auditable.',
  },
];

export default function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="how-inner">
        <div className="how-header">
          <span className="section-label">🔄 Workflow</span>
          <h2 className="section-title">
            Three steps to <span className="gradient-text">trustless settlement</span>
          </h2>
          <p className="section-subtitle">
            From peer discovery to on-chain settlement in seconds — fully automated, fully decentralized.
          </p>
        </div>

        <div className="how-steps">
          {steps.map((s, i) => (
            <div key={i} className="how-step">
              <div className="how-step-number">{s.number}</div>
              <h3 className="how-step-title">{s.title}</h3>
              <p className="how-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
