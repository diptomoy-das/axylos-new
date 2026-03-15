import { useEffect, useRef, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';

const FRAME_COUNT = 239;

// Helper to get image path. We zero-pad the index to 3 digits.
const getFramePath = (index: number) => {
  const paddedIndex = String(index).padStart(3, '0');
  return `/assets/sequence/ezgif-frame-${paddedIndex}.jpg`;
};

export default function SequencePlayer() {
  const { scrollYProgress } = useScroll();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);

  // Preload images
  useEffect(() => {
    let isCancelled = false;
    
    // We preload all 239 images
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        if (isCancelled) return;
        setLoadedCount(prev => prev + 1);
      };
      imagesRef.current[i - 1] = img;
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  // initial paint when the first image is loaded
  useEffect(() => {
    if (loadedCount >= 1 && imagesRef.current[0] && canvasRef.current) {
      renderFrame(0);
    }
  }, [loadedCount]);

  // Handle scroll to update canvas frame
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (loadedCount < FRAME_COUNT * 0.1) return; // wait till at least 10% load to start playing
    
    // Calculate which frame corresponds to the scroll progress
    // latest is 0 to 1.
    // Ensure we don't exceed max index.
    const maxIndex = FRAME_COUNT - 1;
    let frameIndex = Math.floor(latest * FRAME_COUNT);
    if (frameIndex > maxIndex) frameIndex = maxIndex;
    
    renderFrame(frameIndex);
  });

  const renderFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[index];
    if (!img || !img.complete) return;

    // Set canvas dimensions to match image to ensure high-res draw
    // Actually, setting dimensions on every frame can be slow, but let's see.
    // Better to set it once if all images are same size.
    if (canvas.width !== img.width || canvas.height !== img.height) {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  return (
    <>
      {loadedCount < FRAME_COUNT && (
        <div className="loader-wrapper">
          <p>Loading the Mountain ({Math.round((loadedCount / FRAME_COUNT) * 100)}%)</p>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${(loadedCount / FRAME_COUNT) * 100}%` }} />
          </div>
        </div>
      )}
      
      <div className="sticky-canvas-wrapper">
        <canvas ref={canvasRef} className="image-canvas" />
      </div>
    </>
  );
}
