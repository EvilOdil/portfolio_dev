import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { PortfolioSection } from '../types';

interface ZoneProps {
  data: PortfolioSection;
}

export const Zone: React.FC<ZoneProps> = ({ data }) => {
  const meshRef = useRef<any>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime + data.position[0]) * 0.2;
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group position={data.position}>
      {/* Floating Label */}
      <Text
        position={[0, 5, 0]}
        fontSize={1.5}
        color={data.color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {data.title.toUpperCase()}
      </Text>

      {/* The Box */}
      <mesh ref={meshRef} position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[4, 4, 4]} />
        <meshStandardMaterial 
          color={data.color} 
          emissive={data.color}
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
        <meshBasicMaterial color={data.color} />
      </mesh>
      
      {/* Light for this zone */}
      <pointLight position={[0, 5, 0]} distance={15} intensity={2} color={data.color} />
    </group>
  );
};
