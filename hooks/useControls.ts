import { useState, useEffect } from 'react';
import { CarControls } from '../types';

export const useControls = (): CarControls => {
  const [controls, setControls] = useState<CarControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setControls((c) => {
        let next = { ...c };
        if (key === 'arrowup' || key === 'w') next.forward = true;
        if (key === 'arrowdown' || key === 's') next.backward = true;
        if (key === ' ' ) next.brake = true;
        // For left/right, swap if moving backward and not forward
        if (key === 'arrowleft' || key === 'a') {
          if (next.backward && !next.forward) {
            next.right = true;
          } else {
            next.left = true;
          }
        }
        if (key === 'arrowright' || key === 'd') {
          if (next.backward && !next.forward) {
            next.left = true;
          } else {
            next.right = true;
          }
        }
        return next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setControls((c) => {
        let next = { ...c };
        if (key === 'arrowup' || key === 'w') next.forward = false;
        if (key === 'arrowdown' || key === 's') next.backward = false;
        if (key === ' ' ) next.brake = false;
        // For left/right, swap if moving backward and not forward
        if (key === 'arrowleft' || key === 'a') {
          if (next.backward && !next.forward) {
            next.right = false;
          } else {
            next.left = false;
          }
        }
        if (key === 'arrowright' || key === 'd') {
          if (next.backward && !next.forward) {
            next.left = false;
          } else {
            next.right = false;
          }
        }
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return controls;
};
