import { useEffect, useRef, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';

const FRAME_COUNT = 239;

// Helper to get image path. We zero-pad the index to 3 digits.
const getFramePath = (index: number) => {
  const paddedIndex = String(index).padStart(3, '0');
  return `/assets/sequence/ezgif-frame-${paddedIndex}.jpg`;
};

interface SequencePlayerProps {
  target: React.RefObject<HTMLElement | null>;
}

export default function SequencePlayer({ target }: SequencePlayerProps) {
  const { scrollYProgress } = useScroll({
    target: target,
    offset: ["start start", "end end"]
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

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
      img.onerror = () => {
        if (isCancelled) return;
        console.error(`Failed to load frame ${i}`);
        setErrorCount(prev => prev + 1);
      };
      imagesRef.current[i - 1] = img;
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  // Total "progress" is loaded + failed
  const totalProcessed = loadedCount + errorCount;

  // initial paint when the first image is loaded
  useEffect(() => {
    if (loadedCount >= 1 && imagesRef.current[0] && canvasRef.current) {
      renderFrame(0);
    }
  }, [loadedCount]);

  // Handle scroll to update canvas frame
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (loadedCount < 10) return; // wait till at least some frames are loaded
    
    const maxIndex = FRAME_COUNT - 1;
    let frameIndex = Math.floor(latest * FRAME_COUNT);
    if (frameIndex > maxIndex) frameIndex = maxIndex;
    if (frameIndex < 0) frameIndex = 0;
    
    renderFrame(frameIndex);
  });

  const renderFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[index];
    if (!img || !img.complete || img.naturalWidth === 0) {
      // If this frame isn't ready, try to find the nearest previous loaded frame
      for (let i = index - 1; i >= 0; i--) {
        const prevImg = imagesRef.current[i];
        if (prevImg && prevImg.complete && prevImg.naturalWidth > 0) {
          drawToCanvas(canvas, ctx, prevImg);
          return;
        }
      }
      return;
    }

    drawToCanvas(canvas, ctx, img);
  };

  const drawToCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  return (
    <>
      {totalProcessed < FRAME_COUNT && (
        <div className="loader-wrapper" style={{ background: '#06090f', color: '#ffffff' }}>
          <p>Loading Axylos ({Math.round((totalProcessed / FRAME_COUNT) * 100)}%)</p>
          <div className="progress-bar-container" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="progress-bar" style={{ width: `${(totalProcessed / FRAME_COUNT) * 100}%`, background: '#58a6ff' }} />
          </div>
        </div>
      )}
      
      <div className="sticky-canvas-wrapper">
        <canvas ref={canvasRef} className="image-canvas" />
      </div>
    </>
  );
}
