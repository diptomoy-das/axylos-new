import { motion, useScroll, useTransform } from 'framer-motion';

interface StoryBeatsProps {
  target: React.RefObject<HTMLElement | null>;
}

export default function StoryBeats({ target }: StoryBeatsProps) {
  const { scrollYProgress } = useScroll({
    target: target,
    offset: ["start start", "end end"]
  });

  // STAGGERED FADE-INS
  
  // Story Beat 1: THE REVEAL (0 - 30%)
  const revealOpacity = useTransform(scrollYProgress, [0.02, 0.12, 0.25, 0.32], [0, 1, 1, 0]);
  const revealY = useTransform(scrollYProgress, [0.02, 0.12, 0.25, 0.32], [50, 0, 0, -50]);

  // Story Beat 2: THE RANGE (35 - 65%)
  const rangeOpacity = useTransform(scrollYProgress, [0.35, 0.45, 0.60, 0.68], [0, 1, 1, 0]);
  const rangeY = useTransform(scrollYProgress, [0.35, 0.45, 0.60, 0.68], [50, 0, 0, -50]);

  // Story Beat 3: AXYLOS (72 - 100%)
  const axylosOpacity = useTransform(scrollYProgress, [0.72, 0.85, 1], [0, 1, 1]);
  const axylosY = useTransform(scrollYProgress, [0.72, 0.85, 1], [50, 0, 0]);

  return (
    <div className="story-layer">
      
      {/* Beat 1: THE REVEAL */}
      <motion.div className="story-beat beat-reveal" style={{ opacity: revealOpacity, y: revealY }}>
        <h2 className="desc-text">UNEARTH THE<br/>EXTRAORDINARY.</h2>
      </motion.div>

      {/* Beat 2: THE RANGE */}
      <motion.div className="story-beat beat-range" style={{ opacity: rangeOpacity, y: rangeY }}>
        <h2 className="desc-text">A COLLECTION<br/>WITHOUT EQUAL.</h2>
        <ul className="peak-list">
          <li>ENCRYPTED P2P MESH</li>
          <li>AUTONOMOUS NEGOTIATION</li>
          <li>HTTP 402 PAYMENTS</li>
          <li>BLOCKCHAIN SETTLEMENT</li>
          <li>ELSA INTEGRATION</li>
        </ul>
      </motion.div>

      {/* Beat 3: AXYLOS */}
      <motion.div className="story-beat beat-axylos" style={{ opacity: axylosOpacity, y: axylosY }}>
        <h1 className="headline-huge">AXYLOS</h1>
        <p className="subheadline">Autonomous Agent<br/>Negotiation Protocol</p>
        <div className="cta-group" style={{ marginTop: '32px' }}>
          <button className="solid-btn">Get Started</button>
          <a href="#dashboard" className="ghost-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            ◉ View Live Dashboard
          </a>
        </div>
      </motion.div>
      
    </div>
  );
}
