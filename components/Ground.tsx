import React from 'react';
import { GRID_SIZE, GRID_DIVISIONS } from '../constants';

export const Ground: React.FC = () => {
  return (
    <group>
      {/* Physical Floor for receiving shadows - Concrete color */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Inner precise grid for driving ref */}
      <gridHelper 
        args={[200, 40, 0x444444, 0x222222]} 
        position={[0, 0.01, 0]} 
      />
      
      {/* Outer large scale grid */}
       <gridHelper 
        args={[1000, 50, 0x555555, 0x111111]} 
        position={[0, 0, 0]} 
      />
    </group>
  );
};