export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-brand-icon">⚡</span>
          Axylos Protocol
        </div>

        <ul className="footer-links">
          <li>
            <a href="https://x402.heyelsa.ai/" target="_blank" rel="noopener noreferrer">
              ELSA Dashboard
            </a>
          </li>
          <li>
            <a href="https://x402.heyelsa.ai/docs" target="_blank" rel="noopener noreferrer">
              API Docs
            </a>
          </li>
          <li>
            <a href="https://x402.heyelsa.ai/openclaw" target="_blank" rel="noopener noreferrer">
              Axylos
            </a>
          </li>
        </ul>

        <p className="footer-copy">
          Built for Hackathons · Ethereum · Agents · P2P Networks
        </p>
      </div>
    </footer>
  );
}
