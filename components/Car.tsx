import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group, Raycaster, Object3D, MathUtils, Quaternion } from 'three';
import { useControls } from '../hooks/useControls';
import { ACCELERATION, BRAKING, MAX_SPEED, FRICTION, TURN_SPEED, CAMERA_DISTANCE, CAMERA_HEIGHT, CAMERA_SMOOTHNESS } from '../constants';
import { CarColor } from '../types';

interface CarProps {
  onSpeedChange: (speed: number) => void;
  positionRef: React.MutableRefObject<Vector3>;
}

export const Car: React.FC<CarProps> = ({ onSpeedChange, positionRef }) => {
  const groupRef = useRef<Group>(null);
  const controls = useControls();
  const { camera, scene } = useThree();
  
  // Physics state
  const speed = useRef(0);
  const velocityY = useRef(0); // Vertical velocity for gravity
  const rotation = useRef(0);
  const wheelRotation = useRef(0);
  const isGrounded = useRef(false);
  
  // Smoothing state
  const smoothedNormal = useRef(new Vector3(0, 1, 0));
  
  // Helpers
  const raycaster = useRef(new Raycaster());
  const downVector = useRef(new Vector3(0, -1, 0));
  const dummyObj = useRef(new Object3D());
  const targetCameraPos = useRef(new Vector3());

  // Constants
  const GRAVITY = 40.0;
  const WHEEL_RADIUS = 0.4;
  const MAX_STEP_HEIGHT = 2.0; // Increased to allow climbing steeper terrain segments
  const RESPAWN_HEIGHT = 10.0; // Height to respawn at to avoid getting stuck in floor

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // --- 1. INPUT & SPEED ---
    if (controls.forward) speed.current += ACCELERATION * delta;
    else if (controls.backward) speed.current -= ACCELERATION * delta;

    if (controls.brake) {
      speed.current -= Math.sign(speed.current) * BRAKING * delta;
      if (Math.abs(speed.current) < 1) speed.current = 0;
    } else {
      speed.current *= FRICTION;
    }
    speed.current = MathUtils.clamp(speed.current, -MAX_SPEED / 2, MAX_SPEED);

    if (Math.abs(speed.current) > 0.1) {
      const dir = Math.sign(speed.current);
      if (controls.left) rotation.current += TURN_SPEED * delta * dir;
      if (controls.right) rotation.current -= TURN_SPEED * delta * dir;
    }

    // --- 2. PREDICT NEXT POSITION (XZ) ---
    const moveDistance = speed.current * delta;
    const xMove = Math.sin(rotation.current) * moveDistance;
    const zMove = Math.cos(rotation.current) * moveDistance;
    
    let nextX = groupRef.current.position.x - xMove;
    let nextZ = groupRef.current.position.z - zMove;
    
    // --- 3. APPLY GRAVITY (Y) ---
    velocityY.current -= GRAVITY * delta;
    // Terminal velocity cap
    velocityY.current = Math.max(velocityY.current, -30); 
    
    let nextY = groupRef.current.position.y + velocityY.current * delta;

    // --- 4. COLLISION / GROUND DETECTION ---
    const terrainGroup = scene.getObjectByName('world-terrain');
    let targetNormal = new Vector3(0, 1, 0);
    
    if (terrainGroup) {
        // Cast ray from higher up to ensure we catch the ground even if we sink slightly
        // 5.0 units up gives plenty of buffer
        const rayOrigin = new Vector3(nextX, nextY + 5.0, nextZ);
        raycaster.current.set(rayOrigin, downVector.current);
        
        const intersects = raycaster.current.intersectObject(terrainGroup, true);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            const groundHeight = hit.point.y;
            
            // The car's bottom is at (nextY - WHEEL_RADIUS)
            const footPos = nextY - WHEEL_RADIUS;
            
            // How far is the foot from the ground?
            const distToGround = footPos - groundHeight;
            
            // Obstacle / Wall Detection (Step Height)
            // We only trigger this if the wall is significantly higher AND we are roughly at the same level (not falling from sky)
            // If we are falling (distToGround > 0), we ignore step height checks until we land.
            const currentFootY = groupRef.current.position.y - WHEEL_RADIUS;
            
            const isFalling = distToGround > 0.5; // We are well above the ground

            if (!isFalling && groundHeight > currentFootY + MAX_STEP_HEIGHT) {
                // Wall detected! Stop movement.
                speed.current = 0;
                nextX = groupRef.current.position.x;
                nextZ = groupRef.current.position.z;
                // Don't update Y based on this hit, let gravity handle it
            } 
            // Ground Logic
            // If we are close enough to snap
            else if (distToGround <= 0.2 && distToGround > -3.0) {
                // Landed
                nextY = groundHeight + WHEEL_RADIUS;
                velocityY.current = 0;
                isGrounded.current = true;
                if (hit.face) targetNormal.copy(hit.face.normal);
            } else {
                // In air
                isGrounded.current = false;
            }
        } else {
            isGrounded.current = false;
        }
    } else {
        isGrounded.current = false;
    }
    
    // Wall Normal Check: Stop if trying to drive up a vertical wall
    if (isGrounded.current && targetNormal.y < 0.5) {
         // Push normal up to prevent flipping
         targetNormal.set(0, 1, 0); 
         // Kill speed if we hit a steep slope head on? 
         // Optional: speed.current *= 0.95;
    }

    // Fallback Reset (Respawn)
    if (nextY < -50) {
        nextY = RESPAWN_HEIGHT;
        nextX = 0;
        nextZ = 0;
        velocityY.current = 0;
        speed.current = 0;
        rotation.current = 0;
    }

    // --- 5. UPDATE POSITION ---
    groupRef.current.position.set(nextX, nextY, nextZ);
    if (positionRef) positionRef.current.copy(groupRef.current.position);

    // --- 6. ORIENTATION STABILIZATION ---
    // Smoothly blend normal
    const lerpSpeed = isGrounded.current ? delta * 8 : delta * 1;
    smoothedNormal.current.lerp(targetNormal, lerpSpeed);
    
    if (smoothedNormal.current.lengthSq() < 0.1) smoothedNormal.current.set(0, 1, 0);
    smoothedNormal.current.normalize();

    dummyObj.current.position.copy(groupRef.current.position);
    dummyObj.current.up.copy(smoothedNormal.current);
    
    const lookTarget = new Vector3(
        nextX - Math.sin(rotation.current),
        nextY, 
        nextZ - Math.cos(rotation.current)
    );
    dummyObj.current.lookAt(lookTarget);
    
    groupRef.current.quaternion.slerp(dummyObj.current.quaternion, delta * 10);

    // --- 7. VISUALS ---
    wheelRotation.current += speed.current * delta * 0.5;
    onSpeedChange(Math.abs(speed.current));

    // --- 8. CAMERA ---
    const cx = nextX + Math.sin(rotation.current) * CAMERA_DISTANCE;
    const cz = nextZ + Math.cos(rotation.current) * CAMERA_DISTANCE;
    
    targetCameraPos.current.set(cx, nextY + CAMERA_HEIGHT, cz);
    camera.position.lerp(targetCameraPos.current, CAMERA_SMOOTHNESS);
    
    const focusPoint = groupRef.current.position.clone();
    focusPoint.y += 1.0; 
    
    const rightX = Math.cos(rotation.current);
    const rightZ = -Math.sin(rotation.current);
    focusPoint.x += rightX * state.pointer.x * 10;
    focusPoint.z += rightZ * state.pointer.x * 10;
    focusPoint.y += state.pointer.y * 5;

    camera.lookAt(focusPoint);
  });

  return (
    // Initial position raised to 10 to ensure we drop ONTO the floor, not inside it
    <group ref={groupRef} position={[0, RESPAWN_HEIGHT, 0]}>
      <group>
        {/* Chassis */}
        <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
            <boxGeometry args={[1.8, 0.5, 4]} />
            <meshStandardMaterial color={CarColor.NEON_BLUE} roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 0.8, -0.5]}>
            <boxGeometry args={[1.4, 0.6, 2]} />
            <meshStandardMaterial color={CarColor.DARK_METAL} roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 0.8, 1.8]}>
            <boxGeometry args={[2, 0.1, 0.5]} />
            <meshStandardMaterial color={CarColor.NEON_PINK} />
        </mesh>

        <Wheel position={[-1, 0, 1.2]} rotation={wheelRotation} />
        <Wheel position={[1, 0, 1.2]} rotation={wheelRotation} />
        <Wheel position={[-1, 0, -1.2]} rotation={wheelRotation} />
        <Wheel position={[1, 0, -1.2]} rotation={wheelRotation} />

        {/* Lights */}
        <mesh position={[-0.6, 0.3, -2.01]}>
            <planeGeometry args={[0.5, 0.2]} />
            <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.6, 0.3, -2.01]}>
            <planeGeometry args={[0.5, 0.2]} />
            <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.4, 2.01]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1.6, 0.2]} />
            <meshBasicMaterial color="#ff0000" />
        </mesh>
      </group>
    </group>
  );
};

const Wheel: React.FC<{ position: [number, number, number], rotation: React.MutableRefObject<number> }> = ({ position, rotation }) => {
  const meshRef = useRef<any>(null);
  useFrame(() => {
    if(meshRef.current) meshRef.current.rotation.x = rotation.current;
  });
  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}