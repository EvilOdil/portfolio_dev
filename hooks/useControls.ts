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
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          setControls((c) => ({ ...c, forward: true }));
          break;
        case 'arrowdown':
        case 's':
          setControls((c) => ({ ...c, backward: true }));
          break;
        case 'arrowleft':
        case 'a':
          setControls((c) => ({ ...c, left: true }));
          break;
        case 'arrowright':
        case 'd':
          setControls((c) => ({ ...c, right: true }));
          break;
        case ' ':
          setControls((c) => ({ ...c, brake: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          setControls((c) => ({ ...c, forward: false }));
          break;
        case 'arrowdown':
        case 's':
          setControls((c) => ({ ...c, backward: false }));
          break;
        case 'arrowleft':
        case 'a':
          setControls((c) => ({ ...c, left: false }));
          break;
        case 'arrowright':
        case 'd':
          setControls((c) => ({ ...c, right: false }));
          break;
        case ' ':
          setControls((c) => ({ ...c, brake: false }));
          break;
      }
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
