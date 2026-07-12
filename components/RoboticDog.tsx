import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Group, Mesh, Vector3, Object3D, Box3, LoopRepeat, CatmullRomCurve3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from '../hooks/useControls';
import { BAKED_PATH } from '../services/bakedPath';
import { isCollisionReady, groundHeightAt, raycastCollision } from '../services/collision';

// Helper to get global analog turn value (set by MobileControls)
function getMobileTurnAmount(): number | null {
  if (typeof window !== 'undefined' && typeof (window as any).__mobileTurnAmount === 'number') {
    return (window as any).__mobileTurnAmount;
  }
  return null;
}

interface RoboticDogProps {
  onSpeedChange: (speed: number) => void;
  positionRef: React.MutableRefObject<Vector3>;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  controlsEnabled?: boolean;
  panTilt?: React.RefObject<{ x: number; y: number }>;
  teleportTarget?: { x: number; y: number; z: number; rotation?: number } | null;
  onTeleportComplete?: () => void;
  selectedMode?: 'TELEOP' | 'AUTO' | null;
  scrollProgressRef?: React.MutableRefObject<number>;
}

export const RoboticDog: React.FC<RoboticDogProps> = ({
  onSpeedChange,
  positionRef,
  position = [0, 10, 0],
  rotation = [0, 0, 0],
  scale = 1,
  controlsEnabled = true,
  panTilt,
  teleportTarget,
  onTeleportComplete,
  selectedMode,
  scrollProgressRef,
}) => {
  const group = useRef<Group>(null);
  const { scene: modelScene, animations: rawAnimations } = useGLTF('/models/walking_robotic_dog_draco.glb');
  
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

  // Pre-baked A* path (generated offline by scripts/bakePath.ts)
  const autoPath = useMemo(
    () => new CatmullRomCurve3(BAKED_PATH.map(([x, z]) => new Vector3(x, 0, z)), false, 'centripetal'),
    []
  );
  const pathLength = useMemo(() => autoPath.getLength(), [autoPath]);
  // Carrot-follow state: the point on the curve the dog actually chases
  const followT = useRef(0);
  const carrotPt = useRef(new Vector3());
  // Carrot may advance only while the dog is within this distance of it.
  // Dog speed is min(dist*3, WALK_SPEED), so ~4 keeps it at full speed.
  const CARROT_LEAD = 4.0;

  // Use modelScene as the root for animations to ensure correct bindings
  const { actions } = useAnimations(animations, modelScene);
  
  const controls = useControls();
  const { camera } = useThree();
  
  // State for animation
  const [moving, setMoving] = useState(false);
  
  // Model adjustments for stability
  const [modelOffset, setModelOffset] = useState(0);

  // Physics Refs
  const facingAngle = useRef(rotation[1]);
  const velocityY = useRef(0);
  const isGrounded = useRef(false);
  
  // Store initial position for respawning
  const initialPosition = useRef(position);
  const initialRotation = useRef(rotation[1]);
  
  // Teleport handling
  const lastTeleportTarget = useRef<{ x: number; y: number; z: number } | null>(null);
  
  // Helpers — all pre-allocated, reused every frame (no per-frame GC)
  const dummyObj = useRef(new Object3D());
  const targetCameraPos = useRef(new Vector3());
  const wallRayOrigin = useRef(new Vector3());
  const wallRayDir = useRef(new Vector3());
  const lookTarget = useRef(new Vector3());
  const focusPoint = useRef(new Vector3());

  // Constants
  const WALK_SPEED = 12.0;
  const TURN_SPEED = 2.5;
  const GRAVITY = 60.0;
  // Adjusted for larger scale (scale=2.2 vs previous 1.5)
  const CAMERA_DISTANCE = 16;
  const CAMERA_HEIGHT = 10;
  const CAMERA_SMOOTHNESS = 0.1;
  const MAX_STEP_HEIGHT = 1.5;
  // Ground ray starts this far above the feet: above any climbable step,
  // below any ceiling — so overhead geometry can never shadow the floor.
  const GROUND_CLEARANCE = MAX_STEP_HEIGHT + 0.1;
  // Snap to the floor when within this distance above it. There is no lower
  // bound: any sub-ground clip snaps back up instead of falling through.
  const GROUND_SNAP_DIST = 0.5;
  // Wall rays fire at these heights above the feet. Both start above
  // MAX_STEP_HEIGHT so climbable steps never register as walls.
  const WALL_RAY_HEIGHTS = [GROUND_CLEARANCE, 2.6];
  // Distance from robot centre at which movement is blocked. Must be >= body radius
  // (~1.5 units at scale 2.2) so the surface never reaches the wall.
  const WALL_DETECT_DIST = 3.0;
  // Hard boundary — keeps the robot inside the playable area regardless of geometry
  const WORLD_BOUND = 90;
  // Below this Y the robot has left the world and respawns
  const VOID_THRESHOLD = -20;

  // Handle teleportation
  useEffect(() => {
    if (teleportTarget && group.current) {
      // Check if this is a new teleport target
      if (!lastTeleportTarget.current || 
          lastTeleportTarget.current.x !== teleportTarget.x ||
          lastTeleportTarget.current.y !== teleportTarget.y ||
          lastTeleportTarget.current.z !== teleportTarget.z) {
        
        // Teleport the robot
        group.current.position.set(teleportTarget.x, teleportTarget.y, teleportTarget.z);
        velocityY.current = 0;
        isGrounded.current = false;
        
        // Update facing angle if provided
        if (teleportTarget.rotation !== undefined) {
          facingAngle.current = teleportTarget.rotation;
        }
        
        // Update positionRef
        if (positionRef) {
          positionRef.current.copy(group.current.position);
        }
        
        // Update camera immediately
        const cx = teleportTarget.x + Math.sin(facingAngle.current) * CAMERA_DISTANCE;
        const cz = teleportTarget.z + Math.cos(facingAngle.current) * CAMERA_DISTANCE;
        camera.position.set(cx, teleportTarget.y + CAMERA_HEIGHT, cz);
        camera.lookAt(new Vector3(teleportTarget.x, teleportTarget.y + 2, teleportTarget.z));
        
        lastTeleportTarget.current = { ...teleportTarget };
        
        if (onTeleportComplete) {
          onTeleportComplete();
        }
      }
    }
  }, [teleportTarget, camera, onTeleportComplete, positionRef]);


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
    // Clamp delta to 1/30s so a stalled frame can't tunnel through terrain.
    delta = Math.min(delta, 1 / 30);

    // --- 1 & 2. CONTROLS + MOVEMENT ---
    let speed = 0;
    let nextX: number;
    let nextZ: number;

    if (selectedMode === 'AUTO' && scrollProgressRef) {
      // Follow the pre-baked A* spline with a "carrot" that moves ALONG the
      // curve toward the scroll position — at most at walk speed, and only
      // while the dog is close to it. Chasing getPointAt(scrollT) directly
      // let the dog beeline straight across the map (through ledges and
      // walls) whenever the scroll jumped ahead of it.
      const targetT = Math.max(0, Math.min(1, scrollProgressRef.current));
      autoPath.getPointAt(followT.current, carrotPt.current);
      let dx = carrotPt.current.x - group.current.position.x;
      let dz = carrotPt.current.z - group.current.position.z;
      let dist = Math.hypot(dx, dz);

      if (dist < CARROT_LEAD) {
        // 1.25× walk speed so the dog can reach full speed without the
        // carrot throttling it; parameter is arc-length so this maps
        // directly to distance along the curve.
        const maxStep = (WALK_SPEED * 1.25 * delta) / pathLength;
        const diff = targetT - followT.current;
        followT.current += Math.max(-maxStep, Math.min(maxStep, diff));
        autoPath.getPointAt(followT.current, carrotPt.current);
        dx = carrotPt.current.x - group.current.position.x;
        dz = carrotPt.current.z - group.current.position.z;
        dist = Math.hypot(dx, dz);
      }

      if (dist > 0.15) {
        const autoSpeed = Math.min(dist * 3, WALK_SPEED);
        const step = Math.min(autoSpeed * delta, dist);
        nextX = group.current.position.x + (dx / dist) * step;
        nextZ = group.current.position.z + (dz / dist) * step;
        const targetAngle = Math.atan2(-dx, -dz);
        const diff = ((targetAngle - facingAngle.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        facingAngle.current += diff * Math.min(delta * 8, 1);
        speed = autoSpeed;
      } else {
        nextX = group.current.position.x;
        nextZ = group.current.position.z;
      }
    } else {
      // TELEOP: keyboard / joystick
      if (controlsEnabled) {
        if (controls.forward) speed = WALK_SPEED;
        if (controls.backward) speed = -WALK_SPEED;

        const analogTurn = getMobileTurnAmount();
        if (Math.abs(speed) > 0.1 && analogTurn !== null) {
          facingAngle.current += TURN_SPEED * analogTurn * delta;
        } else if (Math.abs(speed) > 0.1) {
          if (controls.left) facingAngle.current += TURN_SPEED * delta;
          if (controls.right) facingAngle.current -= TURN_SPEED * delta;
        }
      }
      const moveDist = speed * delta;
      nextX = group.current.position.x - Math.sin(facingAngle.current) * moveDist;
      nextZ = group.current.position.z - Math.cos(facingAngle.current) * moveDist;
    }

    // Update animation state only on change to prevent re-triggering effect
    const isMovingNow = Math.abs(speed) > 0.1;
    if (isMovingNow !== moving) setMoving(isMovingNow);

    // --- 3. GROUND DETECTION (BVH collision, see services/collision.ts) ---
    // Collision meshes register once the factory model has loaded (~2s after
    // the dog). Skip physics until then so gravity cannot accumulate and
    // trigger the respawn loop before the floor exists.
    if (!isCollisionReady()) {
        velocityY.current = 0;
        return;
    }

    velocityY.current -= GRAVITY * delta;
    velocityY.current = Math.max(velocityY.current, -30);

    let nextY = group.current.position.y + velocityY.current * delta;

    // Cast down from GROUND_CLEARANCE above the feet at the proposed XZ. The
    // origin sits below any roof/catwalk overhead, so the first hit is always
    // the walkable floor — overhead geometry can no longer shadow the ground
    // ray and let the dog sink through the real floor.
    const groundY = groundHeightAt(nextX, group.current.position.y, nextZ, GROUND_CLEARANCE);
    if (groundY !== null && nextY - groundY <= GROUND_SNAP_DIST) {
        // On the floor, clipped slightly below it, or facing a climbable step
        nextY = groundY;
        velocityY.current = 0;
        isGrounded.current = true;
    } else {
        isGrounded.current = false;
    }

    // --- WALL COLLISION (double-sided BVH rays at two heights) ---
    // Cast in the movement direction. If a wall is within WALL_DETECT_DIST,
    // try to slide along X or Z instead of stopping cold.
    const moveX = nextX - group.current.position.x;
    const moveZ = nextZ - group.current.position.z;
    const moveLen = Math.hypot(moveX, moveZ);

    if (moveLen > 0.001) {
      const pos = group.current.position;
      const far = WALL_DETECT_DIST + moveLen;

      const blockedInDir = (dx: number, dz: number): boolean => {
        wallRayDir.current.set(dx, 0, dz);
        for (const h of WALL_RAY_HEIGHTS) {
          wallRayOrigin.current.set(pos.x, pos.y + h, pos.z);
          const dist = raycastCollision(wallRayOrigin.current, wallRayDir.current, far);
          if (dist !== null && dist < WALL_DETECT_DIST) return true;
        }
        return false;
      };

      if (blockedInDir(moveX / moveLen, moveZ / moveLen)) {
        const xBlocked = Math.abs(moveX) > 0.001 ? blockedInDir(Math.sign(moveX), 0) : true;
        const zBlocked = Math.abs(moveZ) > 0.001 ? blockedInDir(0, Math.sign(moveZ)) : true;

        if (!xBlocked) {
          nextZ = group.current.position.z;       // slide along X axis
        } else if (!zBlocked) {
          nextX = group.current.position.x;       // slide along Z axis
        } else {
          nextX = group.current.position.x;       // fully blocked
          nextZ = group.current.position.z;
        }
      }
    }

    // Hard world boundary — prevents walking off the edge of the loaded terrain
    nextX = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, nextX));
    nextZ = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, nextZ));

    // Respawn at starting position if fallen off the world
    if (nextY < VOID_THRESHOLD) {
        nextY = initialPosition.current[1];
        nextX = initialPosition.current[0];
        nextZ = initialPosition.current[2];
        facingAngle.current = initialRotation.current;
        velocityY.current = 0;
    }

    // --- 4. APPLY TRANSFORM ---
    group.current.position.set(nextX, nextY, nextZ);
    if (positionRef) positionRef.current.copy(group.current.position);

    // --- 5. STABLE UPRIGHT ALIGNMENT ---
    // Force Up vector to always be (0,1,0) to prevent jitter/rolling
    dummyObj.current.position.copy(group.current.position);
    dummyObj.current.up.set(0, 1, 0);
    
    lookTarget.current.set(
        nextX - Math.sin(facingAngle.current),
        nextY,
        nextZ - Math.cos(facingAngle.current)
    );

    dummyObj.current.lookAt(lookTarget.current);
    group.current.quaternion.slerp(dummyObj.current.quaternion, delta * 15);

    // Quantize to 0.5 steps: raw AUTO speed varies every frame, and each new
    // value re-renders the whole App tree (HUD, overlays) at 60fps
    onSpeedChange(Math.round(Math.abs(speed) * 2) / 2);

    // --- 8. CAMERA ---
    let panX = 0, panY = 0;
    if (panTilt && panTilt.current) {
      panX = panTilt.current.x;
      panY = panTilt.current.y;
    } else {
      panX = state.pointer.x;
      panY = state.pointer.y;
    }
    const cx = nextX + Math.sin(facingAngle.current) * CAMERA_DISTANCE;
    const cz = nextZ + Math.cos(facingAngle.current) * CAMERA_DISTANCE;
    targetCameraPos.current.set(cx, nextY + CAMERA_HEIGHT, cz);
    camera.position.lerp(targetCameraPos.current, CAMERA_SMOOTHNESS);
    focusPoint.current.copy(group.current.position);
    focusPoint.current.y += 2.0 + panY * 5;
    focusPoint.current.x += Math.cos(facingAngle.current) * panX * 5;
    focusPoint.current.z += -Math.sin(facingAngle.current) * panX * 5;
    camera.lookAt(focusPoint.current);
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

useGLTF.preload('/models/walking_robotic_dog_draco.glb');