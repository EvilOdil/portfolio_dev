import React, { useRef } from 'react';
import './MobilePanTilt.css';

export default function MobilePanTilt({ onPanTilt }: { onPanTilt: (dx: number, dy: number) => void }) {
  const panRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [feedback, setFeedback] = React.useState<{ x: number; y: number } | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    dragging.current = true;
    if (e.touches.length === 1) {
      last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setFeedback({ x: 0, y: 0 });
    }
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (!dragging.current || !last.current || e.touches.length !== 1) return;
    const { x, y } = last.current;
    const dx = e.touches[0].clientX - x;
    const dy = e.touches[0].clientY - y;
    onPanTilt(dx * 1.5, dy * 1.5); // More sensitive
    setFeedback({ x: dx, y: dy });
    last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function handleTouchEnd() {
    dragging.current = false;
    last.current = null;
    setFeedback(null);
  }

  return (
    <div
      ref={panRef}
      className="mobile-pan-tilt"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'absolute',
        bottom: 32,
        right: 32,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.5)',
        zIndex: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #fff',
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.8)', boxShadow: '0 0 8px #fff' }} />
      {feedback && (
        <div
          style={{
            position: 'absolute',
            left: 40 + feedback.x * 0.5 - 12,
            top: 40 + feedback.y * 0.5 - 12,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.15)',
            border: '2px solid #fff',
            pointerEvents: 'none',
            transition: 'left 0.1s, top 0.1s',
          }}
        />
      )}
    </div>
  );
}
