import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Group, Mesh, Vector3, Raycaster, Object3D, Box3, LoopRepeat } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from '../hooks/useControls';

interface RoboticDogProps {
  onSpeedChange: (speed: number) => void;
  positionRef: React.MutableRefObject<Vector3>;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export const RoboticDog: React.FC<RoboticDogProps> = ({ 
  onSpeedChange, 
  positionRef,
  position = [0, 10, 0], 
  rotation = [0, 0, 0], 
  scale = 1 
}) => {
  const group = useRef<Group>(null);
  const { scene: modelScene, animations: rawAnimations } = useGLTF('/models/walking_robotic_dog.glb');
  
  // FIX: Trim animation to remove stuck frames at the end
  // We clone the clips and reduce duration to loop only the walking part
  const animations = useMemo(() => {
    if (!rawAnimations) return [];
    return rawAnimations.map((clip) => {
        const cloned = clip.clone();
        // Cut the last 40% of the animation to remove the idle/stuck pose at the end.
        // Previously 0.75, reduced to 0.6 to be more aggressive.
        cloned.duration = clip.duration * 0.6; 
        return cloned;
    });
  }, [rawAnimations]);

  // Use modelScene as the root for animations to ensure correct bindings
  const { actions } = useAnimations(animations, modelScene);
  
  const controls = useControls();
  const { camera, scene: globalScene } = useThree();
  
  // State for animation
  const [moving, setMoving] = useState(false);
  
  // Model adjustments for stability
  const [modelOffset, setModelOffset] = useState(0);

  // Physics Refs
  const facingAngle = useRef(rotation[1]);
  const velocityY = useRef(0);
  const isGrounded = useRef(false);
  
  // Helpers
  const raycaster = useRef(new Raycaster());
  const downVector = useRef(new Vector3(0, -1, 0));
  const dummyObj = useRef(new Object3D());
  const targetCameraPos = useRef(new Vector3());

  // Constants
  const WALK_SPEED = 12.0;
  const TURN_SPEED = 2.5;
  const GRAVITY = 60.0; 
  // Adjusted for larger scale (scale=2.2 vs previous 1.5)
  const CAMERA_DISTANCE = 16; 
  const CAMERA_HEIGHT = 10;
  const CAMERA_SMOOTHNESS = 0.1;
  const MAX_STEP_HEIGHT = 1.5;
  const RESPAWN_HEIGHT = 10.0;

  // Initialize: Shadows & Bounding Box Calculation
  useEffect(() => {
     if (!modelScene) return;

     // 1. Shadows
     modelScene.traverse((child) => {
        if ((child as Mesh).isMesh) {
           child.castShadow = true;
           child.receiveShadow = true;
           
           // Highlight Fix: Make the robot's material slightly emissive or lighter if possible
           // to combat the dark scene.
           if ((child as any).material) {
             // If it has a standard material, bump up metalness/roughness interaction
             // or add a slight emissive glow if it's too dark.
             const mat = (child as any).material;
             if (mat.emissive) {
                mat.emissive.setHex(0x222222); // Slight grey glow
                mat.emissiveIntensity = 0.2;
             }
           }
        }
     });

     // 2. Calculate Bounding Box to fix Pivot Point
     const box = new Box3().setFromObject(modelScene);
     const minY = box.min.y;
     setModelOffset(-minY); // Shift model up/down so feet are at 0
     
  }, [modelScene]);

  // Handle Animation
  useEffect(() => {
    const actionKeys = Object.keys(actions);
    if (actionKeys.length === 0) return;
    
    // Try to find a walk/run animation, otherwise default to first
    const walkKey = actionKeys.find(key => /walk|run|move/i.test(key)) || actionKeys[0];
    const mainAction = actions[walkKey];
    
    if (!mainAction) return;

    if (moving) {
        // Ensure it loops
        mainAction.setLoop(LoopRepeat, Infinity);
        mainAction.clampWhenFinished = false;
        mainAction.timeScale = 1.5;
        
        // Reset and play if not already running effectively
        // usage of reset() ensures it starts from beginning or cleans up paused state
        mainAction.reset().fadeIn(0.2).play();
    } else {
        mainAction.fadeOut(0.2);
    }
    
    // Cleanup is handled by fadeOut logic
  }, [moving, actions]);

  useFrame((state, delta) => {
    if (!group.current) return;

    // --- 1. CONTROLS ---
    let speed = 0;
    if (controls.forward) speed = WALK_SPEED;
    if (controls.backward) speed = -WALK_SPEED; // Full speed backwards

    if (Math.abs(speed) > 0.1) {
        if (controls.left) facingAngle.current += TURN_SPEED * delta;
        if (controls.right) facingAngle.current -= TURN_SPEED * delta;
    }

    // Update animation state only on change to prevent re-triggering effect
    const isMovingNow = Math.abs(speed) > 0.1;
    if (isMovingNow !== moving) setMoving(isMovingNow);

    // --- 2. PHYSICS ---
    const moveDist = speed * delta;
    const vx = Math.sin(facingAngle.current) * moveDist;
    const vz = Math.cos(facingAngle.current) * moveDist;

    let nextX = group.current.position.x - vx; 
    let nextZ = group.current.position.z - vz;

    velocityY.current -= GRAVITY * delta;
    velocityY.current = Math.max(velocityY.current, -30);
    
    let nextY = group.current.position.y + velocityY.current * delta;

    // --- 3. ROBUST GROUND DETECTION ---
    const terrainGroup = globalScene.getObjectByName('world-terrain');
    
    if (terrainGroup) {
        // Cast ray from center, but slightly elevated
        const rayOrigin = new Vector3(nextX, nextY + 5.0, nextZ);
        raycaster.current.set(rayOrigin, downVector.current);
        
        const intersects = raycaster.current.intersectObject(terrainGroup, true);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const groundHeight = hit.point.y;
            const distToGround = nextY - groundHeight;
            
            // Falling?
            const isFalling = distToGround > 1.0; 

            // Collision with Wall
            if (!isFalling && groundHeight > nextY + MAX_STEP_HEIGHT) {
                nextX = group.current.position.x;
                nextZ = group.current.position.z;
            } 
            // Snap to Ground
            else if (distToGround <= 0.5 && distToGround > -3.0) {
                nextY = groundHeight;
                velocityY.current = 0;
                isGrounded.current = true;
            } else {
                isGrounded.current = false;
            }
        } else {
            isGrounded.current = false;
        }
    }

    // Respawn
    if (nextY < -50) {
        nextY = RESPAWN_HEIGHT;
        nextX = 0;
        nextZ = 0;
        velocityY.current = 0;
    }

    // --- 4. APPLY TRANSFORM ---
    group.current.position.set(nextX, nextY, nextZ);
    if (positionRef) positionRef.current.copy(group.current.position);

    // --- 5. STABLE UPRIGHT ALIGNMENT ---
    // Force Up vector to always be (0,1,0) to prevent jitter/rolling
    dummyObj.current.position.copy(group.current.position);
    dummyObj.current.up.set(0, 1, 0);
    
    const lookTarget = new Vector3(
        nextX - Math.sin(facingAngle.current),
        nextY,
        nextZ - Math.cos(facingAngle.current)
    );
    
    dummyObj.current.lookAt(lookTarget);
    group.current.quaternion.slerp(dummyObj.current.quaternion, delta * 15);

    onSpeedChange(Math.abs(speed));

    // --- 6. CAMERA ---
    const cx = nextX + Math.sin(facingAngle.current) * CAMERA_DISTANCE;
    const cz = nextZ + Math.cos(facingAngle.current) * CAMERA_DISTANCE;
    
    targetCameraPos.current.set(cx, nextY + CAMERA_HEIGHT, cz);
    camera.position.lerp(targetCameraPos.current, CAMERA_SMOOTHNESS);
    
    const focusPoint = group.current.position.clone();
    focusPoint.y += 2.0;
    focusPoint.x += Math.cos(facingAngle.current) * state.pointer.x * 5;
    focusPoint.z += -Math.sin(facingAngle.current) * state.pointer.x * 5;
    focusPoint.y += state.pointer.y * 5;

    camera.lookAt(focusPoint);
  });

  return (
    <group ref={group} scale={scale} dispose={null} position={position}>
      {/* 
         Local Light: Highlights the robot in the dark factory environment 
         Positioned slightly above and forward
      */}
      <pointLight 
        position={[0, 3, 0]} 
        intensity={2.0} 
        distance={15} 
        decay={2} 
        color="#aaccff" 
      />

      {/* 
          Model Container with Offset 
          Moves the model so its feet are at local Y=0 
      */}
      <group position={[0, modelOffset, 0]}>
         <primitive object={modelScene} />
      </group>
    </group>
  );
};

useGLTF.preload('/models/walking_robotic_dog.glb');