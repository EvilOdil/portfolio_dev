import { Vector3, Raycaster, Object3D } from 'three';
import { CatmullRomCurve3 } from 'three';

// 3-unit cells over the ±90 playable area → 60×60 = 3600 cells.
// Fine enough that doorways survive the wall-clearance dilation.
export const CELL = 3;
export const HALF = 90;
export const COLS = Math.ceil((2 * HALF) / CELL); // 60

// Planning clearance from walls ≈ the dog's body radius. Deliberately below
// the runtime WALL_DETECT_DIST (3.0): the dog only blocks on walls in its
// movement direction and slides otherwise, so parallel wall passes are fine
// — while larger values fragment the factory floor around its machinery.
const WALL_CLEARANCE = 1.5;

// Max height difference between adjacent cells the route may cross.
// Kept well below the runtime climb ceiling (GROUND_CLEARANCE, 1.6): the
// factory's machine tops sit ~1.2-1.3 above the surrounding floor, and at
// 1.5 the planner treated them as terraced floor and hopped across them.
// Real floor transitions on the tour are all ≤1.0. Transitions are
// symmetric because scrolling back drives the same path in reverse.
export const MAX_STEP = 1.0;

// A surface needs this much clear space above it to walk under/on.
// The runtime has no ceiling check at all, so keep this permissive: just
// enough that a level under a beam/pipe crossing the sample point survives.
const HEADROOM = 2.5;
// Surfaces above this are roof structure, never tour floor.
const MAX_WALKABLE_Y = 25;
// Levels stored per cell (factory has ground + apron + mezzanine ≈ 3).
const MAX_LEVELS = 4;

function cellKey(col: number, row: number): number {
  return row * COLS + col;
}

function worldToCell(wx: number, wz: number): [number, number] {
  return [
    Math.max(0, Math.min(COLS - 1, Math.floor((wx + HALF) / CELL))),
    Math.max(0, Math.min(COLS - 1, Math.floor((wz + HALF) / CELL))),
  ];
}

function cellToWorld(col: number, row: number): [number, number] {
  return [col * CELL - HALF + CELL * 0.5, row * CELL - HALF + CELL * 0.5];
}

/**
 * Height-aware occupancy: each cell lists its walkable surface heights
 * (ascending). Multi-level — the factory main floor sits at y≈2.5-4 with
 * raised aprons and mezzanines; a flat grid at one probe height cannot
 * represent it (and previously planned routes UNDER the floor slab on the
 * invisible y=0 ground plane).
 */
export interface NavGrid {
  levels: number[][]; // indexed by cellKey
}

/** Level of `cell` within MAX_STEP of height h, or null. */
function levelNear(grid: NavGrid, key: number, h: number): number | null {
  let best: number | null = null;
  for (const y of grid.levels[key]) {
    if (Math.abs(y - h) <= MAX_STEP && (best === null || Math.abs(y - h) < Math.abs(best - h))) {
      best = y;
    }
  }
  return best;
}

/**
 * Sample the terrain into a layered nav grid. For every cell, collect all
 * downward-ray surfaces, keep those with ≥HEADROOM clear above (rejects the
 * under-slab gap and anything under low pipes) and ≤MAX_WALKABLE_Y (rejects
 * roofs), then require WALL_CLEARANCE at body height on each kept level.
 * Meant to run against BVH-accelerated, double-sided meshes (scripts/bakePath.ts).
 */
