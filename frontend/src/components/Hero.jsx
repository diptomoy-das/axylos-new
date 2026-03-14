export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-grid-bg" />

      <div className="hero-content">
        <div className="hero-badge fade-in-up">
          <span className="hero-badge-dot" />
          Powered by ELSA X402 Micropayments
        </div>

        <h1 className="hero-title fade-in-up fade-in-up-delay-1">
          <span className="hero-title-line">Autonomous Agent</span>
          <span className="hero-title-line gradient-text">Negotiation Protocol</span>
        </h1>

        <p className="hero-description fade-in-up fade-in-up-delay-2">
          AI agents autonomously negotiate service prices, settle payments via HTTP&nbsp;402, 
          and record transactions on-chain — all through an encrypted P2P mesh network. 
          No intermediaries. No trust required.
        </p>

        <div className="hero-actions fade-in-up fade-in-up-delay-3">
          <a href="#dashboard" className="btn btn-primary">
            ◉ View Live Dashboard
          </a>
          <a
            href="https://x402.heyelsa.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Read Documentation →
          </a>
        </div>

        <div className="hero-terminal fade-in-up fade-in-up-delay-4">
          <div className="hero-terminal-header">
            <span className="hero-terminal-dot" />
            <span className="hero-terminal-dot" />
            <span className="hero-terminal-dot" />
            <span className="hero-terminal-title">terminal — bash</span>
          </div>
          <div className="hero-terminal-body">
            <div><span className="comment"># Start the seller agent</span></div>
            <div><span className="cmd">$</span> npm run seller</div>
            <div style={{ marginTop: '0.5rem' }}><span className="comment"># Query a live token price</span></div>
            <div><span className="cmd">$</span> curl <span className="url">http://localhost:8080</span><span className="flag">/price/WETH</span></div>
            <div style={{ marginTop: '0.5rem' }}><span className="comment"># Initiate an AI-powered negotiation</span></div>
            <div><span className="cmd">$</span> curl <span className="flag">-X POST</span> <span className="url">http://localhost:8080</span><span className="flag">/negotiate</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
