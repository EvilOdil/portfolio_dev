import React, { useState, useEffect, useRef, Suspense, useCallback, lazy } from 'react';
import useIsMobile from './hooks/useIsMobile';
import MobileControls from './components/MobileControls';
import MobilePanTilt from './components/MobilePanTilt';
import { UIOverlay } from './components/UIOverlay';
import { TerminalLanding } from './components/TerminalLanding';
import { HudNavigation } from './components/HudNavigation';
import { PORTFOLIO_DATA } from './services/portfolioData';
import { PortfolioSection } from './types';

const ThreeScene = lazy(() => import('./components/ThreeScene'));

const App: React.FC = () => {
  const [speed, setSpeed] = useState(0);
  const [nearbyZone, setNearbyZone] = useState<PortfolioSection | null>(null);
  const [activeZone, setActiveZone] = useState<PortfolioSection | null>(null);

  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [selectedMode, setSelectedMode] = useState<'TELEOP' | 'AUTO' | null>(null);

  const [teleportTarget, setTeleportTarget] = useState<{ x: number; y: number; z: number; rotation?: number } | null>(null);

  const controlsEnabled = !terminalExpanded && selectedMode === 'TELEOP' && !activeZone;

  const handleTeleport = useCallback((zoneId: string) => {
    const zone = PORTFOLIO_DATA.find(z => z.id === zoneId);
    if (!zone) return;
    const [zoneX, zoneY, zoneZ] = zone.position;
    const offsetDistance = 6;
    let offsetX = 0;
    let offsetZ = offsetDistance;
    let facingRotation = 0;

    if (zoneZ < 0) {
      offsetZ = offsetDistance;
      facingRotation = 0;
    } else if (zoneZ > 0) {
      offsetZ = -offsetDistance;
      facingRotation = Math.PI;
    }

    if (zoneX < -10) {
      offsetX = offsetDistance;
      offsetZ = 0;
      facingRotation = -Math.PI / 2;
    } else if (zoneX > 10) {
      offsetX = -offsetDistance;
      offsetZ = 0;
      facingRotation = Math.PI / 2;
    }

    setTeleportTarget({ x: zoneX + offsetX, y: zoneY + 5, z: zoneZ + offsetZ, rotation: facingRotation });
  }, []);

  const handleTeleportComplete = useCallback(() => setTeleportTarget(null), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && nearbyZone) setActiveZone(nearbyZone);
      if (e.key === 'Escape') setActiveZone(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nearbyZone]);

  const isMobile = useIsMobile();
  const panTilt = useRef({ x: 0, y: 0 });

  function handlePanTilt(dx: number, dy: number) {
    panTilt.current.x += dx * 0.02;
    panTilt.current.y = Math.max(-1, Math.min(1, panTilt.current.y + dy * 0.02));
  }

  return (
    <div className="relative w-full h-full bg-gray-900">
      <Suspense fallback={null}>
        <ThreeScene
          isMobile={isMobile}
          controlsEnabled={controlsEnabled}
          teleportTarget={teleportTarget}
          onSpeedChange={setSpeed}
          onZoneNearby={setNearbyZone}
          onTeleportComplete={handleTeleportComplete}
          panTilt={panTilt}
        />
      </Suspense>

      <HudNavigation
        selectedMode={selectedMode}
        onTeleport={handleTeleport}
        isMobile={isMobile}
        nearbyZone={nearbyZone}
      />

      <UIOverlay
        speed={speed}
        nearbyZone={nearbyZone}
        activeZone={activeZone}
        onClose={() => setActiveZone(null)}
        selectedMode={selectedMode}
        isMobile={isMobile}
      />

      <TerminalLanding
        isExpanded={terminalExpanded}
        onToggle={() => setTerminalExpanded(prev => !prev)}
        onModeSelect={setSelectedMode}
        selectedMode={selectedMode}
        isMobile={isMobile}
      />

      {isMobile && controlsEnabled && <MobileControls />}
      {isMobile && !terminalExpanded && <MobilePanTilt onPanTilt={handlePanTilt} />}
    </div>
  );
};

export default App;