export function buildNavGrid(terrain: Object3D): NavGrid {
  const ray = new Raycaster();
  const down = new Vector3(0, -1, 0);
  const D = Math.SQRT1_2;
  const wallDirs = [
    new Vector3(1, 0, 0), new Vector3(-1, 0, 0),
    new Vector3(0, 0, 1), new Vector3(0, 0, -1),
    new Vector3(D, 0, D), new Vector3(D, 0, -D),
    new Vector3(-D, 0, D), new Vector3(-D, 0, -D),
  ];
  const origin = new Vector3();
  const levels: number[][] = Array.from({ length: COLS * COLS }, () => []);

  // Each cell is probed at its centre plus four offsets: factory floors are
  // strewn with machinery, and a pipe or conveyor crossing the single centre
  // point would otherwise erase a perfectly walkable cell.
  const SUB = CELL / 4;
  const probeOffsets: Array<[number, number]> = [
    [0, 0], [SUB, SUB], [SUB, -SUB], [-SUB, SUB], [-SUB, -SUB],
  ];

  for (let row = 0; row < COLS; row++) {
    for (let col = 0; col < COLS; col++) {
      const [cx, cz] = cellToWorld(col, row);
      const walkable: number[] = [];

      for (const [ox, oz] of probeOffsets) {
        const wx = cx + ox;
        const wz = cz + oz;
        origin.set(wx, 60, wz);
        ray.set(origin, down);
        ray.far = 120;
        const hits = ray.intersectObject(terrain, true);

        // Dedupe near-coincident surfaces, highest first
        const surfaces: number[] = [];
        for (const hit of hits) {
          const y = hit.point.y;
          if (!surfaces.some(v => Math.abs(v - y) < 0.2)) surfaces.push(y);
        }

        for (let i = 0; i < surfaces.length; i++) {
          const y = surfaces[i];
          if (y > MAX_WALKABLE_Y) continue;
          const ceiling = i === 0 ? Infinity : surfaces[i - 1];
          if (ceiling - y < HEADROOM) continue;
          if (walkable.some(v => Math.abs(v - y) < 0.5)) continue; // already found

          // Wall clearance at body height on this level, from this probe point
          let blocked = false;
          origin.set(wx, y + 1.6, wz);
          for (const dir of wallDirs) {
            ray.set(origin, dir);
            ray.far = WALL_CLEARANCE;
            if (ray.intersectObject(terrain, true).length > 0) { blocked = true; break; }
          }
          if (!blocked) walkable.push(y);
        }
      }

      levels[cellKey(col, row)] = walkable.sort((a, b) => a - b).slice(0, MAX_LEVELS);
    }
  }

  return { levels };
}

/** BFS to the nearest cell with a walkable level; picks the level closest to yHint. */
function nearestNode(
  grid: NavGrid,
  wx: number,
  wz: number,
  yHint: number
): { col: number; row: number; h: number } {
  const [c0, r0] = worldToCell(wx, wz);
  const visited = new Uint8Array(COLS * COLS);
  const q: Array<[number, number]> = [[c0, r0]];
  let head = 0;
  while (head < q.length) {
    const [c, r] = q[head++];
    if (c < 0 || c >= COLS || r < 0 || r >= COLS) continue;
    const k = cellKey(c, r);
    if (visited[k]) continue;
    visited[k] = 1;
    const ls = grid.levels[k];
    if (ls.length > 0) {
      let best = ls[0];
      for (const y of ls) if (Math.abs(y - yHint) < Math.abs(best - yHint)) best = y;
      return { col: c, row: r, h: best };
    }
    q.push([c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1]);
  }
  return { col: c0, row: r0, h: yHint };
}

interface PathNode {
  col: number;
  row: number;
  h: number;
}

/**
 * Height-tracking line-of-sight (Bresenham supercover). Walks the line
 * keeping a running height; every crossed cell must offer a level within
 * MAX_STEP of it, and diagonal steps require both cardinal neighbours to
 * be compatible too (no squeezing between diagonally-touching obstacles).
 */
