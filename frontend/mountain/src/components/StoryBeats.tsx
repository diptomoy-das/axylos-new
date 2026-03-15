import { motion, useScroll, useTransform } from 'framer-motion';

export default function StoryBeats() {
  const { scrollYProgress } = useScroll();

  // STAGGERED FADE-INS FROM BOTTOM
  // Story Beat 1: 0 - 20%
  // Starts fully visible, then fades out as you reach 20%
  const beat1Opacity = useTransform(scrollYProgress, [0, 0.1, 0.20], [1, 1, 0]);
  const beat1Y = useTransform(scrollYProgress, [0, 0.20], [0, -50]);

  // Story Beat 2: 20 - 50%
  // Fades in starting around 25%, fully visible at 35%, fades out at 45-50%
  const beat2Opacity = useTransform(scrollYProgress, [0.22, 0.32, 0.45, 0.50], [0, 1, 1, 0]);
  const beat2Y = useTransform(scrollYProgress, [0.22, 0.32, 0.45, 0.50], [50, 0, 0, -50]);

  // Story Beat 3: 50 - 80%
  const beat3Opacity = useTransform(scrollYProgress, [0.52, 0.62, 0.75, 0.80], [0, 1, 1, 0]);
  const beat3Y = useTransform(scrollYProgress, [0.52, 0.62, 0.75, 0.80], [50, 0, 0, -50]);

  // Story Beat 4: 80 - 100%
  const beat4Opacity = useTransform(scrollYProgress, [0.82, 0.92, 1], [0, 1, 1]);
  const beat4Y = useTransform(scrollYProgress, [0.82, 0.92, 1], [50, 0, 0]);

  return (
    <div className="story-layer">
      
      {/* Beat 1: 0-20% (The Peak) */}
      <motion.div className="story-beat beat-1" style={{ opacity: beat1Opacity, y: beat1Y }}>
        <h1 className="headline-huge">THE SUMMIT</h1>
        <p className="subheadline">A HIGHER STANDARD</p>
      </motion.div>

      {/* Beat 2: 20-50% (The Reveal) */}
      <motion.div className="story-beat beat-2" style={{ opacity: beat2Opacity, y: beat2Y }}>
        <h2 className="desc-text">UNEARTH THE<br/>EXTRAORDINARY.</h2>
      </motion.div>

      {/* Beat 3: 50-80% (The Range) */}
      <motion.div className="story-beat beat-3" style={{ opacity: beat3Opacity, y: beat3Y }}>
        <h2 className="desc-text">A COLLECTION<br/>WITHOUT EQUAL.</h2>
        <ul className="peak-list">
          <li>ASPEN SNOWMASS</li>
          <li>JACKSON HOLE</li>
          <li>BIG SKY RESORT</li>
          <li>CHAMONIX</li>
          <li>NISEKO UNITED</li>
        </ul>
      </motion.div>

      {/* Beat 4: 80-100% (The CTA) */}
      <motion.div className="story-beat beat-4" style={{ opacity: beat4Opacity, y: beat4Y }}>
        <div className="cta-group">
          <button className="ghost-btn">Get Started</button>
          <button className="solid-btn">Learn More</button>
        </div>
      </motion.div>
      
    </div>
  );
}
