import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Loader } from '@react-three/drei';
import { Vector3 } from 'three';
// import { Car } from './components/Car'; // Car is kept in file system but not used
import { Zone } from './components/Zone';
import { UIOverlay } from './components/UIOverlay';
import { FactoryWorld } from './components/FactoryWorld';
import { RoboticDog } from './components/RoboticDog';
import { PORTFOLIO_DATA } from './services/portfolioData';
import { PortfolioSection } from './types';

// Component to handle interaction logic inside the Canvas loop
const InteractionManager = ({ 
  carPositionRef, 
  onZoneNearby 
}: { 
  carPositionRef: React.MutableRefObject<Vector3>, 
  onZoneNearby: (zone: PortfolioSection | null) => void 
}) => {
  useFrame(() => {
    let closest: PortfolioSection | null = null;
    let minDist = 1000;

    // Simple distance check against all zones
    for (const zone of PORTFOLIO_DATA) {
      const dist = carPositionRef.current.distanceTo(new Vector3(...zone.position));
      if (dist < 8) { // Activation radius
        if (dist < minDist) {
          minDist = dist;
          closest = zone;
        }
      }
    }
    onZoneNearby(closest);
  });
  return null;
};

const App: React.FC = () => {
  const [speed, setSpeed] = useState(0);
  const [nearbyZone, setNearbyZone] = useState<PortfolioSection | null>(null);
  const [activeZone, setActiveZone] = useState<PortfolioSection | null>(null);
  
  // Shared reference for position (now tracks the Dog)
  const positionRef = useRef<Vector3>(new Vector3(0, 0, 0));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && nearbyZone) {
        setActiveZone(nearbyZone);
      }
      if (e.key === 'Escape') {
        setActiveZone(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nearbyZone]);

  return (
    <div className="relative w-full h-full bg-gray-900">
      <Canvas shadows camera={{ position: [0, 20, -75], fov: 50, near: 0.1, far: 1000 }} dpr={[1, 1.5]}>
        {/* Environment - Dark Industrial Factory */}
        <color attach="background" args={['#111']} />
        <fog attach="fog" args={['#111', 10, 150]} />
        
        {/* 
            Lighting Configuration: AMBIENT MODE
            - High ambient light for visibility
            - Soft directional light for minimal shadows
        */}
        <ambientLight intensity={1.5} />
        <directionalLight 
          position={[50, 80, 50]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
        />

        {/* Removed axesHelper to eliminate the vertical line glitch */}
        
        <Suspense fallback={null}>
          <Stars radius={150} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />

          {/* New Custom World with Auto-Scaling */}
          <FactoryWorld />
          
          {/* Render all portfolio zones */}
          {PORTFOLIO_DATA.map((zone) => (
            <Zone key={zone.id} data={zone} />
          ))}

          {/* 
             Robotic Dog is now the player avatar.
             Controlled via keyboard, updates positionRef.
             Start at Y=10 to drop safely.
             Moved Z to -60 (Opposite side, double distance of previous 30).
          */}
          <RoboticDog 
            position={[5, 10, -85]} 
            rotation={[0, Math.PI, 0]} 
            scale={2.2} 
            onSpeedChange={setSpeed}
            positionRef={positionRef}
          />

          <InteractionManager 
            carPositionRef={positionRef} 
            onZoneNearby={setNearbyZone} 
          />
        </Suspense>
      </Canvas>
      
      <Loader />

      <UIOverlay 
        speed={speed} 
        nearbyZone={nearbyZone}
        activeZone={activeZone}
        onClose={() => setActiveZone(null)}
      />
    </div>
  );
};

export default App;