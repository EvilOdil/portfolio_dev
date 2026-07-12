import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PortfolioSection } from '../types';
import { PORTFOLIO_DATA } from '../services/portfolioData';

function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

interface HudNavigationProps {
  selectedMode: 'TELEOP' | 'AUTO' | null;
  onTeleport: (zoneId: string) => void;
  isMobile?: boolean;
  nearbyZone?: PortfolioSection | null;
}

// Map zone IDs to display labels
const ZONE_LABELS: { [key: string]: string } = {
  'summary': 'Profile',
  'experience': 'Experience',
  'publications': 'Publications',
  'projects': 'Projects',
  'education': 'Education',
  'achievements': 'Awards',
  'speeches': 'Speeches',
  'blog': 'Blog',
};

export const HudNavigation: React.FC<HudNavigationProps> = ({
  selectedMode,
  onTeleport,
  isMobile = false,
  nearbyZone,
}) => {
  const [activeTickIndex, setActiveTickIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const viewportWidth = useWindowWidth();
  const isCompact = !isMobile && viewportWidth < 1112;

  const zones = PORTFOLIO_DATA;

  // Update active tick when nearbyZone changes (robot moves near a zone)
  useEffect(() => {
    if (nearbyZone && !isDragging) {
      const zoneIndex = zones.findIndex(z => z.id === nearbyZone.id);
      if (zoneIndex !== -1) {
        setActiveTickIndex(zoneIndex);
      }
    }
  }, [nearbyZone, zones, isDragging]);

  // Generate bag ID from current date
  const getBagId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `SIM_${year}_${month}_${day}`;
  };

  const updatePlayhead = (clientX: number) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;

    // Find closest tick
    const tickWidth = rect.width / (zones.length - 1);
    const closestIndex = Math.round(x / tickWidth);
    const clampedIndex = Math.max(0, Math.min(zones.length - 1, closestIndex));
    
    setActiveTickIndex(clampedIndex);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updatePlayhead(e.clientX);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updatePlayhead(e.clientX);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && zones[activeTickIndex]) {
      onTeleport(zones[activeTickIndex].id);
    }
    setIsDragging(false);
  }, [isDragging, activeTickIndex, zones, onTeleport]);

  const handleTickClick = (index: number) => {
    setActiveTickIndex(index);
    if (zones[index]) {
      onTeleport(zones[index].id);
    }
  };

  // Listeners are only needed while dragging — attaching permanently meant
  // re-registering on every activeTickIndex change
  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate playhead position
  const playheadPercent = zones.length > 1 ? (activeTickIndex / (zones.length - 1)) * 100 : 0;

  if (!selectedMode) return null;

  const labelFontClass = isCompact ? 'text-[9px]' : 'text-sm';
  const tickPadding = isCompact ? 'px-2 py-5' : 'px-6 py-6';
  const scrubberPadding = isCompact ? 'px-3 py-8' : 'px-6 py-10';
  const labelTop = isCompact ? 'top-8' : 'top-10';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 ${isMobile ? 'w-[95%]' : 'w-[90%] max-w-[1000px]'}`}>
      <div
        className="flex items-stretch bg-[rgba(16,20,24,0.85)] border-b border-r border-[rgba(255,255,255,0.2)] border-l-2 border-l-safety-yellow overflow-hidden"
        style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
      >
        {/* Left Section - System Title */}
        <div className={`border-t-2 border-t-safety-yellow flex flex-col justify-center flex-shrink-0 ${isMobile ? 'p-4 min-w-[120px]' : isCompact ? 'py-6 px-4 min-w-[160px]' : 'py-8 px-6 min-w-[200px]'}`}>
          <div className={`text-white font-tech font-bold tracking-wider leading-none ${isMobile ? 'text-sm' : isCompact ? 'text-base' : 'text-xl'}`}>
            ODIL.OS // SYSTEM
          </div>
          <div className={`text-[rgba(255,255,255,0.3)] font-code mt-2 ${isMobile ? 'text-[9px]' : 'text-xs'}`}>
            UNIT: C01-004 MODE: {selectedMode}
          </div>
        </div>

        {/* Right Section - Hamburger (mobile) or Scrubber (desktop/compact) */}
        {isMobile ? (
          <div className="flex-grow border-t-2 border-t-[rgba(255,255,255,0.2)] flex flex-col justify-center relative px-4 py-4">
            {/* Timeline Track — ticks only, no labels */}
            <div
              ref={trackRef}
              className="relative h-[2px] bg-[rgba(255,255,255,0.15)] w-full flex justify-between items-center cursor-pointer"
              onMouseDown={handleMouseDown}
            >
              {/* Playhead */}
              <div
                ref={playheadRef}
                className="absolute h-[8px] w-8 bg-safety-yellow top-[-3px] rounded-[1px] cursor-grab active:cursor-grabbing transition-all duration-300"
                style={{
                  left: `calc(${playheadPercent}% - 16px)`,
                  boxShadow: isDragging ? '0 0 15px #FFC107, inset 0 0 5px rgba(255,255,255,0.5)' : '0 0 8px #FFC107',
                }}
              />
              {/* Ticks — no label span */}
              {zones.map((zone, index) => (
                <div
                  key={zone.id}
                  onClick={() => handleTickClick(index)}
                  className="relative flex flex-col items-center cursor-pointer transition-all duration-300 z-10 group px-3 py-4"
                  style={{ margin: '0 -12px' }}
                >
                  <div
                    className={`transition-all duration-300 ${
                      activeTickIndex === index
                        ? 'h-5 bg-safety-yellow'
                        : 'h-4 bg-[rgba(255,255,255,0.6)] group-hover:bg-safety-yellow group-hover:h-5'
                    }`}
                    style={{
                      width: '2px',
                      boxShadow: activeTickIndex === index ? '0 0 6px #FFC107' : 'none',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`flex-grow border-t-2 border-t-[rgba(255,255,255,0.2)] flex flex-col justify-center relative ${scrubberPadding}`}>

            {/* Meta Info */}
            <div className={`absolute left-6 font-code text-off-white tracking-wide flex items-center ${isCompact ? 'top-2 text-[9px]' : 'top-3 text-xs'}`}>
              [ BAG PLAYBACK // ID: <span className="ml-1">{getBagId()}</span> ]
              <div
                className="ml-3 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-[#ff3b3b] animate-pulse"
                style={{ filter: 'drop-shadow(0 0 4px #ff3b3b)' }}
              />
              <span className="ml-1.5 font-bold">PLAY</span>
            </div>

            {/* Timeline Track */}
            <div
              ref={trackRef}
              className="relative h-[2px] bg-[rgba(255,255,255,0.15)] w-full flex justify-between items-center cursor-pointer mt-4"
              onMouseDown={handleMouseDown}
            >
              {/* Playhead - centered on active tick */}
              <div
                ref={playheadRef}
                className="absolute h-[6px] w-8 bg-safety-yellow top-[-2px] rounded-[1px] cursor-grab active:cursor-grabbing transition-all duration-300"
                style={{
                  left: `calc(${playheadPercent}% - 16px)`,
                  boxShadow: isDragging ? '0 0 15px #FFC107, inset 0 0 5px rgba(255,255,255,0.5)' : '0 0 8px #FFC107'
                }}
              />

              {/* Ticks */}
              {zones.map((zone, index) => (
                <div
                  key={zone.id}
                  onClick={() => handleTickClick(index)}
                  className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 z-10 group ${tickPadding}`}
                  style={{ margin: `0 -${isCompact ? '10' : '20'}px` }}
                >
                  {/* Tick line */}
                  <div
                    className={`transition-all duration-300 ${
                      activeTickIndex === index
                        ? 'h-4 bg-safety-yellow'
                        : 'h-3 bg-off-white group-hover:bg-safety-yellow group-hover:h-4'
                    }`}
                    style={{
                      width: '2px',
                      boxShadow: activeTickIndex === index ? '0 0 5px #FFC107' : 'none'
                    }}
                  />
                  {/* Label */}
                  <span
                    className={`absolute whitespace-nowrap font-tech font-bold uppercase tracking-wider transition-all duration-200 ${labelFontClass} ${labelTop} ${
                      activeTickIndex === index
                        ? 'text-safety-yellow'
                        : 'text-[rgba(255,255,255,0.85)] group-hover:text-safety-yellow'
                    }`}
                    style={{
                      textShadow: activeTickIndex === index ? '0 0 10px #FFC107' : '0 1px 3px rgba(0,0,0,0.8)',
                      transform: `translateX(0%) ${activeTickIndex === index ? 'scale(1.05)' : 'scale(1)'}`
                    }}
                  >
                    {ZONE_LABELS[zone.id] || zone.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HudNavigation;
