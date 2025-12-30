import React, { useRef, useState } from 'react';
import useMobileTurnAmount from '../hooks/useMobileTurnAmount';
import './MobileControls.css';

// Helper to dispatch keyboard events
function triggerKey(key: string, type: 'keydown' | 'keyup' = 'keydown') {
  window.dispatchEvent(
    new KeyboardEvent(type, { key, bubbles: true })
  );
}

// Joystick radius in px
const JOYSTICK_RADIUS = 60;
const KNOB_RADIUS = 28;

export default function MobileControls() {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  // Track all 4 directions
  const lastKeys = useRef<{ w: boolean; a: boolean; d: boolean; s: boolean }>({ w: false, a: false, d: false, s: false });

  // Helper to send key events only on state change
  function setKey(key: 'w' | 'a' | 'd' | 's', pressed: boolean) {
    if (lastKeys.current[key] !== pressed) {
      triggerKey(key, pressed ? 'keydown' : 'keyup');
      lastKeys.current[key] = pressed;
    }
  }

  // On drag, calculate direction and trigger keys
  // Store the current turnAmount for analog turning
  const [turnAmount, setTurnAmount] = useState<number | null>(null);
  useMobileTurnAmount(turnAmount);

  function handleMove(clientX: number, clientY: number, origin: DOMRect) {
    const dx = clientX - (origin.left + origin.width / 2);
    const dy = clientY - (origin.top + origin.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Clamp knob within joystick circle
    const maxDist = JOYSTICK_RADIUS - KNOB_RADIUS;
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);
    // Use xRaw for knob UI, but invert x for logic
    const xRaw = clampedDist * Math.cos(angle);
    const y = clampedDist * Math.sin(angle);
    setKnobPos({ x: xRaw, y });

    // Invert X axis for logic only
    const x = -xRaw;
    const turnAmount = Math.max(-1, Math.min(1, x / maxDist));
    setTurnAmount(turnAmount);


    // Forward/backward threshold
    const forward = y < -10;
    const backward = y > 10;


    // Correct left/right logic for forward/backward
    let left = false, right = false;
    if (forward) {
      left = x < -15;
      right = x > 15;
    } else if (backward) {
      left = x > 15;
      right = x < -15;
    }

    setKey('w', forward);
    setKey('s', backward);
    setKey('a', left);
    setKey('d', right);

    // Optionally, for even smoother turning, you could dispatch custom events or use a callback to pass turnAmount to the robot logic.
    // For now, this just enables left/right keys for diagonal, but you can use turnAmount for analog turning in your robot code.
  }

  function handleEnd() {
    setKnobPos({ x: 0, y: 0 });
    setKey('w', false);
    setKey('a', false);
    setKey('d', false);
    setKey('s', false);
    setActive(false);
    setTurnAmount(null); // Reset analog turn
  }

  const joystickRef = useRef<HTMLDivElement>(null);

  function onTouchStart(e: React.TouchEvent) {
    setActive(true);
    if (joystickRef.current && e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY, joystickRef.current.getBoundingClientRect());
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (joystickRef.current && e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY, joystickRef.current.getBoundingClientRect());
    }
  }
  function onTouchEnd() {
    handleEnd();
  }

  function onMouseDown(e: React.MouseEvent) {
    setActive(true);
    if (joystickRef.current) {
      handleMove(e.clientX, e.clientY, joystickRef.current.getBoundingClientRect());
    }
    const onMove = (ev: MouseEvent) => {
      if (joystickRef.current) {
        handleMove(ev.clientX, ev.clientY, joystickRef.current.getBoundingClientRect());
      }
    };
    const onUp = () => {
      handleEnd();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return (
    <div className="mobile-controls-overlay">
      <div
        className={`joystick${active ? ' active' : ''}`}
        ref={joystickRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{
          width: JOYSTICK_RADIUS * 2,
          height: JOYSTICK_RADIUS * 2,
          position: 'relative',
          margin: '0 auto',
        }}
      >
        <div
          className="joystick-base"
          style={{
            width: JOYSTICK_RADIUS * 2,
            height: JOYSTICK_RADIUS * 2,
            borderRadius: '50%',
            background: 'rgba(34,34,34,0.85)',
            border: '2px solid #ffd600',
            position: 'absolute',
            left: 0,
            top: 0,
          }}
        />
        <div
          className="joystick-knob"
          style={{
            width: KNOB_RADIUS * 2,
            height: KNOB_RADIUS * 2,
            borderRadius: '50%',
            background: active ? '#ffd600' : '#444',
            border: '2px solid #ffd600',
            position: 'absolute',
            left: JOYSTICK_RADIUS + knobPos.x - KNOB_RADIUS,
            top: JOYSTICK_RADIUS + knobPos.y - KNOB_RADIUS,
            transition: active ? 'none' : 'left 0.2s, top 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            touchAction: 'none',
          }}
        />
      </div>
      {/* No brake or enter buttons in mobile view */}
    </div>
  );
}
