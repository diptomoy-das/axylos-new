import React, { useRef } from 'react';
import SequencePlayer from './SequencePlayer';
import StoryBeats from './StoryBeats';

export default function MountainScroll() {
  const containerRef = useRef(null);

  return (
    <section className="scroll-container" ref={containerRef}>
      {/* The sticky player stays on screen as you scroll down the container */}
      <SequencePlayer target={containerRef} />
      
      {/* The text overlays that trigger based on scroll percentage of the main container */}
      <StoryBeats target={containerRef} />
    </section>
  );
}
