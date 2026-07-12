/**
 * Offline path baking script.
 * Run once (or after changing zone positions / the factory model):  npm run bake-path
 * Outputs services/bakedPath.ts — commit that file; the browser loads it instantly.
 *
 * Strategy: decode the actual factory GLB (Draco) in Node, replicate the
 * exact auto-scale/center transform FactoryWorld applies in the browser,
 * then raycast a real occupancy grid (double-sided, BVH-accelerated — same
 * collision semantics as services/collision.ts). A* + string-pull finds
 * obstacle-free routes between consecutive zones; the smoothed curve is
 * sampled into a dense waypoint list and validated against the grid.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from 'three';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3d';
import { buildNavGrid, buildAutoPath, validateRoute, CELL, HALF, COLS } from '../services/pathPlanner.js';
import { PORTFOLIO_DATA } from '../services/portfolioData.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// BVH-accelerated raycasting (900 cells × 9 rays against 107 meshes)
(Mesh.prototype as any).raycast = acceleratedRaycast;

// --- 1. Decode the factory GLB ----------------------------------------------
const io = new NodeIO()
  .registerExtensions(KHRONOS_EXTENSIONS)
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });

const glbPath = join(__dirname, '../public/models/factory_2_draco.glb');
const doc = await io.read(glbPath);

// Double-sided so triangle winding can't hide a wall from the planner —
// identical semantics to the runtime collision module.
const collisionMaterial = new MeshBasicMaterial({ side: DoubleSide });
const TRIANGLES = 4;

const model = new Group();
const worldMat = new Matrix4();
let triangleCount = 0;

for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  worldMat.fromArray(node.getWorldMatrix());

  for (const prim of mesh.listPrimitives()) {
    if (prim.getMode() !== TRIANGLES) continue;
    const position = prim.getAttribute('POSITION');
    if (!position) continue;

    const geom = new BufferGeometry();
    geom.setAttribute('position', new BufferAttribute(new Float32Array(position.getArray()!), 3));
    const indices = prim.getIndices();
    if (indices) geom.setIndex(new BufferAttribute(indices.getArray()!, 1));
    geom.applyMatrix4(worldMat); // bake the node's glTF-world transform

    (geom as any).boundsTree = new MeshBVH(geom);
    model.add(new Mesh(geom, collisionMaterial));
    triangleCount += (indices ? indices.getCount() : position.getCount()) / 3;
  }
}

// --- 2. Replicate FactoryWorld's auto-scale / center transform --------------
// Must stay byte-identical to components/FactoryWorld.tsx or the grid is
// misaligned with what the browser renders.
const box = new Box3().setFromObject(model);
const size = box.getSize(new Vector3());
const center = box.getCenter(new Vector3());
const TARGET_SIZE = 300;
const maxDim = Math.max(size.x, size.z);
const scaleFactor = maxDim > 0 ? TARGET_SIZE / maxDim : 1;

model.scale.setScalar(scaleFactor);
model.position.set(-center.x * scaleFactor, -box.min.y * scaleFactor, -center.z * scaleFactor);

// NOTE: the runtime's invisible y=0 safety plane is deliberately NOT part
// of the nav terrain. It is not real floor — including it gave every cell a
// phantom walkable level at y≈0 (green tiles in the overlay) that let the
// planner tunnel underneath raised structures.
const terrain = new Group();
terrain.add(model);
terrain.updateMatrixWorld(true);

console.log(`✓ Decoded factory model: ${model.children.length} meshes, ${Math.round(triangleCount)} triangles`);
console.log(`  scale ${scaleFactor.toFixed(4)}, footprint ${(size.x * scaleFactor).toFixed(0)}×${(size.z * scaleFactor).toFixed(0)}`);

// --- 3. Layered nav grid from real geometry ----------------------------------
// Height-aware: the factory main floor sits at y≈2.5-4 with raised aprons
// and mezzanines. A flat grid probed at one height planned routes under the
// floor slab; the layered grid walks the same surfaces the runtime dog does.
const grid = buildNavGrid(terrain);

// Manually blocked cells [col, row] — user-verified raised structures whose
// bases the probes misread as walkable floor (tall solid blocks report a
// phantom interior level; their footprints show overhead surfaces ~22 high).
const MANUAL_BLOCKED: Array<[number, number]> = [
  [24, 19],
  [24, 20],
  // Ledge lip between the big slope (cols 37-41) and the raised east floor
  // (cols 42+). Cell-centre deltas here read as 0.6-1.0 "steps", but in
  // reality it is a sharp elevated-floor edge the dog bangs into. The only
  // real crossing is the flat gate at rows 19-20 (near cell 40,20).
  [41, 21],
  [41, 22],
];
for (const [c, r] of MANUAL_BLOCKED) grid.levels[r * COLS + c] = [];

const walkableCells = grid.levels.filter(l => l.length > 0).length;
const multiLevel = grid.levels.filter(l => l.length > 1).length;
console.log(`✓ Nav grid: ${walkableCells}/${grid.levels.length} cells walkable (${multiLevel} multi-level)`);

// --- 4. A* path planning ------------------------------------------------------
// Zone marker y doubles as the floor-level hint at multi-level cells.
type Anchor = [number, number, number];
const zoneAnchor = (i: number): Anchor => [
  PORTFOLIO_DATA[i].position[0],
  PORTFOLIO_DATA[i].position[2],
  PORTFOLIO_DATA[i].position[1],
];
const via = (col: number, row: number, yHint: number): Anchor => [
  col * CELL - HALF + CELL * 0.5,
  row * CELL - HALF + CELL * 0.5,
  yHint,
];

// User-verified door via-points (checked against the in-app grid overlay):
// the hall around zone 1 has exactly two real exits — the grid only detects
// fragments of its walls, so legs crossing the hall boundary are pinned
// through the doors instead of trusting A* shortcuts.
//   west door: col 25, rows 16-18 (tight)
//   east door: col 40, rows 20-23
const HALL_FLOOR = 3.5;
// Zones are laid out along one continuous sweep (see portfolioData.ts), so
// the route crosses each boundary exactly once:
//   west door (col 25, rows 16-18) between stops 1 → 2 (hall exit toward
//   the ramp), then the flat east gate (rows 19-20, near cell 40,20)
//   between stops 5 → 6
const ROUTE: Anchor[] = [
  zoneAnchor(0),                                      // 1 summary — hall
  via(25, 16, HALL_FLOOR), via(25, 18, HALL_FLOOR),   // west door, southbound
  zoneAnchor(1),                                      // 2 experience — ramp bottom
  zoneAnchor(2),                                      // 3 publications — south floor W
  zoneAnchor(3),                                      // 4 projects — south yard
  zoneAnchor(4),                                      // 5 education — south floor E
  // Climb the slope northward and enter the hall through the flat gate near
  // cell 40,20 (the raised east floor's only real entrance — the rest of the
  // boundary is a sharp ledge).
  via(40, 20, 3.8),
  zoneAnchor(5),                                      // 6 awards — main hall E
  via(40, 20, 3.8), via(43, 20, 4.0),                 // back out the gate, eastbound
  zoneAnchor(6),                                      // 7 speeches — east floor mid
  zoneAnchor(7),                                      // 8 blog — east floor S
];
const curve = buildAutoPath(ROUTE, grid);

// Sample 300 evenly-spaced points along the planned curve (dense enough that
// the browser CatmullRomCurve3 faithfully reproduces the intended trajectory).
const SAMPLES = 300;
const raw = curve.getPoints(SAMPLES);

// --- 5. Validate the sampled path against the grid ---------------------------
// Walk the samples with a running height, exactly like the runtime dog.
const bad = validateRoute(grid, raw, PORTFOLIO_DATA[0].position[1]);
if (bad.length > 0) {
  console.warn(`⚠ ${bad.length}/${raw.length} samples have no reachable walkable level:`);
  for (const i of bad.slice(0, 10)) {
    console.warn(`    #${i} (${raw[i].x.toFixed(1)}, ${raw[i].z.toFixed(1)})`);
  }
  console.warn('  The runtime wall raycasts are a safety net, but consider re-tuning.');
} else {
  console.log(`✓ All ${raw.length} path samples track a walkable level`);
}

// Round to 3 decimal places to keep the file small
const waypoints: Array<[number, number]> = raw.map(p => [
  Math.round(p.x * 1000) / 1000,
  Math.round(p.z * 1000) / 1000,
]);

// Arc-fraction of each zone along the curve, monotonic. The scroll UI snaps
// notch steps to these instead of assuming zones are evenly spaced — the legs
// have very different lengths, so t = k/7 stopped the dog cells past a zone.
const zoneProgress: number[] = [];
let searchFrom = 0;
for (const z of PORTFOLIO_DATA) {
  const [zx, , zz] = z.position;
  let best = searchFrom;
  let bestD = Infinity;
  for (let i = searchFrom; i < raw.length; i++) {
    const d = Math.hypot(raw[i].x - zx, raw[i].z - zz);
    if (d < bestD) { bestD = d; best = i; }
  }
  zoneProgress.push(Math.round((best / (raw.length - 1)) * 10000) / 10000);
  searchFrom = best;
}
zoneProgress[0] = 0;
zoneProgress[zoneProgress.length - 1] = 1;
console.log(`✓ Zone arc-fractions: ${zoneProgress.join(', ')}`);

// --- 6. Write output ----------------------------------------------------------
const out = `\
// Auto-generated by scripts/bakePath.ts — do not edit manually.
// Re-generate: npm run bake-path
export const BAKED_PATH: ReadonlyArray<[number, number]> = ${JSON.stringify(waypoints)} as const;
// Arc-fraction along BAKED_PATH where each zone sits (ascending, 0..1)
export const ZONE_PROGRESS: ReadonlyArray<number> = ${JSON.stringify(zoneProgress)} as const;
`;

const dest = join(__dirname, '../services/bakedPath.ts');
writeFileSync(dest, out);

console.log(`✓ Baked ${waypoints.length} waypoints through ${PORTFOLIO_DATA.length} zones`);
console.log(`  → ${dest}`);

// --- 7. Emit the nav grid for the in-app debug overlay ------------------------
// Rendered by components/GridOverlay.tsx (toggle: 'G' key or ?grid URL param).
const compactLevels = grid.levels.map(ls => ls.map(y => Math.round(y * 10) / 10));
const gridOut = `\
// Auto-generated by scripts/bakePath.ts — do not edit manually.
// Re-generate: npm run bake-path
// Nav-grid snapshot for the in-app debug overlay (GridOverlay.tsx).
export const NAV_CELL = ${CELL};
export const NAV_HALF = ${HALF};
export const NAV_COLS = ${COLS};
// levels[row * NAV_COLS + col] = walkable surface heights (empty = blocked)
export const NAV_LEVELS: ReadonlyArray<ReadonlyArray<number>> = ${JSON.stringify(compactLevels)};
`;
const gridDest = join(__dirname, '../services/bakedNavGrid.ts');
writeFileSync(gridDest, gridOut);
console.log(`✓ Nav grid snapshot → ${gridDest}`);
