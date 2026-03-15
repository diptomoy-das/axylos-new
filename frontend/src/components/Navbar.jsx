import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        <a href="#" className="navbar-logo" style={{ color: '#ffffff' }}>
          Axylos
        </a>

        <ul className="navbar-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#dashboard">Live Dashboard</a></li>
          <li><a href="#architecture">Architecture</a></li>
        </ul>

        <div className="navbar-cta">
          <a
            href="https://x402.heyelsa.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-white"
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem' }}
          >
            Docs
          </a>
          <a href="#get-started" className="btn btn-black" style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem' }}>
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
}
