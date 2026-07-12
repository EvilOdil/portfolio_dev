/**
 * Performance issue identification tests for Neon Drift Portfolio.
 *
 * Each test targets a specific performance antipattern found in the codebase.
 * Failing tests = confirmed performance issues that need fixing.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Helper: read source file content
// ---------------------------------------------------------------------------
function src(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, '..', relPath), 'utf-8');
}

// ===========================================================================
// 1. PER-FRAME HEAP ALLOCATIONS (GC pressure → frame drops)
// ===========================================================================
describe('Per-frame heap allocations in useFrame loops', () => {
  it('RoboticDog: should not allocate new Vector3 every frame for ray origin', () => {
    const code = src('components/RoboticDog.tsx');
    // Line 237: `const rayOrigin = new Vector3(nextX, nextY + 5.0, nextZ);`
    // This allocates a new object every single frame (~60/s). Should reuse a ref.
    const useFrameBody = code.slice(code.indexOf('useFrame('));
    const allocsInLoop = (useFrameBody.match(/new Vector3\(/g) || []).length;
    expect(
      allocsInLoop,
      'new Vector3() inside useFrame creates GC pressure every frame. ' +
      'Pre-allocate as a useRef and reuse with .set()'
    ).toBe(0);
  });

  it('RoboticDog: should not allocate new Vector3 for lookTarget every frame', () => {
    const code = src('components/RoboticDog.tsx');
    // Line 287: `const lookTarget = new Vector3(...)` inside useFrame
    const useFrameBody = code.slice(code.indexOf('useFrame('));
    expect(
      useFrameBody.includes('lookTarget = new Vector3'),
      'lookTarget allocates a new Vector3 every frame. Use a ref.'
    ).toBe(false);
  });

  it('RoboticDog: should not clone position for focusPoint every frame', () => {
    const code = src('components/RoboticDog.tsx');
    // `const focusPoint = group.current.position.clone()` allocates every frame.
    // Using .copy() on a pre-allocated ref is acceptable.
    // hit.face.normal.clone() in collision code is OK (only runs on collision, not every frame).
    const useFrameBody = code.slice(code.indexOf('useFrame('));
    const hasFocusPointClone = useFrameBody.includes('position.clone()');
    expect(
      hasFocusPointClone,
      'position.clone() inside useFrame allocates every frame. Use .copy() on a pre-allocated ref.'
    ).toBe(false);
  });

  it('InteractionManager: should not allocate new Vector3 per zone per frame', () => {
    const code = src('components/ThreeScene.tsx');
    // `new Vector3(...zone.position)` inside useFrame for EACH zone would be
    // 8 allocations × 60fps = 480 allocs/sec. Zone positions must be
    // pre-computed once.
    const interactionBlock = code.slice(
      code.indexOf('const InteractionManager'),
      code.indexOf('return null;')
    );
    expect(
      interactionBlock.includes('new Vector3('),
      'InteractionManager allocates new Vector3 per zone per frame. ' +
      'Pre-compute zone positions as Vector3 refs.'
    ).toBe(false);
  });
});

// ===========================================================================
// 2. COLLISION SYSTEM (robot falls through floor / walks through walls)
// ===========================================================================
describe('Collision detection completeness', () => {
  it('collision module: uses a BVH acceleration structure (three-mesh-bvh)', () => {
    const code = src('services/collision.ts');
    // Brute-force Raycaster.intersectObject against the 6MB factory model
    // tests every triangle per ray. BVH turns that into a tree descent.
    expect(code.includes('three-mesh-bvh') && code.includes('MeshBVH')).toBe(true);
  });

  it('collision module: raycasts are double-sided so FrontSide materials cannot hide walls', () => {
    const code = src('services/collision.ts');
    // Render materials use FrontSide (z-fighting fix in FactoryWorld). A
    // side-respecting raycast would make walls with away-facing normals
    // walk-through. Collision must pass DoubleSide to the BVH raycast.
    expect(code.includes('DoubleSide')).toBe(true);
  });

  it('RoboticDog: has horizontal wall raycasts at multiple heights', () => {
    const code = src('components/RoboticDog.tsx');
    // A single ray at one height misses railings, window gaps, and corners.
    const match = code.match(/WALL_RAY_HEIGHTS\s*=\s*\[([^\]]*)\]/);
    const heightCount = match ? match[1].split(',').length : 0;
    expect(
      heightCount,
      'Wall collision needs rays at 2+ heights above MAX_STEP_HEIGHT.'
    ).toBeGreaterThanOrEqual(2);
  });

  it('RoboticDog: ground ray originates just above step height, not high overhead', () => {
    const code = src('components/RoboticDog.tsx');
    // A ray cast from +15 above the dog hits roofs/catwalks instead of the
    // floor beneath, so the snap branch never fires and the dog sinks through
    // the floor. The origin must sit below ceilings: MAX_STEP_HEIGHT + ε.
    expect(code.includes('GROUND_CLEARANCE')).toBe(true);
    expect(
      /nextY\s*\+\s*15/.test(code),
      'Ground ray must not originate 15 units overhead — roofs shadow the floor.'
    ).toBe(false);
  });

  it('RoboticDog: clamps delta so a stalled frame cannot tunnel through geometry', () => {
    const code = src('components/RoboticDog.tsx');
    // WALK_SPEED=12 at 10fps → 1.2 units/frame, enough to skip a thin wall.
    // Clamping delta to 1/30 caps movement at 0.4 units/frame.
    expect(code.includes('Math.min(delta, 1 / 30)')).toBe(true);
  });

  it('RoboticDog: snaps up from sub-ground clips (no lower snap bound)', () => {
    const code = src('components/RoboticDog.tsx');
    // The old snap window (distToGround > -3.0) let a dog embedded deeper
    // than 3 units keep falling. Snapping must have no lower bound.
    expect(code.includes('GROUND_SNAP_DIST')).toBe(true);
    expect(
      /distToGround\s*>\s*-[\d.]+/.test(code),
      'Snap logic must not have a lower distToGround bound.'
    ).toBe(false);
  });

  it('RoboticDog: void respawn threshold should be -20 or higher', () => {
    const code = src('components/RoboticDog.tsx');
    const constMatch = code.match(/VOID_THRESHOLD\s*=\s*(-[\d.]+)/);
    const threshold = constMatch ? parseFloat(constMatch[1]) : -50;
    expect(
      threshold,
      `VOID_THRESHOLD is ${threshold}. Should be -20 or higher so falls respawn quickly.`
    ).toBeGreaterThanOrEqual(-20);
  });
});

// ===========================================================================
// 3. BUNDLE SIZE & CODE SPLITTING
// ===========================================================================
describe('Bundle optimization', () => {
  it('should use dynamic imports for heavy components', () => {
    const code = src('App.tsx');
    // All 3D components are statically imported, creating a single 1.2MB chunk.
    // FactoryWorld, RoboticDog, FactoryScenery, and three.js could be lazy-loaded.
    const hasLazyImport =
      code.includes('React.lazy(') || code.includes('lazy(');
    expect(
      hasLazyImport,
      'All components are statically imported creating a 1.2MB monolithic bundle. ' +
      'Use React.lazy() for heavy 3D components (FactoryWorld, RoboticDog) to code-split.'
    ).toBe(true);
  });

  it('should not include unused Car component in imports', () => {
    const code = src('App.tsx');
    // Line 8: Car.tsx is commented out but still exists in codebase
    const carFileExists = fs.existsSync(
      path.resolve(__dirname, '..', 'components/Car.tsx')
    );
    expect(
      carFileExists,
      'Car.tsx exists but is unused (commented import in App.tsx). Dead code increases bundle.'
    ).toBe(false);
  });
});

// ===========================================================================
// 4. UNNECESSARY RE-RENDERS
// ===========================================================================
describe('React re-render optimization', () => {
  it('App: onClose handler should be memoized', () => {
    const code = src('App.tsx');
    // Line 227: `onClose={() => setActiveZone(null)}` — inline arrow creates new ref every render,
    // causing UIOverlay to re-render even when nothing changed.
    const hasInlineOnClose = /onClose=\{[^}]*=>[^}]*\}/.test(code);
    const hasMemoizedOnClose =
      code.includes('useCallback') &&
      (code.includes('handleClose') || code.includes('onClose'));

    expect(
      !hasInlineOnClose || hasMemoizedOnClose,
      'onClose={() => setActiveZone(null)} creates a new function reference every render, ' +
      'causing UIOverlay to re-render needlessly. Wrap in useCallback.'
    ).toBe(true);
  });

  it('HudNavigation: event handlers should not leak (missing deps)', () => {
    const code = src('components/HudNavigation.tsx');
    // Lines 98-104: handleMouseMove/handleMouseUp are recreated every render
    // but useEffect depends on [isDragging, activeTickIndex] — stale closure risk
    const hasMemoizedHandlers =
      code.includes('useCallback') &&
      (code.includes('handleMouseMove') || code.includes('handleMouseUp'));

    expect(
      hasMemoizedHandlers,
      'handleMouseMove and handleMouseUp are recreated every render and re-attached as ' +
      'window listeners. Use useCallback or define handlers inside the effect.'
    ).toBe(true);
  });
});

// ===========================================================================
// 5. CSS ISSUES
// ===========================================================================
describe('CSS correctness', () => {
  it('MobileControls.css: should have balanced braces', () => {
    const css = src('components/MobileControls.css');
    const opens = (css.match(/\{/g) || []).length;
    const closes = (css.match(/\}/g) || []).length;
    expect(
      opens,
      `MobileControls.css has ${opens} opening braces and ${closes} closing braces. ` +
      'The build warns about unbalanced CSS. Missing closing brace for .mobile-controls-overlay.'
    ).toBe(closes);
  });
});

// ===========================================================================
// 6. 3D SCENE OPTIMIZATION
// ===========================================================================
describe('Three.js scene optimization', () => {
  it('Zone: should not have per-instance pointLights', () => {
    const code = src('components/Zone.tsx');
    // Each Zone renders its own pointLight (line 52). With 8 zones that's 8 dynamic lights,
    // each requiring a separate lighting pass. Use emissive materials instead.
    const hasPointLight = code.includes('<pointLight');
    expect(
      hasPointLight,
      '8 zones × 1 pointLight each = 8 dynamic lights in the scene. ' +
      'Each adds a lighting pass. Replace with emissive materials for static glow.'
    ).toBe(false);
  });

  it('unused scenery components stay deleted (dead code)', () => {
    // Car.tsx, Ground.tsx and FactoryScenery.tsx were unreferenced dead code
    for (const dead of ['components/FactoryScenery.tsx', 'components/Ground.tsx']) {
      expect(
        fs.existsSync(path.resolve(__dirname, '..', dead)),
        `${dead} is dead code that was removed — do not reintroduce without wiring it up.`
      ).toBe(false);
    }
  });

  it('Zone ringGeometry should use fewer segments', () => {
    const code = src('components/Zone.tsx');
    // Line 47: `<ringGeometry args={[3, 3.5, 32]} />` — 32 segments for a ground ring
    // that's barely visible. 16 is sufficient.
    const match = code.match(/ringGeometry args=\{[^}]*,\s*(\d+)/);
    const segments = match ? parseInt(match[1]) : 0;
    expect(
      segments,
      `Ring geometry uses ${segments} segments. For a ground marker that's mostly hidden, ` +
      '16 segments saves geometry without visible quality loss.'
    ).toBeLessThanOrEqual(16);
  });
});

// ===========================================================================
// 7. SCENE LOOKUP PERFORMANCE
// ===========================================================================
describe('Scene graph lookups', () => {
  it('RoboticDog: should not traverse the scene graph every frame', () => {
    const code = src('components/RoboticDog.tsx');
    const useFrameBody = code.slice(code.indexOf('useFrame('));
    // The collision module keeps its own mesh registry; the physics loop
    // must not walk the scene graph (getObjectByName) per frame.
    expect(
      useFrameBody.includes('getObjectByName'),
      'getObjectByName inside useFrame walks the scene graph every frame. ' +
      'Query the collision module registry instead.'
    ).toBe(false);
  });
});

// ===========================================================================
// 8. CONSOLE LOGGING IN PRODUCTION
// ===========================================================================
describe('Production readiness', () => {
  it('FactoryWorld: should not have console.log in production code', () => {
    const code = src('components/FactoryWorld.tsx');
    const logCount = (code.match(/console\.log/g) || []).length;
    expect(
      logCount,
      `FactoryWorld.tsx has ${logCount} console.log calls that run on every mount. ` +
      'Remove or gate behind a debug flag.'
    ).toBe(0);
  });

  it('UIOverlay: should not log filter results', () => {
    const code = src('components/UIOverlay.tsx');
    const useFrameOrFilter = code.slice(code.indexOf('filteredProjects'));
    const hasLog = useFrameOrFilter.includes('console.log');
    expect(
      hasLog,
      'filteredProjects() logs filter results every time tags change. Remove debug logging.'
    ).toBe(false);
  });
});

// ===========================================================================
// 9. SHADOW MAP WASTE
// ===========================================================================
describe('Shadow optimization', () => {
  it('RoboticDog pointLight should not cast shadows unnecessarily', () => {
    const code = src('components/RoboticDog.tsx');
    // The robot's local highlight light doesn't need shadow casting
    // (it just makes the robot visible in the dark). Shadow maps are expensive.
    const pointLightBlock = code.slice(
      code.indexOf('<pointLight'),
      code.indexOf('/>', code.indexOf('<pointLight')) + 2
    );
    const castsShadow =
      pointLightBlock.includes('castShadow') &&
      !pointLightBlock.includes('castShadow={false}');
    expect(
      castsShadow,
      'The robot highlight pointLight casts shadows by default, adding an expensive shadow pass. ' +
      'Add castShadow={false} since this light is just for visibility.'
    ).toBe(false);
  });
});

// ===========================================================================
// 10. MEMORY LEAK: TERMINAL ANIMATION
// ===========================================================================
describe('Memory and lifecycle', () => {
  it('TerminalLanding: animation interval should be cleaned up', () => {
    const code = src('components/TerminalLanding.tsx');
    // Line 284: setInterval in executeCommand — if component unmounts mid-animation,
    // the interval keeps running (no cleanup).
    const hasIntervalCleanup =
      code.includes('clearInterval') &&
      // Check if clearInterval is in a return/cleanup path, not just in the interval callback
      (code.includes('return () =>') || code.includes('useEffect'));

    // The interval IS cleared inside its own callback, but if the component unmounts
    // before all lines are displayed, the interval leaks.
    const execBlock = code.slice(
      code.indexOf('const executeCommand'),
      code.indexOf('Auto-scroll')
    );
    const intervalIsStoredInRef = execBlock.includes('useRef') || execBlock.includes('intervalRef') || execBlock.includes('IntervalRef');

    expect(
      intervalIsStoredInRef,
      'setInterval in executeCommand is not stored in a ref and has no cleanup on unmount. ' +
      'If the terminal unmounts mid-animation, the interval leaks. Store in a ref and clear on unmount.'
    ).toBe(true);
  });
});
