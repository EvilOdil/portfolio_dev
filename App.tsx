import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Loader } from '@react-three/drei';
import { Vector3 } from 'three';
import { Car } from './components/Car';
import { Zone } from './components/Zone';
import { UIOverlay } from './components/UIOverlay';
import { FactoryWorld } from './components/FactoryWorld';
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
  
  // Shared reference for car position to avoid react re-renders on every frame
  const carPositionRef = useRef<Vector3>(new Vector3(0, 0, 0));

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
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50, near: 0.1, far: 1000 }} dpr={[1, 1.5]}>
        {/* Environment - Dark Industrial Factory */}
        <color attach="background" args={['#0a0a10']} />
        {/* Haze/Smog */}
        <fog attach="fog" args={['#0a0a10', 10, 120]} />
        
        <ambientLight intensity={0.5} />
        {/* Main moon/flood light */}
        <directionalLight 
          position={[50, 100, 25]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
          shadow-bias={-0.0005} // Fixes shadow acne/glitching on floor
          color="#ccddee"
        />

        {/* Debug Helper: Red=X, Green=Y, Blue=Z */}
        <axesHelper args={[5]} position={[0, 0.1, 0]} />
        
        <Suspense fallback={null}>
          <Stars radius={150} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />

          {/* New Custom World with Auto-Scaling */}
          <FactoryWorld />
          
          {/* Render all portfolio zones */}
          {PORTFOLIO_DATA.map((zone) => (
            <Zone key={zone.id} data={zone} />
          ))}

          <Car 
            onSpeedChange={setSpeed} 
            positionRef={carPositionRef}
          />

          <InteractionManager 
            carPositionRef={carPositionRef} 
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
        carPositionRef={carPositionRef}
      />
    </div>
  );
};

export default App;