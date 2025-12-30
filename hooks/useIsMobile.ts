import { useEffect, useState } from 'react';

/**
 * useIsMobile - React hook to detect if the device is mobile (≤768px width)
 * Returns true if mobile, false if desktop.
 */
export default function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}
