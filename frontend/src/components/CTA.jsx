export default function CTA() {
  return (
    <section className="cta" id="get-started">
      <div className="cta-inner">
        <span className="section-label">🚀 Get Started</span>
        <h2 className="cta-title">
          Ship your first <span className="gradient-text">agent negotiation</span> in minutes
        </h2>
        <p className="cta-desc">
          Clone the repo, start both agents, and watch AI-powered price negotiation happen in real time.
        </p>

        <div className="cta-code">
          <div className="cta-code-header">
            <span className="hero-terminal-dot" />
            <span className="hero-terminal-dot" />
            <span className="hero-terminal-dot" />
          </div>
          <div className="cta-code-body">
            <div><span className="comment"># Install dependencies</span></div>
            <div><span className="cmd">$</span> npm install</div>
            <div style={{ marginTop: '0.4rem' }}><span className="comment"># Start seller agent (terminal 1)</span></div>
            <div><span className="cmd">$</span> npm run seller</div>
            <div style={{ marginTop: '0.4rem' }}><span className="comment"># Start buyer agent (terminal 2)</span></div>
            <div><span className="cmd">$</span> npm run buyer</div>
            <div style={{ marginTop: '0.4rem' }}><span className="comment"># Launch the dashboard (terminal 3)</span></div>
            <div><span className="cmd">$</span> cd frontend && npm run dev</div>
          </div>
        </div>

        <div className="cta-actions">
          <a
            href="https://x402.heyelsa.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            ⚡ Get ELSA API Key
          </a>
          <a
            href="https://x402.heyelsa.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Read the Docs →
          </a>
        </div>
      </div>
    </section>
  );
}
