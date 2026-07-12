import { useEffect, useState } from 'react';

/**
 * useIsMobile — true on touch-first devices and narrow viewports.
 *
 * Width alone misclassifies landscape phones (e.g. 812×375 reads as
 * "desktop"), so a coarse primary pointer also counts as mobile when the
 * viewport is phone/tablet sized.
 */
export default function useIsMobile(breakpoint: number = 768): boolean {
  const compute = () => {
    if (typeof window === 'undefined') return false;
    const narrow = window.innerWidth <= breakpoint;
    const coarse =
      window.matchMedia('(pointer: coarse)').matches && window.innerWidth <= 1024;
    return narrow || coarse;
  };

  const [isMobile, setIsMobile] = useState(compute);

  useEffect(() => {
    const handleResize = () => setIsMobile(compute());
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakpoint]);

  return isMobile;
}
