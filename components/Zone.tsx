import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PortfolioSection } from '../types';

// --- Modular Asset Components ---

interface ZoneModelProps {
  color: string;
  offset: number; // Used to desync animations based on position
}

/**
 * DefaultZoneModel: The standard floating box representation.
 * Can be replaced or supplemented by other components like <ServerRackZone />, <RoboticArmZone />, etc.
 */
const DefaultZoneModel: React.FC<ZoneModelProps> = ({ color, offset }) => {
  const meshRef = useRef<any>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      // Using offset to ensure all boxes don't float in perfect sync
      meshRef.current.position.y = 3.5 + Math.sin(state.clock.elapsedTime + offset) * 0.2;
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group>
      {/* The Box */}
      <mesh ref={meshRef} position={[0, 3.5, 0]} castShadow>
        <boxGeometry args={[4, 4, 4]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Ground marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[3, 3.5, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Light for this zone */}
      <pointLight position={[0, 5, 0]} distance={15} intensity={2} color={color} />
    </group>
  );
};

// --- Main Zone Container ---

interface ZoneProps {
  data: PortfolioSection;
}

export const Zone: React.FC<ZoneProps> = ({ data }) => {
  // Logic to select specific 3D assets based on data.modelType
  const renderZoneContent = () => {
    switch (data.modelType) {
      // Example for future expansion:
      // case 'server-rack': return <ServerRackModel color={data.color} offset={data.position[0]} />;
      // case 'robot-arm': return <RobotArmModel color={data.color} offset={data.position[0]} />;
      
      case 'default':
      default:
        return <DefaultZoneModel color={data.color} offset={data.position[0]} />;
    }
  };

  return (
    <group position={data.position}>
      {renderZoneContent()}
    </group>
  );
};