import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh, Box3, Vector3, Group, FrontSide } from 'three';

export const FactoryWorld: React.FC = () => {
  // Load the custom world asset
  // Note: Ensure the file is at public/models/factory_2.glb
  const { scene } = useGLTF('/models/factory_2.glb');
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (!scene) return;

    // 1. Enable Shadows & Fix Materials
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Fix potential dark materials
        if ((child as any).material) {
           // Don't overwrite map (texture), just lighting properties
           (child as any).material.roughness = 0.8; 
           (child as any).material.metalness = 0.2;
           
           // CRITICAL FIX: Do NOT use DoubleSide (2) for buildings.
           // This causes Z-fighting (glitching) on walls that are thin or have close geometry.
           (child as any).material.side = FrontSide; // 0 = FrontSide
           
           // Ensure depth writing is on to prevent transparency sorting issues
           (child as any).material.depthWrite = true;
        }
      }
    });

    // 2. Auto-Scale and Center
    // Calculate the bounding box of the raw model
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    box.getSize(size);
    const center = new Vector3();
    box.getCenter(center);

    console.log("Model Original Size:", size);
    console.log("Model Original Center:", center);

    // Desired width for the game world (approx 200 units for driving space)
    const TARGET_SIZE = 300;
    const maxDim = Math.max(size.x, size.z); // Base scale on floor area
    
    // Protect against empty models or div by zero
    const scaleFactor = maxDim > 0 ? TARGET_SIZE / maxDim : 1;
    
    console.log("Applied Scale Factor:", scaleFactor);

    scene.scale.setScalar(scaleFactor);

    // 3. Position Adjustment
    // We need to move the model so its center is at (0,?,0) 
    // and its bottom is exactly at y=0 (Ground level)
    
    // Since we scaled the object, the internal coordinates scaled too.
    // We adjust the group position to compensate.
    scene.position.x = -center.x * scaleFactor;
    scene.position.z = -center.z * scaleFactor;
    scene.position.y = -box.min.y * scaleFactor;

  }, [scene]);

  return (
    <group ref={groupRef} name="world-terrain">
      {/* 
         Fallback Ground Plane 
         Moved to -0.5 to ensure it doesn't z-fight with the model floor at 0
      */}
      <gridHelper args={[400, 40, 0x444444, 0x222222]} position={[0, -0.5, 0]} />
      
      {/* The Loaded Model */}
      <primitive object={scene} />
    </group>
  );
};

// Preload
useGLTF.preload('/models/factory_2.glb');