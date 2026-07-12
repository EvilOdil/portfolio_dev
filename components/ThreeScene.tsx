import React, { useRef, useEffect, useState, Suspense, lazy } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Loader } from '@react-three/drei';
import { Vector3 } from 'three';
import { FactoryWorld } from './FactoryWorld';
import { RoboticDog } from './RoboticDog';
import { Zone } from './Zone';
import { PORTFOLIO_DATA } from '../services/portfolioData';
import { ZONE_PROGRESS } from '../services/bakedPath';
import { PortfolioSection } from '../types';

// Debug nav-grid overlay — lazy so the grid data + text renderer only
// download when it is actually toggled on ('G' key or ?grid URL param)
const GridOverlay = lazy(() => import('./GridOverlay'));

// Pre-computed once — allocating these per zone per frame caused constant
// GC pressure (8 zones × 60fps)
const ZONE_POSITIONS = PORTFOLIO_DATA.map(z => new Vector3(...z.position));

const InteractionManager = ({
  positionRef,
  onZoneNearby,
}: {
  positionRef: React.MutableRefObject<Vector3>;
  onZoneNearby: (zone: PortfolioSection | null) => void;
}) => {
  const lastZone = useRef<PortfolioSection | null>(null);
  useFrame(() => {
    let closest: PortfolioSection | null = null;
    let minDist = 1000;
    for (let i = 0; i < PORTFOLIO_DATA.length; i++) {
      const dist = positionRef.current.distanceTo(ZONE_POSITIONS[i]);
      if (dist < 8 && dist < minDist) {
        minDist = dist;
        closest = PORTFOLIO_DATA[i];
      }
    }
    // Only touch React state when the answer changes
    if (closest !== lastZone.current) {
      lastZone.current = closest;
      onZoneNearby(closest);
    }
  });
  return null;
};

interface ThreeSceneProps {
  isMobile: boolean;
  selectedMode: 'TELEOP' | 'AUTO' | null;
  controlsEnabled: boolean;
  teleportTarget: { x: number; y: number; z: number; rotation?: number } | null;
  onSpeedChange: (speed: number) => void;
  onZoneNearby: (zone: PortfolioSection | null) => void;
  onTeleportComplete: () => void;
  panTilt: React.MutableRefObject<{ x: number; y: number }>;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({
  isMobile,
  selectedMode,
  controlsEnabled,
  teleportTarget,
  onSpeedChange,
  onZoneNearby,
  onTeleportComplete,
  panTilt,
}) => {
  const positionRef = useRef<Vector3>(new Vector3(0, 0, 0));
  const scrollProgressRef = useRef(0);
  const zoneSpaceRef = useRef(0); // scroll position in zone intervals [0, zones-1]

  // Debug nav-grid overlay: 'G' toggles, ?grid starts enabled
  const [showGrid, setShowGrid] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('grid')
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') setShowGrid(s => !s);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Attach scroll / touch listeners in AUTO mode to drive path progress.
  // Input accumulates in "zone space" (one mouse notch ≈ one zone interval)
  // and maps to a path arc-fraction through ZONE_PROGRESS — the legs between
  // zones have very different lengths, so a uniform t = k/STEPS mapping
  // stopped the dog several cells past shorter-leg zones.
  useEffect(() => {
    if (selectedMode !== 'AUTO') return;

    const STEPS = PORTFOLIO_DATA.length - 1; // 7 intervals for 8 zones

    const mapToPath = () => {
      const i = Math.min(Math.floor(zoneSpaceRef.current), STEPS - 1);
      const frac = zoneSpaceRef.current - i;
      scrollProgressRef.current =
        ZONE_PROGRESS[i] + (ZONE_PROGRESS[i + 1] - ZONE_PROGRESS[i]) * frac;
    };

    // Magnetic snap: once input pauses, settle on the nearest zone. Wheel
    // hardware reports arbitrary deltaY magnitudes (100, 120, momentum…), so
    // raw accumulation drifts off the zone marks.
    let snapTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleSnap = () => {
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        zoneSpaceRef.current = Math.round(zoneSpaceRef.current);
        mapToPath();
      }, 250);
    };

    const applyZoneSpace = (delta: number) => {
      zoneSpaceRef.current = Math.max(0, Math.min(STEPS, zoneSpaceRef.current + delta));
      mapToPath();
      scheduleSnap();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Cap one event at one zone hop: a single notch is ±1 regardless of
      // whether the mouse reports deltaY 100, 120, or more.
      applyZoneSpace(Math.max(-1, Math.min(1, e.deltaY / 100)));
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      // Swipe up → forward (positive delta), swipe down → reverse
      const dy = touchStartY - e.touches[0].clientY;
      applyZoneSpace(Math.max(-1, Math.min(1, dy / 60)));
      touchStartY = e.touches[0].clientY;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      clearTimeout(snapTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [selectedMode]);

  return (
    <>
      <Canvas
        shadows={!isMobile}
        camera={{
          position: isMobile ? [0, 25, -90] : [0, 20, -75],
          fov: isMobile ? 60 : 50,
          near: 0.1,
          far: 300,
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        gl={{ powerPreference: 'high-performance', antialias: !isMobile }}
        style={{
          width: '100%',
          height: '100%',
          ...(isMobile ? { touchAction: 'none', pointerEvents: 'none' } : {}),
        }}
      >
        <color attach="background" args={['#111']} />
        <fog attach="fog" args={['#111', 10, 150]} />
        <ambientLight intensity={1.5} />
        <directionalLight
          position={[50, 80, 50]}
          intensity={0.8}
          castShadow={!isMobile}
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-110}
          shadow-camera-right={110}
          shadow-camera-top={110}
          shadow-camera-bottom={-110}
          shadow-camera-near={10}
          shadow-camera-far={250}
        />

        <Suspense fallback={null}>
          <Stars radius={150} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
          <FactoryWorld />
          {PORTFOLIO_DATA.map((zone) => (
            <Zone key={zone.id} data={zone} />
          ))}
          <RoboticDog
            position={[5, 10, -75]}
            rotation={[0, Math.PI, 0]}
            scale={2.2}
            onSpeedChange={onSpeedChange}
            positionRef={positionRef}
            controlsEnabled={controlsEnabled}
            panTilt={isMobile ? panTilt : undefined}
            teleportTarget={teleportTarget}
            onTeleportComplete={onTeleportComplete}
            selectedMode={selectedMode}
            scrollProgressRef={scrollProgressRef}
          />
          <InteractionManager positionRef={positionRef} onZoneNearby={onZoneNearby} />
          {showGrid && <GridOverlay />}
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
};

export default ThreeScene;
