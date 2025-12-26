import React, { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { Vector3, Euler } from 'three';

// Optimized Building Block - uses scale instead of unique geometry args
// This allows sharing the boxGeometry across all buildings
const DistantBuildings = () => {
  const buildings = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => {
      const angle = (i / 40) * Math.PI * 2;
      const radius = 90 + Math.random() * 50;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      // Random scale for width, height, depth
      const scale: [number, number, number] = [
        10 + Math.random() * 15, 
        20 + Math.random() * 50, 
        10 + Math.random() * 15
      ];
      // Position y needs to account for height scaling (since box center is 0,0,0)
      const y = 10 + Math.random() * 10; 
      
      return { position: [x, y, z] as [number, number, number], scale };
    });
  }, []);

  return (
    <Instances range={40}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#151515" roughness={0.8} metalness={0.2} />
      {buildings.map((b, i) => (
        <Instance key={i} position={b.position} scale={b.scale} />
      ))}
    </Instances>
  );
};

const Smokestack = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 15, 0]} castShadow>
      {/* Reduced segments from 32 to 16 */}
      <cylinderGeometry args={[2, 4, 30, 16]} />
      <meshStandardMaterial color="#333" roughness={0.6} metalness={0.5} />
    </mesh>
    <mesh position={[0, 29, 0]}>
      <cylinderGeometry args={[2.1, 2.1, 1, 16]} />
      <meshBasicMaterial color="#ff3300" toneMapped={false} />
    </mesh>
    {/* Optimization: Ensure this light doesn't cast shadows if not critical, or limit distance */}
    <pointLight position={[0, 32, 0]} color="#ff3300" distance={40} decay={2} intensity={2} castShadow={false} />
  </group>
);

const SiloGroup = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh position={[-4, 8, 0]} castShadow>
      <cylinderGeometry args={[3, 3, 16, 16]} />
      <meshStandardMaterial color="#444" metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh position={[4, 8, 0]} castShadow>
      <cylinderGeometry args={[3, 3, 16, 16]} />
      <meshStandardMaterial color="#444" metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh position={[0, 8, 5]} castShadow>
      <cylinderGeometry args={[3, 3, 16, 16]} />
      <meshStandardMaterial color="#444" metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh position={[0, 12, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.5, 0.5, 10, 8]} />
        <meshStandardMaterial color="#666" />
    </mesh>
  </group>
);

const OverheadBeam = ({ z }: { z: number }) => (
  <group position={[0, 25, z]}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[120, 2, 2]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
    </mesh>
    {/* Optimization: Removed the Loop of PointLights. 
        Replaced with Emissive Materials for the "light" look without the calculation cost. 
    */}
    {Array.from({ length: 10 }).map((_, i) => (
       <mesh key={i} position={[(i - 5) * 10, -1.1, 0]}>
           <boxGeometry args={[5, 0.2, 1.8]} />
           <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} toneMapped={false} />
       </mesh>
    ))}
    <mesh position={[-60, -12.5, 0]}>
      <boxGeometry args={[4, 25, 4]} />
      <meshStandardMaterial color="#222" />
    </mesh>
    <mesh position={[60, -12.5, 0]}>
      <boxGeometry args={[4, 25, 4]} />
      <meshStandardMaterial color="#222" />
    </mesh>
  </group>
);

const FloatingParticles = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 200,
        Math.random() * 40,
        (Math.random() - 0.5) * 200
      ] as [number, number, number],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
      scale: 0.5 + Math.random() * 0.5
    }));
  }, []);

  return (
    <Instances range={80}>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshBasicMaterial color="#666" transparent opacity={0.4} />
      {particles.map((data, i) => (
        <Instance key={i} position={data.position} rotation={data.rotation} scale={data.scale} />
      ))}
    </Instances>
  )
}

export const FactoryScenery: React.FC = () => {
  return (
    <group>
      <DistantBuildings />

      {/* Hero Structures */}
      <Smokestack position={[-50, 0, -50]} />
      <Smokestack position={[50, 0, 50]} />
      
      <SiloGroup position={[60, 0, -20]} />
      <SiloGroup position={[-60, 0, 20]} />

      {/* Overhead Gantry System */}
      <OverheadBeam z={-40} />
      <OverheadBeam z={0} />
      <OverheadBeam z={40} />

      <FloatingParticles />

      {/* Atmospheric Fog Lights - Reduced Intensity/Range if needed, but keeping for mood */}
      <pointLight position={[-40, 10, -40]} color="orange" distance={50} decay={2} intensity={1} castShadow={false} />
      <pointLight position={[40, 10, 40]} color="cyan" distance={50} decay={2} intensity={1} castShadow={false} />
    </group>
  );
};