function lineOfSight(grid: NavGrid, a: PathNode, b: PathNode): boolean {
  let x0 = a.col, y0 = a.row;
  const x1 = b.col, y1 = b.row;
  let h = a.h;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  for (;;) {
    const lvl = levelNear(grid, cellKey(x0, y0), h);
    if (lvl === null) return false;
    h = lvl;
    if (x0 === x1 && y0 === y1) return true;
    const e2 = 2 * err;
    const stepX = e2 > -dy;
    const stepY = e2 < dx;
    if (stepX && stepY) {
      if (levelNear(grid, cellKey(x0 + sx, y0), h) === null) return false;
      if (levelNear(grid, cellKey(x0, y0 + sy), h) === null) return false;
    }
    if (stepX) { err -= dy; x0 += sx; }
    if (stepY) { err += dx; y0 += sy; }
  }
}

/** Greedy string-pull over the level-aware LOS. */
function stringPull(path: PathNode[], grid: NavGrid): PathNode[] {
  if (path.length <= 2) return path;
  const out: PathNode[] = [path[0]];
  let anchor = 0;
  for (let i = 2; i < path.length; i++) {
    if (!lineOfSight(grid, path[anchor], path[i])) {
      out.push(path[i - 1]);
      anchor = i - 1;
    }
  }
  out.push(path[path.length - 1]);
  return out;
}

/** A* over (cell, level) nodes with 8-directional, step-limited movement. */
function astar(grid: NavGrid, from: PathNode, to: PathNode): PathNode[] {
  const size = COLS * COLS * MAX_LEVELS;
  const nodeId = (k: number, li: number) => k * MAX_LEVELS + li;

  const endKey = cellKey(to.col, to.row);
  const h2 = (c: number, r: number) => Math.hypot(c - to.col, r - to.row);
  const INF = 1e9;

  const gScore = new Float32Array(size).fill(INF);
  const fScore = new Float32Array(size).fill(INF);
  const parent = new Int32Array(size).fill(-1);
  const inOpen = new Uint8Array(size);
  const closed = new Uint8Array(size);

  const startKey = cellKey(from.col, from.row);
  const startLi = grid.levels[startKey].indexOf(from.h);
  const endLi = grid.levels[endKey].indexOf(to.h);
  if (startLi < 0 || endLi < 0) return [from, to];
  const startId = nodeId(startKey, startLi);
  const endId = nodeId(endKey, endLi);

  gScore[startId] = 0;
  fScore[startId] = h2(from.col, from.row);
  inOpen[startId] = 1;
  const openList: number[] = [startId];

  const DIRS: Array<[number, number, number]> = [
    [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
    [-1, -1, 1.414], [-1, 1, 1.414], [1, -1, 1.414], [1, 1, 1.414],
  ];

  while (openList.length > 0) {
    let minI = 0;
    for (let i = 1; i < openList.length; i++) {
      if (fScore[openList[i]] < fScore[openList[minI]]) minI = i;
    }
    const curr = openList[minI];
    openList.splice(minI, 1);
    inOpen[curr] = 0;

    if (curr === endId) {
      const path: PathNode[] = [];
      let id = curr;
      while (id !== -1) {
        const k = Math.floor(id / MAX_LEVELS);
        const li = id % MAX_LEVELS;
        path.unshift({ col: k % COLS, row: Math.floor(k / COLS), h: grid.levels[k][li] });
        id = parent[id];
      }
      return path;
    }

    closed[curr] = 1;
    const ck = Math.floor(curr / MAX_LEVELS);
    const ch = grid.levels[ck][curr % MAX_LEVELS];
    const cc = ck % COLS;
    const cr = Math.floor(ck / COLS);

    for (const [dc, dr, cost] of DIRS) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= COLS) continue;
      const nk = cellKey(nc, nr);
      // Diagonal move: both cardinal neighbours must be passable at this height
      if (dc !== 0 && dr !== 0 &&
          (levelNear(grid, cellKey(cc, nr), ch) === null ||
           levelNear(grid, cellKey(nc, cr), ch) === null)) continue;

      for (let li = 0; li < grid.levels[nk].length; li++) {
        const nh = grid.levels[nk][li];
        if (Math.abs(nh - ch) > MAX_STEP) continue;
        const id = nodeId(nk, li);
        if (closed[id]) continue;
        // Small height penalty keeps the route flat unless a climb pays off
        const ng = gScore[curr] + cost + Math.abs(nh - ch);
        if (ng < gScore[id]) {
          parent[id] = curr;
          gScore[id] = ng;
          fScore[id] = ng + h2(nc, nr);
          if (!inOpen[id]) { inOpen[id] = 1; openList.push(id); }
        }
      }
    }
  }

  // A* could not find a path — fall back to straight line between cells.
  // This plows through obstacles; loud warning so bakes never ship it silently.
  console.warn(
    `[pathPlanner] A* found no route (${from.col},${from.row},h=${from.h.toFixed(1)}) → ` +
    `(${to.col},${to.row},h=${to.h.toFixed(1)}); using straight-line fallback`
  );
  return [from, to];
}

