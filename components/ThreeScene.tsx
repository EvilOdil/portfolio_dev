import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Loader } from '@react-three/drei';
import { Vector3 } from 'three';
import { FactoryWorld } from './FactoryWorld';
import { RoboticDog } from './RoboticDog';
import { Zone } from './Zone';
import { PORTFOLIO_DATA } from '../services/portfolioData';
import { PortfolioSection } from '../types';

const InteractionManager = ({
  positionRef,
  onZoneNearby,
}: {
  positionRef: React.MutableRefObject<Vector3>;
  onZoneNearby: (zone: PortfolioSection | null) => void;
}) => {
  useFrame(() => {
    let closest: PortfolioSection | null = null;
    let minDist = 1000;
    for (const zone of PORTFOLIO_DATA) {
      const dist = positionRef.current.distanceTo(new Vector3(...zone.position));
      if (dist < 8 && dist < minDist) {
        minDist = dist;
        closest = zone;
      }
    }
    onZoneNearby(closest);
  });
  return null;
};

interface ThreeSceneProps {
  isMobile: boolean;
  controlsEnabled: boolean;
  teleportTarget: { x: number; y: number; z: number; rotation?: number } | null;
  onSpeedChange: (speed: number) => void;
  onZoneNearby: (zone: PortfolioSection | null) => void;
  onTeleportComplete: () => void;
  panTilt: React.MutableRefObject<{ x: number; y: number }>;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({
  isMobile,
  controlsEnabled,
  teleportTarget,
  onSpeedChange,
  onZoneNearby,
  onTeleportComplete,
  panTilt,
}) => {
  const positionRef = useRef<Vector3>(new Vector3(0, 0, 0));

  return (
    <>
      <Canvas
        shadows
        camera={{
          position: isMobile ? [0, 25, -90] : [0, 20, -75],
          fov: isMobile ? 60 : 50,
          near: 0.1,
          far: 1000,
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        gl={{ powerPreference: 'high-performance', antialias: true }}
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
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        <Suspense fallback={null}>
          <Stars radius={150} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
          <FactoryWorld />
          {PORTFOLIO_DATA.map((zone) => (
            <Zone key={zone.id} data={zone} />
          ))}
          <RoboticDog
            position={[5, 10, -85]}
            rotation={[0, Math.PI, 0]}
            scale={2.2}
            onSpeedChange={onSpeedChange}
            positionRef={positionRef}
            controlsEnabled={controlsEnabled}
            panTilt={isMobile ? panTilt : undefined}
            teleportTarget={teleportTarget}
            onTeleportComplete={onTeleportComplete}
          />
          <InteractionManager positionRef={positionRef} onZoneNearby={onZoneNearby} />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
};

export default ThreeScene;
