import { useEffect } from 'react';

/**
 * useMobileTurnAmount - React hook to provide a global analog turn value for mobile joystick
 * Only set when on mobile and MobileControls is active.
 */
declare global {
  interface Window {
    __mobileTurnAmount?: number;
  }
}

export default function useMobileTurnAmount(turnAmount: number | null) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (turnAmount === null) {
      window.__mobileTurnAmount = undefined;
    } else {
      window.__mobileTurnAmount = turnAmount;
    }
    return () => {
      window.__mobileTurnAmount = undefined;
    };
  }, [turnAmount]);
}
