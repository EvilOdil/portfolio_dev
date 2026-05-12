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
    const code = src('App.tsx');
    // Line 32: `new Vector3(...zone.position)` inside useFrame for EACH zone
    // With 8 zones, this is 8 allocations * 60fps = 480 allocs/sec
    const interactionBlock = code.slice(
      code.indexOf('InteractionManager'),
      code.indexOf('return null;')
    );
    expect(
      interactionBlock.includes('new Vector3('),
      'InteractionManager allocates new Vector3 per zone per frame (8 zones × 60fps = 480 allocs/sec). ' +
      'Pre-compute zone positions as Vector3 refs.'
    ).toBe(false);
  });
});

// ===========================================================================
// 2. COLLISION SYSTEM GAPS (robot falls through walls)
// ===========================================================================
describe('Collision detection completeness', () => {
  it('RoboticDog: should have horizontal raycasts for wall collision', () => {
    const code = src('components/RoboticDog.tsx');
    // Currently only casts downward rays. Walls approached horizontally are invisible.
    const hasHorizontalRay =
      code.includes('rayDirVec') ||
      code.includes('horizontalRay') ||
      // Check for any ray direction that isn't purely downward
      /raycaster.*\.set\([^)]*new Vector3\(\s*[^0][^,]*,\s*0/m.test(code);

    expect(
      hasHorizontalRay,
      'No horizontal raycasts exist. The robot can walk straight through vertical walls ' +
      'because only downward rays are cast. Add forward/sideways collision rays.'
    ).toBe(true);
  });

  it('RoboticDog: should clamp per-frame movement to prevent tunneling', () => {
    const code = src('components/RoboticDog.tsx');
    // At low FPS, speed*delta can exceed wall thickness, skipping through geometry.
    // WALK_SPEED=12, at 10fps → delta=0.1 → moveDist=1.2 units/frame
    const hasMoveClamping =
      code.includes('MAX_MOVE_PER_FRAME') ||
      code.includes('Math.min(Math.abs(') && code.includes('moveDist');

    expect(
      hasMoveClamping,
      'No per-frame movement clamping. At low FPS (10fps), the robot moves 1.2 units/frame, ' +
      'enough to tunnel through thin walls. Clamp moveDist to ~0.8 units.'
    ).toBe(true);
  });

  it('RoboticDog: ground snap range should catch sub-ground clips', () => {
    const code = src('components/RoboticDog.tsx');
    // Check for either a literal value >= -5.0 or a named constant (GROUND_SNAP_RANGE)
    const literalMatch = code.match(/distToGround\s*>\s*(-[\d.]+)/);
    const hasConstant = code.includes('GROUND_SNAP_RANGE');

    if (hasConstant) {
      // If using a constant, check its value
      const constMatch = code.match(/GROUND_SNAP_RANGE\s*=\s*(-[\d.]+)/);
      const snapRange = constMatch ? parseFloat(constMatch[1]) : 0;
      expect(
        snapRange,
        `GROUND_SNAP_RANGE is ${snapRange}. Should be at least -5.0.`
      ).toBeLessThanOrEqual(-5.0);
    } else {
      const snapRange = literalMatch ? parseFloat(literalMatch[1]) : 0;
      expect(
        snapRange,
        `Ground snap range is ${snapRange}. Should be at least -5.0.`
      ).toBeLessThanOrEqual(-5.0);
    }
  });

  it('RoboticDog: void respawn threshold should be higher than -50', () => {
    const code = src('components/RoboticDog.tsx');
    // Check for literal or constant-based threshold
    const hasConstant = code.includes('VOID_THRESHOLD');
    if (hasConstant) {
      const constMatch = code.match(/VOID_THRESHOLD\s*=\s*(-[\d.]+)/);
      const threshold = constMatch ? parseFloat(constMatch[1]) : -50;
      expect(
        threshold,
        `VOID_THRESHOLD is ${threshold}. Should be -20 or higher.`
      ).toBeGreaterThanOrEqual(-20);
    } else {
      const match = code.match(/nextY\s*<\s*(-[\d.]+)/);
      const threshold = match ? parseFloat(match[1]) : -50;
      expect(
        threshold,
        `Void threshold is ${threshold}. Should be -20 or higher.`
      ).toBeGreaterThanOrEqual(-20);
    }
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

  it('FactoryScenery: SiloGroup should share geometry/material', () => {
    const code = src('components/FactoryScenery.tsx');
    // SiloGroup creates 3 separate meshes with identical geometry and material.
    // These should use Instances (like DistantBuildings does).
    const siloBlock = code.slice(
      code.indexOf('const SiloGroup'),
      code.indexOf('const OverheadBeam')
    );
    const meshCount = (siloBlock.match(/<mesh/g) || []).length;
    const usesInstances = siloBlock.includes('<Instance');

    expect(
      usesInstances || meshCount <= 1,
      `SiloGroup creates ${meshCount} separate meshes with identical geometry/material. ` +
      'Use <Instances> like DistantBuildings to share GPU resources.'
    ).toBe(true);
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
  it('RoboticDog: should not call getObjectByName every frame unconditionally', () => {
    const code = src('components/RoboticDog.tsx');
    const useFrameBody = code.slice(code.indexOf('useFrame('));
    // getObjectByName should be cached behind a ref check, not called unconditionally.
    // Acceptable: `if (!terrainRef.current) { terrainRef.current = globalScene.getObjectByName(...) }`
    // Not acceptable: `const terrainGroup = globalScene.getObjectByName(...)` every frame
    const hasCachedLookup = code.includes('terrainRef') && useFrameBody.includes('terrainRef.current');
    const hasUnconditionalLookup = /const terrainGroup\s*=\s*globalScene\.getObjectByName/.test(useFrameBody);
    expect(
      hasCachedLookup && !hasUnconditionalLookup,
      'getObjectByName should be cached in a ref, not called unconditionally every frame.'
    ).toBe(true);
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