/**
 * Plan a smooth obstacle-aware path through all zones in order.
 * `zones` are [x, z, yHint] — yHint selects the floor level at multi-level
 * cells (zone marker heights track their floor). Each consecutive pair is
 * joined by an A* route, string-pulled, densified, and smoothed into a
 * single CatmullRomCurve3. The curve is XZ-only; the runtime dog derives
 * height from its ground snap while following it.
 */
export function buildAutoPath(
  zones: Array<[number, number, number]>,
  grid: NavGrid
): CatmullRomCurve3 {
  // Densify string-pulled segments to this spacing before smoothing.
  // CatmullRom cuts corners between sparse waypoints — extra collinear
  // points pin the spline to the collision-checked polyline.
  const MAX_SEG = 4;
  const waypoints: Vector3[] = [];

  const pushSegment = (ax: number, az: number, bx: number, bz: number, includeStart: boolean) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / MAX_SEG));
    for (let s = includeStart ? 0 : 1; s <= steps; s++) {
      const t = s / steps;
      waypoints.push(new Vector3(ax + (bx - ax) * t, 0, az + (bz - az) * t));
    }
  };

  const nodes = zones.map(([x, z, y]) => nearestNode(grid, x, z, y));

  for (let i = 0; i < nodes.length - 1; i++) {
    const raw = astar(grid, nodes[i], nodes[i + 1]);
    const thinned = stringPull(raw, grid);
    for (let j = 0; j < thinned.length - 1; j++) {
      const [ax, az] = cellToWorld(thinned[j].col, thinned[j].row);
      const [bx, bz] = cellToWorld(thinned[j + 1].col, thinned[j + 1].row);
      pushSegment(ax, az, bx, bz, waypoints.length === 0);
    }
  }

  if (waypoints.length >= 2) {
    return new CatmullRomCurve3(waypoints, false, 'centripetal');
  }

  // Ultimate fallback: direct spline through zone positions
  return new CatmullRomCurve3(
    zones.map(([x, z]) => new Vector3(x, 0, z)),
    false,
    'centripetal'
  );
}

/**
 * Validate sampled route points against the nav grid by walking them with a
 * running height (same climb limit as the runtime dog). Returns the indices
 * of samples with no compatible walkable level.
 */
export function validateRoute(
  grid: NavGrid,
  points: Array<{ x: number; z: number }>,
  startY: number
): number[] {
  const bad: number[] = [];
  let h = startY;
  for (let i = 0; i < points.length; i++) {
    const [c, r] = worldToCell(points[i].x, points[i].z);
    const lvl = levelNear(grid, cellKey(c, r), h);
    if (lvl === null) {
      bad.push(i);
    } else {
      h = lvl;
    }
  }
  return bad;
}

/** Nearest walkable level at a world position (for spawn checks / debug). */
export function walkableLevelsAt(grid: NavGrid, wx: number, wz: number): number[] {
  const [c, r] = worldToCell(wx, wz);
  return grid.levels[cellKey(c, r)];
}
